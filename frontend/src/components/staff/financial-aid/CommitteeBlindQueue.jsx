"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import ScholarshipApplicationReviewDialog from "./ScholarshipApplicationReviewDialog";
import { previewComposite, validateRubricScores } from "@/lib/scoring";

export default function CommitteeBlindQueue({
  statusFilter = null,
  portalLabel = "Scholarship Review",
  readOnly = false,
}) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [detail, setDetail] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [scores, setScores] = useState({ academic: "", need: "", lead: "" });

  const load = useCallback(() => {
    setLoading(true);
    const query = statusFilter ? `?status=${statusFilter}` : "";
    apiFetch(`/sis-lms/financial-aid/evaluation/my-assignments${query}`)
      .then((res) => setAssignments(res.assignments || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const loadDetail = async (item) => {
    setDetailLoading(true);
    setError("");
    try {
      const res = await apiFetch(
        `/sis-lms/financial-aid/evaluation/applications/${item.application_id}`
      );
      setDetail(res);
    } catch (e) {
      setError(e.message);
      setDetailItem(null);
      setScoreOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openReview = (item, { withScore = false } = {}) => {
    setDetailItem(item);
    setDetail(null);
    if (withScore) {
      setScores({
        academic: item.my_scores?.academic ?? "",
        need: item.my_scores?.need ?? "",
        lead: item.my_scores?.lead ?? "",
      });
      setScoreOpen(true);
    } else {
      setScoreOpen(false);
    }
    loadDetail(item);
  };

  const closeReview = () => {
    if (busy) return;
    setDetailItem(null);
    setDetail(null);
    setScoreOpen(false);
  };

  const openScorePanel = () => {
    if (!detailItem) return;
    setScores({
      academic: detailItem.my_scores?.academic ?? "",
      need: detailItem.my_scores?.need ?? "",
      lead: detailItem.my_scores?.lead ?? "",
    });
    setScoreOpen(true);
  };

  const composite = useMemo(
    () => (detailItem ? previewComposite(scores, detailItem.rubric_weights || {}) : null),
    [detailItem, scores]
  );

  const submitScores = async () => {
    if (!detailItem) return;
    const validation = validateRubricScores(scores);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch(
        `/sis-lms/financial-aid/evaluation/assignments/${detailItem.assignment_id}/scores`,
        {
          method: "POST",
          body: validation.parsed,
        }
      );
      setSuccess(`Score saved (composite ${res.composite_score}).`);
      setScoreOpen(false);
      setDetailItem((prev) =>
        prev
          ? {
              ...prev,
              my_scores: {
                academic: Number(scores.academic),
                need: Number(scores.need),
                lead: Number(scores.lead),
                composite: res.composite_score,
                submitted: true,
              },
            }
          : prev
      );
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <RateReviewIcon sx={{ color: BRAND.navy }} />
        <Typography variant="h5" fontWeight={700}>
          {portalLabel}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {readOnly
          ? "Applications you have already scored, with your submitted composite ratings."
          : "Open an application, then rate each criterion from 1 (poor) to 5 (exceptional) using the scorecard on the right."}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {assignments.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: "center", border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
          <Typography color="text.secondary">
            {statusFilter === "completed"
              ? "No completed reviews yet."
              : "No assigned applications in your queue yet."}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {assignments.map((app) => (
            <Grid item xs={12} md={6} key={app.assignment_id}>
              <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {app.student_name || app.mapping?.student_name || "Applicant"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {app.mapping?.student_number || app.anonymized_id}
                    </Typography>
                  </Box>
                  {app.my_scores?.submitted ? (
                    <Chip
                      size="small"
                      icon={<CheckCircleIcon sx={{ fontSize: "14px !important" }} />}
                      label={`Scored ${app.my_scores.composite}`}
                      sx={{ bgcolor: ST.colors.successLight, color: ST.colors.success, fontWeight: 700 }}
                    />
                  ) : (
                    <Chip size="small" label="Awaiting your score" sx={{ fontWeight: 600 }} />
                  )}
                </Stack>
                <Typography variant="body1" fontWeight={600}>
                  {app.scholarship_name}
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1, mb: 1.5, gap: 0.5 }}>
                  <Chip size="small" label={app.program_type} sx={{ fontWeight: 600 }} />
                  {app.financial_need_summary?.is_need_based && (
                    <Chip
                      size="small"
                      label={
                        app.financial_need_summary.need_index != null
                          ? `Need ${app.financial_need_summary.need_index}`
                          : "Need-based"
                      }
                      sx={{
                        bgcolor: ST.colors.warningLight,
                        color: ST.colors.warning,
                        fontWeight: 700,
                      }}
                    />
                  )}
                  {app.financial_need_summary?.fee_balance > 0 && (
                    <Chip
                      size="small"
                      label={`Balance KES ${Number(app.financial_need_summary.fee_balance).toLocaleString()}`}
                      sx={{ bgcolor: `${ST.colors.error}14`, color: ST.colors.error, fontWeight: 600 }}
                    />
                  )}
                </Stack>
                {app.objective_metrics &&
                  Object.entries(app.objective_metrics).slice(0, 3).map(([k, v]) => (
                    <Typography key={k} variant="body2">
                      {k.replace(/_/g, " ")}: <strong>{v ?? "—"}</strong>
                    </Typography>
                  ))}
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<VisibilityOutlinedIcon />}
                    onClick={() => openReview(app)}
                    disabled={detailLoading && detailItem?.assignment_id === app.assignment_id}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    View application
                  </Button>
                  {!readOnly && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<RateReviewIcon />}
                      onClick={() => openReview(app, { withScore: true })}
                      sx={{ bgcolor: BRAND.navy, textTransform: "none", fontWeight: 600 }}
                    >
                      {app.my_scores?.submitted ? "Update score" : "Score"}
                    </Button>
                  )}
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <ScholarshipApplicationReviewDialog
        open={Boolean(detailItem)}
        onClose={closeReview}
        detail={detail}
        loading={detailLoading}
        onScore={detailItem && !detailLoading ? openScorePanel : undefined}
        scoreOpen={scoreOpen}
        onScoreClose={() => !busy && setScoreOpen(false)}
        scoring={
          detailItem
            ? {
                applicantName: detailItem.student_name || detailItem.mapping?.student_name,
                weights: detailItem.rubric_weights,
                scores,
                onScoresChange: setScores,
                composite,
                busy,
                onSubmit: submitScores,
              }
            : undefined
        }
      />
    </Box>
  );
}
