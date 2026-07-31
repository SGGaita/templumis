"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import { ST } from "@/lib/staffTheme";
import { buildAutoFillFromProfile, validateSubmission } from "@/lib/scholarshipSchemas";
import { useScholarshipDraft } from "@/hooks/useScholarshipDraft";
import DynamicApplicationForm from "./DynamicApplicationForm";
import ReferenceRequestPanel from "./ReferenceRequestPanel";

export default function ScholarshipApplicationWorkspace({
  scholarship,
  profile,
  user,
  onClose,
  onSubmitted,
  referencesDisabled = true,
}) {
  const scholId = scholarship?.id;
  const draft = useScholarshipDraft(scholId, scholarship, profile, user);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const autoFill = useMemo(
    () => (profile ? buildAutoFillFromProfile(profile, user) : {}),
    [profile, user]
  );

  useEffect(() => {
    if (!draft.loading && profile && user && !draft.formData.student_id) {
      draft.updateFormData({ ...buildAutoFillFromProfile(profile, user) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.loading, profile, user]);

  const handleSubmit = async () => {
    setSubmitError("");
    const errors = validateSubmission(
      scholarship,
      draft.formData,
      draft.references,
      draft.ferpaWaived,
      !referencesDisabled
    );
    const errMap = {};
    errors.forEach((e) => {
      errMap[e.field] = e.message;
    });
    setFieldErrors(errMap);
    if (errors.length) {
      setSubmitError("Please fix the highlighted items before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch(`/sis-lms/scholarships/applications/${scholId}/submit`, {
        method: "POST",
        body: {
          form_data: draft.formData,
          references: draft.references,
          ferpa_waived: draft.ferpaWaived,
          require_references: !referencesDisabled,
        },
      });
      onSubmitted?.();
    } catch (e) {
      if (e.payload?.detail?.errors) {
        const map = {};
        e.payload.detail.errors.forEach((x) => {
          map[x.field] = x.message;
        });
        setFieldErrors(map);
      }
      setSubmitError(e.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (draft.loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={28} sx={{ color: BRAND.teal }} />
      </Box>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 2.5, mt: 3, border: `2px solid ${BRAND.teal}`, borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Box>
          <Typography variant="overline" sx={{ color: BRAND.teal, fontWeight: 700 }}>
            Application workspace
          </Typography>
          <Typography variant="h6" fontWeight={800}>
            {scholarship.scholarship_name}
          </Typography>
        </Box>
        <Button size="small" startIcon={<CloseIcon />} onClick={onClose} sx={{ textTransform: "none" }}>
          Close
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="caption" fontWeight={700}>
            Progress
          </Typography>
          <Typography variant="caption" fontWeight={700}>
            {draft.progressPct}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={draft.progressPct}
          sx={{ height: 8, borderRadius: 4, "& .MuiLinearProgress-bar": { bgcolor: BRAND.teal } }}
        />
      </Box>

      {draft.offline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Offline mode — changes saved locally until connection returns.
        </Alert>
      )}
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      <DynamicApplicationForm
        scholarship={scholarship}
        autoFill={autoFill}
        formData={draft.formData}
        onChange={draft.updateFormData}
        onBlur={draft.saveOnBlur}
        fieldErrors={fieldErrors}
      />

      <ReferenceRequestPanel
        scholId={scholId}
        scholarship={scholarship}
        references={draft.references}
        ferpaWaived={draft.ferpaWaived}
        onFerpaChange={draft.setFerpa}
        onReferencesChange={draft.updateReferences}
        fieldErrors={fieldErrors}
        disabled={referencesDisabled}
      />

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          disabled={submitting}
          onClick={handleSubmit}
          sx={{ bgcolor: BRAND.teal, textTransform: "none", fontWeight: 800 }}
        >
          {submitting ? "Submitting…" : "Submit application"}
        </Button>
        <Button
          variant="outlined"
          onClick={() =>
            draft.flushSave({
              form_data: draft.formData,
              references: draft.references,
              ferpa_waived: draft.ferpaWaived,
            })
          }
          sx={{ textTransform: "none" }}
        >
          Save draft
        </Button>
      </Box>
    </Paper>
  );
}
