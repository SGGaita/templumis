/** Dynamic Form Fields Engine — schemas, progress, validation. */

export const ESSAY_TARGET_WORDS = 500;
export const ESSAY_TOLERANCE = 0.1;

export const WORKFLOW_LABELS = {
  "Under Triage": "Under Triage",
  "Committee Phase": "Committee Phase",
  "Awaiting Decision": "Awaiting Decision",
  Submitted: "Submitted",
  Approved: "Approved",
  Rejected: "Rejected",
};

export function normalizeScholarshipType(scholarship) {
  const t = String(scholarship?.type || "merit").toLowerCase();
  if (t.includes("need")) return "need-based";
  if (["sports", "research", "talent"].includes(t)) return "talent";
  return "merit";
}

export function getRequiredFieldKeys(scholarship) {
  const base = ["personal_statement_ack"];
  const t = normalizeScholarshipType(scholarship);
  if (t === "merit") return [...base, "essay_merit"];
  if (t === "need-based") return [...base, "supporting_documents"];
  return [...base, "portfolio_url", "talent_statement"];
}

/** Need-based uploads: array on form; legacy single income_doc_meta still counts. */
export function getSupportingDocuments(formData = {}) {
  const docs = formData.supporting_documents;
  if (Array.isArray(docs) && docs.length) return docs.filter((d) => d?.name);
  if (formData.income_doc_meta?.name) return [formData.income_doc_meta];
  return [];
}

export function hasSupportingDocuments(formData) {
  return getSupportingDocuments(formData).length > 0;
}

export function buildAutoFillFromProfile(profile, user) {
  const s = profile?.student || {};
  const stats = profile?.statistics || {};
  return {
    full_name: s.full_name || user?.full_name || "",
    student_id: s.student_id || user?.student_registration_number || "",
    email: s.email || user?.email || "",
    major: s.major || "",
    program: s.program || "",
    gpa: stats.gpa != null ? String(stats.gpa) : "",
    credits_completed: String(
      stats.total_credits_completed ??
        s.credits_completed ??
        s.credit_hours_earned ??
        stats.total_credits_graded_earned ??
        0
    ),
    enrollment_status: s.status || "Active",
  };
}

export function calcApplicationProgress(scholarship, formData, references = []) {
  const required = [...getRequiredFieldKeys(scholarship)];
  const refNeeded = Number(scholarship?.requires_references || 0);
  for (let i = 0; i < refNeeded; i++) required.push(`ref_${i}`);

  let completed = 0;
  for (const key of required) {
    if (key.startsWith("ref_")) {
      const idx = parseInt(key.split("_")[1], 10);
      const ref = references[idx];
      if (ref?.status === "completed") completed += 1;
      else if (ref?.email && ref?.name) completed += 0.5;
    } else if (key === "supporting_documents") {
      if (hasSupportingDocuments(formData)) completed += 1;
    } else if (key.endsWith("_meta")) {
      if (formData[key]?.name) completed += 1;
    } else if (formData[key] != null && String(formData[key]).trim()) {
      completed += 1;
    }
  }
  const total = required.length || 1;
  return Math.min(100, Math.round((completed / total) * 100));
}

export function countEssayWords(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function validateFileUpload(file, { maxMb = 10, media = false } = {}) {
  const allowed = ["application/pdf", "image/png", "image/jpeg"];
  if (!allowed.includes(file.type)) {
    return { ok: false, message: "Only PDF, PNG, or JPEG formats allowed" };
  }
  const limit = (media ? 50 : maxMb) * 1024 * 1024;
  if (file.size > limit) {
    return { ok: false, message: `File must be ≤ ${media ? 50 : maxMb} MB` };
  }
  return {
    ok: true,
    meta: {
      name: file.name,
      mime: file.type,
      size_mb: Math.round((file.size / 1024 / 1024) * 100) / 100,
      integrity_ok: true,
      scanned_at: new Date().toISOString(),
    },
  };
}

export function validateSubmission(scholarship, formData, references, ferpaWaived, requireReferences = true) {
  const errors = [];
  for (const key of getRequiredFieldKeys(scholarship)) {
    if (key === "supporting_documents") {
      if (!hasSupportingDocuments(formData)) {
        errors.push({
          field: key,
          message: "Upload at least one supporting certified document",
        });
      }
    } else if (key.endsWith("_meta")) {
      if (!formData[key]?.name) {
        errors.push({ field: key, message: "Required document upload missing" });
      }
    } else if (key === "personal_statement_ack") {
      if (!formData[key]) {
        errors.push({ field: key, message: "You must confirm your profile information" });
      }
    } else if (!String(formData[key] || "").trim()) {
      errors.push({ field: key, message: `${key.replace(/_/g, " ")} is required` });
    }
  }

  const refNeeded = requireReferences ? Number(scholarship?.requires_references || 0) : 0;
  if (refNeeded && ferpaWaived == null) {
    errors.push({ field: "ferpa_waived", message: "Select a FERPA waiver option before submitting" });
  }

  for (let i = 0; i < refNeeded; i++) {
    const ref = references[i];
    if (ref?.status !== "completed") {
      errors.push({
        field: `references[${i}]`,
        message: `Reference ${i + 1} must be completed (recommender response required)`,
      });
    }
  }

  if (normalizeScholarshipType(scholarship) === "merit" && formData.essay_merit) {
    const words = countEssayWords(formData.essay_merit);
    const min = ESSAY_TARGET_WORDS * (1 - ESSAY_TOLERANCE);
    const max = ESSAY_TARGET_WORDS * (1 + ESSAY_TOLERANCE);
    if (words < min || words > max) {
      errors.push({
        field: "essay_merit",
        message: `Essay must be ${ESSAY_TARGET_WORDS} words (±10%). Current: ${words} words`,
      });
    }
  }

  return errors;
}

export const REFERENCE_STATUS_LABEL = {
  not_sent: "Not Sent",
  pending: "Pending Recommender Response",
  completed: "Completed",
};

export function referenceStatus(ref) {
  if (!ref?.email) return "not_sent";
  if (ref?.status === "completed") return "completed";
  return "pending";
}
