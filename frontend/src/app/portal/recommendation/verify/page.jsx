"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import { ST } from "@/lib/staffTheme";
import { validateFileUpload } from "@/lib/scholarshipSchemas";

function RecommenderForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState("");
  const [uploadMeta, setUploadMeta] = useState(null);
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Missing recommendation token");
      setLoading(false);
      return;
    }
    apiFetch(`/sis-lms/scholarships/recommendation?token=${encodeURIComponent(token)}`)
      .then(setInfo)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = validateFileUpload(file);
    if (!result.ok) {
      setFileError(result.message);
      setUploadMeta(null);
      return;
    }
    setFileError("");
    setUploadMeta(result.meta);
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/sis-lms/scholarships/recommendation", {
        method: "POST",
        body: { token, rating, upload_meta: uploadMeta },
      });
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (done) {
    return (
      <Paper sx={{ p: 4, textAlign: "center", maxWidth: 480, mx: "auto", mt: 6 }}>
        <CheckCircleIcon sx={{ fontSize: 64, color: ST.colors.success, mb: 2 }} />
        <Typography variant="h6" fontWeight={700}>
          Thank you
        </Typography>
        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 1 }}>
          Your recommendation has been submitted securely.
        </Typography>
      </Paper>
    );
  }

  if (error && !info) {
    return (
      <Alert severity="error" sx={{ maxWidth: 480, mx: "auto", mt: 6 }}>
        {error}
      </Alert>
    );
  }

  if (info?.status === "completed") {
    return (
      <Alert severity="info" sx={{ maxWidth: 480, mx: "auto", mt: 6 }}>
        This recommendation link has already been used.
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 520, mx: "auto", mt: 4, border: `1px solid ${ST.colors.border}` }}>
      <Typography variant="overline" sx={{ color: BRAND.teal, fontWeight: 700 }}>
        TemplumIS — Secure recommender portal
      </Typography>
      <Typography variant="h5" fontWeight={800} sx={{ mt: 1, mb: 2 }}>
        Confidential reference
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Student ID: {info?.student_id}. This student has{" "}
        <strong>{info?.ferpa_label === "WAIVED" ? "WAIVED" : "NOT WAIVED"}</strong> their right to view
        this recommendation.
      </Alert>

      <Typography variant="body2" sx={{ mb: 2, color: ST.colors.textSecondary }}>
        Recommender: {info?.recommender?.name} ({info?.recommender?.email})
      </Typography>

      <TextField
        select
        fullWidth
        label="Overall rating"
        value={rating}
        onChange={(e) => setRating(e.target.value)}
        sx={{ mb: 2 }}
      >
        {(info?.rubric_options || []).map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </TextField>

      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        Upload recommendation letter (PDF / PNG / JPEG, ≤10 MB)
      </Typography>
      <Button variant="outlined" component="label" sx={{ textTransform: "none", mb: 2 }}>
        Choose file
        <input type="file" hidden accept=".pdf,.png,.jpg,.jpeg" onChange={onFile} />
      </Button>
      {uploadMeta?.name && (
        <Typography variant="caption" sx={{ display: "block", color: ST.colors.success }}>
          {uploadMeta.name} — scanned OK (mock)
        </Typography>
      )}
      {fileError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {fileError}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        fullWidth
        variant="contained"
        sx={{ mt: 3, bgcolor: BRAND.navy, textTransform: "none", fontWeight: 700 }}
        disabled={!rating || !uploadMeta || submitting}
        onClick={submit}
      >
        {submitting ? "Submitting…" : "Submit recommendation"}
      </Button>
    </Paper>
  );
}

export default function RecommendationVerifyPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", py: 4, px: 2 }}>
      <Suspense fallback={<CircularProgress sx={{ display: "block", mx: "auto", mt: 8 }} />}>
        <RecommenderForm />
      </Suspense>
    </Box>
  );
}
