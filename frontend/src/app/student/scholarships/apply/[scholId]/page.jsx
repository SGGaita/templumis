"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { apiFetch } from "@/lib/api";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { mergeScholarshipCatalog } from "@/lib/mockScholarships";
import { buildAutoFillFromProfile, validateSubmission } from "@/lib/scholarshipSchemas";
import { useScholarshipDraft } from "@/hooks/useScholarshipDraft";
import DynamicApplicationForm from "@/components/student/scholarships/DynamicApplicationForm";
import ReferenceRequestPanel from "@/components/student/scholarships/ReferenceRequestPanel";

export default function ScholarshipApplyPage() {
  const { scholId } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [scholarship, setScholarship] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profileData, userData, scholList] = await Promise.all([
          apiFetch("/sis-lms/my-profile"),
          apiFetch("/auth/me"),
          apiFetch("/sis-lms/scholarships"),
        ]);
        const merged = mergeScholarshipCatalog(scholList || []);
        const schol = merged.find((s) => String(s.id) === String(scholId));
        if (!cancelled) {
          setProfile(profileData);
          setUser(userData);
          setScholarship(schol);
        }
      } catch (e) {
        if (!cancelled) setSubmitError(e.message);
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scholId]);

  const draft = useScholarshipDraft(scholId, scholarship, profile, user);
  const autoFill = useMemo(
    () => (profile ? buildAutoFillFromProfile(profile, user) : {}),
    [profile, user]
  );

  useEffect(() => {
    if (!draft.loading && profile && user && !draft.formData.student_id) {
      draft.updateFormData({ ...buildAutoFillFromProfile(profile, user) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when draft loads
  }, [draft.loading, profile, user]);

  const scrollToField = (field) => {
    const el = document.getElementById(`field-${field}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSubmit = async () => {
    setSubmitError("");
    const errors = validateSubmission(
      scholarship,
      draft.formData,
      draft.references,
      draft.ferpaWaived
    );
    const errMap = {};
    errors.forEach((e) => {
      errMap[e.field] = e.message;
    });
    setFieldErrors(errMap);
    if (errors.length) {
      scrollToField(errors[0].field.replace(/\[.*\]/, "").split(".")[0]);
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
        },
      });
      router.push("/student/scholarships?submitted=1");
    } catch (e) {
      if (e.payload?.detail?.errors) {
        const errMap = {};
        e.payload.detail.errors.forEach((x) => {
          errMap[x.field] = x.message;
        });
        setFieldErrors(errMap);
        if (e.payload.detail.errors[0]) scrollToField(e.payload.detail.errors[0].field);
      }
      setSubmitError(e.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMeta || draft.loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: BRAND.teal }} />
      </Box>
    );
  }

  if (!scholarship) {
    return <Alert severity="error">Scholarship not found.</Alert>;
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/student/scholarships/available")}
        sx={{ mb: 2, textTransform: "none" }}
      >
        Back to catalog
      </Button>

      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 2,
          border: `1px solid ${BRAND.border}`,
          background: `linear-gradient(180deg, ${BRAND.tealLight} 0%, #fff 48%)`,
        }}
      >
        <Typography variant="overline" sx={{ color: BRAND.teal, fontWeight: 700 }}>
          Application
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ color: BRAND.navy }}>
          {scholarship.scholarship_name}
        </Typography>
        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>
          {scholarship.type} · KES {Number(scholarship["amount_(kes)"] || 0).toLocaleString()}
          {scholarship.is_mock ? " · Demo scholarship" : ""}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="caption" fontWeight={700}>
              Application progress
            </Typography>
            <Typography variant="caption" fontWeight={700}>
              {draft.progressPct}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={draft.progressPct}
            sx={{ height: 10, borderRadius: 5, "& .MuiLinearProgress-bar": { bgcolor: BRAND.teal } }}
          />
        </Box>
        {draft.offline && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Offline mode active. Your changes are saved locally. Do not close this tab until you are back
            online.
          </Alert>
        )}
        {draft.saving && (
          <Typography variant="caption" sx={{ color: ST.colors.textSecondary, mt: 1, display: "block" }}>
            Saving draft…
          </Typography>
        )}
        {draft.lastSaved && !draft.saving && (
          <Typography variant="caption" sx={{ color: ST.colors.success, mt: 1, display: "block" }}>
            Last saved {new Date(draft.lastSaved).toLocaleString()}
          </Typography>
        )}
      </Paper>

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
      />

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          size="large"
          disabled={submitting}
          onClick={handleSubmit}
          sx={{ bgcolor: BRAND.teal, textTransform: "none", fontWeight: 800, px: 4 }}
        >
          {submitting ? "Submitting…" : "Submit application"}
        </Button>
        <Button
          variant="outlined"
          onClick={() => draft.flushSave({
            form_data: draft.formData,
            references: draft.references,
            ferpa_waived: draft.ferpaWaived,
          })}
          sx={{ textTransform: "none" }}
        >
          Save draft now
        </Button>
      </Box>
    </Box>
  );
}
