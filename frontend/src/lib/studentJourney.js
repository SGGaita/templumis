/** Build student journey timeline from Excel Journey Tracker payload. */

import { inferStudentLevel } from "./studentLevel";

function progressionToStatus(val) {
  const v = String(val || "").toLowerCase();
  if (v.includes("complet") || v.includes("pass") || v.includes("cleared")) return "completed";
  if (v.includes("progress") || v.includes("active")) return "in_progress";
  if (v.includes("fail") || v.includes("suspend") || v.includes("probat")) return "at_risk";
  return "pending";
}

/** Parse e.g. "Year 2 Sem 1" → { year: 2, semester: 1 } */
export function parseCurrentYearSem(currentYearSem) {
  const text = String(currentYearSem || "");
  const yearMatch = text.match(/year\s*(\d+)/i);
  const semMatch = text.match(/sem(?:ester)?\s*(\d+)/i);
  return {
    year: yearMatch ? parseInt(yearMatch[1], 10) : 1,
    semester: semMatch ? parseInt(semMatch[1], 10) : 1,
  };
}

/** Semester statuses for a given year — only one semester is in_progress at a time. */
export function buildSemesterProgress(yearNumber, currentYear, currentSemester, academicProgression) {
  const ap = academicProgression || {};

  if (yearNumber < currentYear) {
    return [
      { semester: 1, status: "completed" },
      { semester: 2, status: "completed" },
    ];
  }
  if (yearNumber > currentYear) {
    return [
      { semester: 1, status: "pending" },
      { semester: 2, status: "pending" },
    ];
  }

  // Current academic year — derive from Excel columns for year 1, else from position in year
  if (yearNumber === 1) {
    const s1Raw = progressionToStatus(ap.sem_1_status);
    const s2Raw = progressionToStatus(ap.sem_2_status);
    let sem1 = s1Raw === "completed" ? "completed" : currentSemester === 1 ? "in_progress" : "pending";
    let sem2 = s2Raw === "completed" ? "completed" : currentSemester === 2 ? "in_progress" : "pending";
    if (sem1 === "in_progress") sem2 = s2Raw === "completed" ? "completed" : "pending";
    if (sem1 === "completed" && sem2 !== "completed" && currentSemester === 2) sem2 = "in_progress";
    return [{ semester: 1, status: sem1 }, { semester: 2, status: sem2 }];
  }

  const yearKey =
    yearNumber === 2 ? ap.year_2_progression : yearNumber >= 3 ? ap.year_3_progression : null;
  const yearOverall = progressionToStatus(yearKey);
  if (yearOverall === "completed") {
    return [
      { semester: 1, status: "completed" },
      { semester: 2, status: "completed" },
    ];
  }
  return [
    { semester: 1, status: currentSemester === 1 ? "in_progress" : currentSemester > 1 ? "completed" : "pending" },
    { semester: 2, status: currentSemester === 2 ? "in_progress" : "pending" },
  ];
}

function yearMilestoneStatus(yearNumber, currentYear, semesterProgress) {
  if (yearNumber < currentYear) return "completed";
  if (yearNumber > currentYear) return "pending";
  const anyInProgress = semesterProgress.some((s) => s.status === "in_progress");
  const allCompleted = semesterProgress.every((s) => s.status === "completed");
  if (allCompleted) return "completed";
  if (anyInProgress) return "in_progress";
  return "pending";
}

function formatYearNotes(yearNumber, semesterProgress) {
  const active = semesterProgress.find((s) => s.status === "in_progress");
  const done = semesterProgress.filter((s) => s.status === "completed").length;
  if (active) {
    return `Year ${yearNumber} · Semester ${active.semester} in progress (${done}/2 semesters complete)`;
  }
  if (done === 2) return `Year ${yearNumber} complete`;
  return `Year ${yearNumber} · not yet started`;
}

function estimateProgramYears(studentType, programmeLevel) {
  const t = `${studentType || ""} ${programmeLevel || ""}`.toLowerCase();
  if (t.includes("phd") || t.includes("doctor")) return 4;
  if (t.includes("master") || t.includes("msc") || t.includes("mba")) return 2;
  return 4;
}

