"use client";

import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import { BRAND } from "@/lib/brand";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";
import { workflowChipStyle, workflowLabel } from "@/lib/scholarshipWorkflow";
import ScholarshipPipelineStepper from "./ScholarshipPipelineStepper";

export default function StudentApplicationDetailDialog({
  scholId,
  open,
  onClose,
  onContinueDraft,
  onRespondOffer,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!open || !scholId) {
      setDetail(null);
      setError("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    apiFetch(`/sis-lms/scholarships/applications/${encodeURIComponent(scholId)}/detail`)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, scholId]);

  const wf = detail ? workflowChipStyle(detail) : null;
  const WfIcon = wf?.icon;
  const review = detail?.review_progress;
  const reviewPct =
    review?.reviewers_assigned > 0
      ? Math.round((review.reviews_completed / review.reviewers_assigned) * 100)
      : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontWeight: 800, color: BRAND.navy, pr: 6 }}>
        {detail?.scholarship_name || "Application details"}
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} sx={{ color: BRAND.teal }} />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && detail && (
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
              {detail.scholarship_type && (
                <Chip label={detail.scholarship_type} size="small" sx={{ fontWeight: 600 }} />
              )}
              {detail["award_amount_(kes)"] > 0 && (
                <Chip
                  label={`KES ${Number(detail["award_amount_(kes)"]).toLocaleString()}`}
                  size="small"
                  sx={{ bgcolor: BRAND.tealLight, color: BRAND.teal, fontWeight: 700 }}
                />
              )}
              {wf && WfIcon && (
                <Chip
                  label={workflowLabel(detail)}
                  size="small"
                  icon={<WfIcon sx={{ fontSize: 14 }} />}
                  sx={{ fontWeight: 700, bgcolor: wf.bg, color: wf.color }}
                />
              )}
            </Box>

            {detail.scholarship_description && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                {detail.scholarship_description}
              </Typography>
            )}

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Application summary
              </Typography>
              <Stack spacing={0.75}>
                {[
                  { label: "Status", value: workflowLabel(detail) },
                  { label: "Applied", value: detail.applied_date || "Not yet submitted" },
                  { label: "References", value: `${detail.references_submitted ?? 0} submitted` },
                  {
                    label: "Supporting documents",
                    value: `${detail.supporting_documents_count ?? 0} uploaded`,
                  },
                  detail.anonymized_id && {
                    label: "Reference ID",
                    value: detail.anonymized_id,
                  },
                ]
                  .filter(Boolean)
                  .map(({ label, value }) => (
                    <Box key={label} sx={{ display: "flex", gap: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
                        {label}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {value}
                      </Typography>
                    </Box>
                  ))}
              </Stack>
            </Box>

            {detail.auto_reject_reason && (
              <Alert severity="error">
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                  Not eligible
                </Typography>
                {detail.auto_reject_reason}
              </Alert>
            )}

            {String(detail.status || "").toLowerCase() !== "draft" && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Committee review status
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {review?.status_label}
                  </Typography>
                  {review?.reviewers_assigned > 0 && (
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Reviews completed
                        </Typography>
                        <Typography variant="caption" fontWeight={700}>
                          {review.reviews_completed} / {review.reviewers_assigned}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={reviewPct}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: `${BRAND.teal}22`,
                          "& .MuiLinearProgress-bar": { bgcolor: BRAND.teal },
                        }}
                      />
                    </Box>
                  )}
                  {detail.documents_verified && (
                    <Chip
                      size="small"
                      label="Financial documents verified"
                      sx={{ mt: 1.5, fontWeight: 600, bgcolor: ST.colors.successLight, color: ST.colors.success }}
                    />
                  )}
                </Box>
              </>
            )}

            <Divider />
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Application pipeline
              </Typography>
              <ScholarshipPipelineStepper steps={detail.pipeline_steps || []} />
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Close
        </Button>
        {detail?.award_stage === "offer_sent" && onRespondOffer && (
          <Button
            variant="contained"
            onClick={() => onRespondOffer(detail.schol_id)}
            sx={{ bgcolor: BRAND.teal, textTransform: "none", fontWeight: 700 }}
          >
            Respond to offer
          </Button>
        )}
        {String(detail?.status || "").toLowerCase() === "draft" && onContinueDraft && (
          <Button
            variant="contained"
            onClick={() => onContinueDraft(detail.schol_id)}
            sx={{ bgcolor: BRAND.navy, textTransform: "none", fontWeight: 700 }}
          >
            Continue application
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
