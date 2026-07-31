"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { calcApplicationProgress } from "@/lib/scholarshipSchemas";

const DEBOUNCE_MS = 10000;

function localKey(studentId, scholId) {
  return `templumis_scholarship_draft_${studentId}_${scholId}`;
}

export function useScholarshipDraft(scholId, scholarship, profile, user) {
  const [formData, setFormData] = useState({});
  const [references, setReferences] = useState([]);
  const [ferpaWaived, setFerpaWaived] = useState(null);
  const [progressPct, setProgressPct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [offline, setOffline] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState("");
  const timerRef = useRef(null);
  const pendingRef = useRef(null);

  const studentId = profile?.student?.student_id || user?.student_registration_number;

  const persistLocal = useCallback(
    (payload) => {
      if (!studentId || !scholId || typeof window === "undefined") return;
      try {
        localStorage.setItem(
          localKey(studentId, scholId),
          JSON.stringify({ ...payload, saved_at: new Date().toISOString() })
        );
      } catch {
        /* ignore */
      }
    },
    [studentId, scholId]
  );

  const flushSave = useCallback(
    async (payload) => {
      if (!scholId || !scholarship) return;
      setSaving(true);
      setError("");
      try {
        const res = await apiFetch(`/sis-lms/scholarships/applications/draft/${scholId}`, {
          method: "PATCH",
          body: payload,
        });
        setProgressPct(res.progress_pct ?? calcApplicationProgress(scholarship, payload.form_data, payload.references));
        setLastSaved(res.saved_at || new Date().toISOString());
        setOffline(false);
        if (studentId) {
          localStorage.removeItem(localKey(studentId, scholId));
        }
      } catch (e) {
        setOffline(true);
        persistLocal(payload);
        setError("");
      } finally {
        setSaving(false);
      }
    },
    [scholId, scholarship, studentId, persistLocal]
  );

  const scheduleSave = useCallback(
    (nextForm, nextRefs, nextFerpa) => {
      const payload = {
        form_data: nextForm,
        references: nextRefs,
        ferpa_waived: nextFerpa,
      };
      pendingRef.current = payload;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        flushSave(pendingRef.current);
      }, DEBOUNCE_MS);
    },
    [flushSave]
  );

  useEffect(() => {
    if (!scholId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/sis-lms/scholarships/applications/draft/${scholId}`);
        if (cancelled) return;
        const d = res.draft || {};
        const fd = d.form_data || {};
        setFormData(fd);
        setReferences(d.references || []);
        setFerpaWaived(d.ferpa_waived ?? null);
        setProgressPct(d.progress_pct || 0);
        setLastSaved(d.updated_at);
      } catch (e) {
        if (!cancelled) {
          const local = studentId && typeof window !== "undefined"
            ? localStorage.getItem(localKey(studentId, scholId))
            : null;
          if (local) {
            try {
              const parsed = JSON.parse(local);
              setFormData(parsed.form_data || {});
              setReferences(parsed.references || []);
              setFerpaWaived(parsed.ferpa_waived ?? null);
              setOffline(true);
            } catch {
              setError(e.message);
            }
          } else {
            setError(e.message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scholId, studentId]);

  const updateFormData = useCallback(
    (patch) => {
      setFormData((prev) => {
        const next = { ...prev, ...patch };
        const pct = calcApplicationProgress(scholarship, next, references);
        setProgressPct(pct);
        scheduleSave(next, references, ferpaWaived);
        return next;
      });
    },
    [scholarship, references, ferpaWaived, scheduleSave]
  );

  const updateReferences = useCallback(
    (nextRefs) => {
      setReferences(nextRefs);
      const pct = calcApplicationProgress(scholarship, formData, nextRefs);
      setProgressPct(pct);
      scheduleSave(formData, nextRefs, ferpaWaived);
    },
    [scholarship, formData, ferpaWaived, scheduleSave]
  );

  const setFerpa = useCallback(
    (value) => {
      setFerpaWaived(value);
      scheduleSave(formData, references, value);
    },
    [formData, references, scheduleSave]
  );

  const saveOnBlur = useCallback(() => {
    if (pendingRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      flushSave(pendingRef.current);
    }
  }, [flushSave]);

  useEffect(() => {
    if (!offline || !pendingRef.current) return;
    const onOnline = () => flushSave(pendingRef.current);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [offline, flushSave]);

  return {
    formData,
    references,
    ferpaWaived,
    progressPct,
    loading,
    saving,
    offline,
    lastSaved,
    error,
    updateFormData,
    updateReferences,
    setFerpa,
    saveOnBlur,
    flushSave,
  };
}
