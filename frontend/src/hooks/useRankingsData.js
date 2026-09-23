"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, getWebSocketUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { withInstitutionDomains } from "@/lib/webometricsVisibility";
import {
  RANKING_SYSTEMS,
  buildNaacSystem,
  buildNirfSystem,
  getRatioNote,
} from "@/lib/rankings/frameworks";

function toInstitutionalData(excelData, institutionName) {
  const inst = excelData.institutional_data;
  return {
    totalStudents: inst.total_students,
    totalStudentsBreakdown: `${inst.ug_students} UG · ${inst.pg_students} PG`,
    internationalStudents: inst.international_students,
    internationalStudentsCount: `${Math.round(
      (parseFloat(inst.international_students) / 100) * inst.total_students
    )} of ${inst.total_students}`,
    femaleRatio: inst.female_ratio,
    femaleCount: `${Math.round((parseFloat(inst.female_ratio) / 100) * inst.total_students)} of ${
      inst.total_students
    }`,
    avgGPA: inst.avg_gpa,
    faculty: inst.faculty,
    facultySchools: `${inst.schools_faculties} schools`,
    studentFacultyRatio: inst.student_faculty_ratio,
    ratioNote: getRatioNote(inst.student_faculty_ratio),
    researchStudents: inst.research_students,
    researchBreakdown: "MSc/MA by Research",
    activeNationalities: inst.nationalities,
    nationalitiesRegion: "across Africa",
    academicYear: "2023/24",
    semester: "Sem 1",
    institutionName,
    rankingsData: excelData.rankings,
  };
}

/**
 * Loads everything the rankings pages score from:
 *  - institutional data (Excel/SIS feed)
 *  - live Webometrics visibility
 *  - live refresh over /ws/rankings (reconnects with back-off)
 *
 * Unlike the original page, a failed load returns `error` - it never
 * substitutes placeholder figures.
 */
export function useRankingsData() {
  const { user } = useAuth();
  const institutionName = user?.institution_name || "Institution";
  const [institutionalData, setInstitutionalData] = useState(null);
  const [visibilityLive, setVisibilityLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const excelData = await apiFetch("/rankings-excel/dashboard-data");
      if (!mounted.current) return;
      setInstitutionalData(toInstitutionalData(excelData, institutionName));
      setError(null);
      setUpdatedAt(new Date());
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : "Unable to load institutional data");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [institutionName]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/rankings/webometrics/visibility")
      .then((assessment) => {
        if (!cancelled) setVisibilityLive(assessment);
      })
      .catch((err) => {
        if (cancelled) return;
        setVisibilityLive({
          live: false,
          ahrefs: { status: "provider_error", referring_domains: null, message: err?.message },
          scoring: { score: 0, status: "No data", band: "api_error" },
          canonical_domain: user?.institution_primary_domain || null,
          registered_domains: user?.institution_domains || [],
        });
      });
    return () => {
      cancelled = true;
    };
  }, [user?.institution_domains, user?.institution_primary_domain]);

  // Live refresh when the source workbook changes.
  useEffect(() => {
    let ws;
    let retry = 0;
    let retryTimer;
    let pingTimer;
    let closed = false;

    const connect = () => {
      try {
        ws = new WebSocket(getWebSocketUrl("/ws/rankings"));
      } catch {
        return;
      }
      ws.onopen = () => {
        retry = 0;
      };
      ws.onmessage = (event) => {
        try {
          if (JSON.parse(event.data)?.type === "rankings_update") load();
        } catch {
          /* ignore non-JSON pings */
        }
      };
      ws.onclose = () => {
        if (closed) return;
        retry = Math.min(retry + 1, 6);
        retryTimer = setTimeout(connect, 1000 * 2 ** retry);
      };
    };

    connect();
    pingTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) ws.send("ping");
    }, 30000);

    return () => {
      closed = true;
      clearTimeout(retryTimer);
      clearInterval(pingTimer);
      ws?.close();
    };
  }, [load]);

  const systems = useMemo(() => {
    if (!institutionalData) return [];
    return withInstitutionDomains(
      [...RANKING_SYSTEMS, buildNaacSystem(institutionalData), buildNirfSystem(institutionalData)],
      {
        domains: user?.institution_domains || [],
        primaryDomain: user?.institution_primary_domain || null,
        liveAssessment: visibilityLive,
      }
    );
  }, [institutionalData, visibilityLive, user?.institution_domains, user?.institution_primary_domain]);

  return {
    user,
    institutionName,
    institutionalData,
    systems,
    loading,
    error,
    updatedAt,
    reload: load,
  };
}