/** Undergraduate / coursework timeline: enrollment → years → graduation (no separate Sem 1/2 nodes). */
export function buildUndergraduateMilestones(excelJourneyData) {
  const ap = excelJourneyData.academic_progression || {};
  const { year: currentYear, semester: currentSemester } = parseCurrentYearSem(
    excelJourneyData.current_year_sem
  );
  const enrollmentYear = excelJourneyData.enrolment_date
    ? new Date(excelJourneyData.enrolment_date).getFullYear()
    : new Date().getFullYear();
  const programYears = estimateProgramYears(
    excelJourneyData.student_type,
    excelJourneyData.programme_level
  );

  const milestones = [
    {
      id: 1,
      milestone_type: "enrollment",
      milestone_date: excelJourneyData.enrolment_date || `${enrollmentYear}-09-01`,
      status: "completed",
      notes: `Enrolled in ${excelJourneyData.programme_level} — ${excelJourneyData.department}`,
    },
  ];

  const pa = excelJourneyData.program_advisors || {};

  for (let y = 1; y <= programYears; y++) {
    const semesterProgress = buildSemesterProgress(y, currentYear, currentSemester, ap);
    const status = yearMilestoneStatus(y, currentYear, semesterProgress);
    milestones.push({
      id: y + 1,
      milestone_type: "academic_year",
      year_number: y,
      milestone_date: `${enrollmentYear + y - 1}-06-30`,
      status,
      semester_progress: semesterProgress,
      notes: formatYearNotes(y, semesterProgress),
      is_current_year: y === currentYear,
      programme_advisor: pa.primary,
    });
  }

  const grad = excelJourneyData.graduation || {};
  milestones.push({
    id: programYears + 2,
    milestone_type: "graduation",
    milestone_date: grad.graduation_date || `${enrollmentYear + programYears}-06-30`,
    status: grad.graduation_date
      ? "completed"
      : progressionToStatus(grad.clearance_status) === "in_progress"
        ? "in_progress"
        : "pending",
    notes: grad.graduation_date
      ? `Graduated ${grad.graduation_date}`
      : `Clearance: ${grad.clearance_status || "Not yet"}`,
  });

  return milestones;
}

function thesisPhaseStatus(val) {
  const v = String(val || "").toLowerCase();
  if (!v || v === "n/a") return "pending";
  if (v.includes("complet") || v.includes("approv") || v.includes("cleared") || v.includes("passed")) return "completed";
  if (v.includes("progress") || v.includes("active") || v.includes("draft") || v.includes("review") || v.includes("submitted")) {
    return "in_progress";
  }
  return "pending";
}

/** Build normalized advisor list from Excel journey payload. */
export function buildAdvisorList(excelJourneyData = {}) {
  const list = [];
  const push = (name, role) => {
    const n = String(name || "").trim();
    if (!n || n.toLowerCase() === "n/a") return;
    if (!list.some((a) => a.name === n && a.role === role)) list.push({ name: n, role });
  };

  const pa = excelJourneyData.program_advisors || {};
  push(pa.primary, pa.primary_role || "Programme Advisor");
  push(pa.co, "Co-Supervisor");

  const pg = excelJourneyData.pg_research || {};
  push(pg.supervisor, "Supervisor");
  push(pg.co_supervisor, "Co-Supervisor");

  const phd = excelJourneyData.phd_research || {};
  push(phd.principal_supervisor, "Principal Supervisor");
  push(phd.co_supervisor, "Co-Supervisor");

  (excelJourneyData.pg_academic_support || []).forEach((c) => {
    if (c.support_officer) push(c.support_officer, "Support Officer");
    if (c.supervisor) push(c.supervisor, "Supervisor");
  });

  return list;
}

function advisorsForMilestone(milestone, advisors, { isPostgrad, department }) {
  const researchSteps = new Set([
    "research_proposal",
    "coursework",
    "data_collection",
    "thesis_submission",
    "thesis_defence",
  ]);

  if (!advisors.length) {
    if (department) return [{ name: department, role: "Academic Advising Office" }];
    return [{ name: "Student Services", role: "Programme Advisor" }];
  }

  if (isPostgrad) {
    if (milestone.milestone_type === "enrollment") {
      return advisors.filter((a) => /supervisor|advisor|principal/i.test(a.role));
    }
    if (researchSteps.has(milestone.milestone_type)) {
      const research = advisors.filter((a) => /supervisor/i.test(a.role));
      return research.length ? research : advisors.slice(0, 2);
    }
    if (milestone.milestone_type === "graduation") {
      return advisors;
    }
    return advisors;
  }

  const programme = advisors.filter((a) => /programme|academic/i.test(a.role));
  return programme.length ? programme : advisors.slice(0, 1);
}

function attachAdvisorsToMilestones(milestones, excelJourneyData, isPostgrad) {
  const advisors = buildAdvisorList(excelJourneyData);
  const department = excelJourneyData.department;
  return milestones.map((m) => ({
    ...m,
    advisors: advisorsForMilestone(m, advisors, { isPostgrad, department }),
  }));
}

function pgMilestoneStatus(val) {
  const v = String(val || "").toLowerCase();
  if (!v || v === "n/a" || v === "tbd") return "pending";
  if (v.includes("complete") || v.includes("✓") || v.includes("graduated")) return "completed";
  if (v.includes("progress") || v.includes("phase") || v.includes("writing") || v.includes("review") || v.includes("⚠")) return "in_progress";
  if (v.includes("probation") || v.includes("fail")) return "at_risk";
  return thesisPhaseStatus(val);
}

/** Postgraduate / PhD research journey milestones. */
export function buildPostgraduateMilestones(excelJourneyData) {
  const rt = excelJourneyData.research_thesis || {};
  const pg = excelJourneyData.pg_research || {};
  const ms = pg.milestones || {};
  const grad = excelJourneyData.graduation || {};
  const enrol = excelJourneyData.enrolment_date || new Date().toISOString().slice(0, 10);
  const target = pg.expected_completion || pg.submission_target || enrol;

  const phaseDefs = [
    { type: "enrollment", label: "M1 Enrolment", raw: ms.m1_enrolment, fallback: "Enrolment complete" },
    { type: "research_proposal", label: "M2 Proposal", raw: ms.m2_proposal_coursework || pg.proposal_status || rt.proposal_status },
    { type: "coursework", label: "M3 Literature", raw: ms.m3_lit_review },
    { type: "data_collection", label: "M4 Data", raw: ms.m4_data_collection || pg.data_collection },
    { type: "thesis_submission", label: "M5 Writing", raw: ms.m5_analysis_writing || pg.thesis_draft },
    { type: "thesis_submission", label: "M6 Submit", raw: ms.m6_submission || rt.thesis_submission },
    { type: "thesis_defence", label: "M7 Defence", raw: ms.m7_defence || rt.thesis_defence },
  ];

  const phases = phaseDefs.map((def, idx) => ({
    id: idx + 1,
    milestone_type: def.type,
    milestone_date: target,
    status: pgMilestoneStatus(def.raw),
    notes: def.raw || def.fallback || def.label,
    milestone_code: def.label,
  }));

  phases.push({
    id: phases.length + 1,
    milestone_type: "graduation",
    milestone_date: grad.graduation_date || target,
    status: grad.graduation_date || pg.programme_status?.toLowerCase().includes("graduated")
      ? "completed"
      : progressionToStatus(grad.clearance_status),
    notes: grad.graduation_date ? `Graduated ${grad.graduation_date}` : pg.stage_reference || `Clearance: ${grad.clearance_status || "Not yet"}`,
    milestone_code: "Graduation",
  });

  const currentIdx = phases.findIndex((p) => p.status === "in_progress");
  return phases.map((p, i) => ({
    ...p,
    dissertation_title: pg.dissertation_title,
    supervisor: pg.supervisor,
    is_current: i === currentIdx || (currentIdx === -1 && p.status === "in_progress"),
  }));
}

export function transformExcelJourney(excelJourneyData) {
  const cohort = excelJourneyData.cohort_level || inferStudentLevel({
    student_type: excelJourneyData.student_type,
    programme_level: excelJourneyData.programme_level,
    cohort_level: excelJourneyData.cohort_level,
  });
  const isPostgrad = cohort === "postgraduate";
  const rawMilestones = isPostgrad
    ? buildPostgraduateMilestones(excelJourneyData)
    : buildUndergraduateMilestones(excelJourneyData);
  const milestones = attachAdvisorsToMilestones(rawMilestones, excelJourneyData, isPostgrad);
  const advisors = buildAdvisorList(excelJourneyData);

  const { year: currentYear, semester: currentSemester } = parseCurrentYearSem(
    excelJourneyData.current_year_sem
  );

  return {
    student: {
      id: excelJourneyData.student_id,
      full_name: excelJourneyData.full_name,
      student_number: excelJourneyData.student_id,
      program: excelJourneyData.programme_level,
      department: excelJourneyData.department,
      status: excelJourneyData.academic_standing?.standing,
      enrollment_date: excelJourneyData.enrolment_date,
      current_year_sem: excelJourneyData.current_year_sem,
      current_academic_year: currentYear,
      current_semester: currentSemester,
      gpa: Number(excelJourneyData.academic_standing?.gpa || 0).toFixed(2),
      academic_standing: excelJourneyData.academic_standing?.standing,
      fees_balance: excelJourneyData.financial_clearance?.fees_balance,
      current_milestone: excelJourneyData.journey_stage,
      program_level: excelJourneyData.student_type,
      cohort_level: cohort,
      student_type: excelJourneyData.student_type,
      dissertation_title:
        excelJourneyData.pg_research?.dissertation_title || excelJourneyData.research_thesis?.dissertation_title,
      supervisor: excelJourneyData.pg_research?.supervisor,
    },
    milestones,
    advisors,
    cohort_level: cohort,
    is_postgraduate: isPostgrad,
    pg_research: excelJourneyData.pg_research || null,
    pg_academic_support: excelJourneyData.pg_academic_support || [],
    library_resources: excelJourneyData.library_resources || [],
    research_thesis: excelJourneyData.research_thesis || {},
    risk_info: excelJourneyData.risk_assessment,
    courses_by_semester: excelJourneyData.courses_by_semester,
    courses_by_year: groupCoursesByYear(excelJourneyData.courses_by_semester, currentYear),
    total_courses: excelJourneyData.total_courses,
    total_credits: excelJourneyData.total_credits,
    attendance_percentage: excelJourneyData.attendance_percentage,
    total_attendance_sessions: excelJourneyData.total_attendance_sessions,
    attended_sessions: excelJourneyData.attended_sessions,
  };
}

function groupCoursesByYear(coursesBySemester, currentYear) {
  if (!coursesBySemester) return {};
  const grouped = {};
  Object.entries(coursesBySemester).forEach(([semLabel, courses]) => {
    const yearMatch = semLabel.match(/year\s*(\d+)/i);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : currentYear;
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(...courses.map((c) => ({ ...c, semester_label: semLabel })));
  });
  return grouped;
}
