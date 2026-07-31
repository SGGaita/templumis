"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import Tooltip from "@mui/material/Tooltip";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { BRAND } from "@/lib/brand";
import { ST } from "@/lib/staffTheme";
import { workflowChipStyle, workflowLabel } from "@/lib/scholarshipWorkflow";
import { awardAmount, normalizeStatus } from "@/lib/scholarshipPipeline";
import ScholarshipPipelineStepper from "./ScholarshipPipelineStepper";

export default function ScholarshipApplicationCard({
  app,
  expanded,
  onToggleExpand,
  onOpenDetails,
  onContinue,
  onRespondOffer,
  onDeleteDraft,
}) {
  const wf = workflowChipStyle(app);
  const WfIcon = wf.icon;
  const name = app.scholarship_name || app.scholarship_details?.scholarship_name;
  const isDraft = normalizeStatus(app.status) === "draft";
  const hasOffer = app.award_stage === "offer_sent";
  const PAST_REVIEW_STAGES = ["offer_sent", "offer_accepted", "offer_declined", "offer_expired", "credited"];
  const isPastReview = PAST_REVIEW_STAGES.includes(app.award_stage) || normalizeStatus(app.status) === "awarded";
  const review = app.review_progress;
  const reviewPct =
    review?.reviewers_assigned > 0
      ? Math.round((review.reviews_completed / review.reviewers_assigned) * 100)
      : 0;
  const progressPct = app.pipeline_progress_pct ?? 0;

  const amount = awardAmount(app);

  return (
    <Paper
      elevation={0}
      onClick={onToggleExpand}
      sx={{
        border: `1.5px solid ${expanded ? BRAND.teal : ST.colors.border}`,
        borderRadius: 2.5,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: expanded ? `0 2px 16px ${BRAND.teal}18` : "none",
        "&:hover": {
          borderColor: expanded ? BRAND.teal : BRAND.navyMuted,
          boxShadow: `0 2px 10px rgba(0,0,0,0.06)`,
        },
      }}
    >
      {/* ── Card header ── */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          {/* Left: name + chips */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              sx={{ color: BRAND.navy, lineHeight: 1.3, mb: 0.75 }}
            >
              {name}
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
              {app.scholarship_type && (
                <Chip
                  label={app.scholarship_type}
                  size="small"
                  sx={{ fontWeight: 600, height: 20, fontSize: 11, bgcolor: ST.colors.bg }}
                />
              )}
              <Chip
                label={workflowLabel(app)}
                size="small"
                icon={<WfIcon sx={{ fontSize: "12px !important" }} />}
                sx={{
                  fontWeight: 700,
                  fontSize: 11,
                  height: 20,
                  bgcolor: wf.bg,
                  color: wf.color,
                  "& .MuiChip-icon": { color: `${wf.color} !important` },
                }}
              />
              {amount > 0 && (
                <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.success, pl: 0.5 }}>
                  KES {amount.toLocaleString()}
                </Typography>
              )}
            </Stack>
          </Box>

          {/* Right: expand toggle */}
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            sx={{
              color: ST.colors.textSecondary,
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
              mt: -0.25,
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* ── Pipeline progress bar (always visible, stepper only on expand) ── */}
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
            {app.applied_date
              ? `Applied ${app.applied_date}`
              : isDraft
              ? "Draft in progress"
              : app.current_pipeline_step?.label
              ? `Stage: ${app.current_pipeline_step.label}`
              : "In progress"}
          </Typography>
          <Typography variant="caption" fontWeight={800} sx={{ color: BRAND.teal, fontSize: 11 }}>
            {progressPct}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressPct}
          sx={{
            height: 5,
            borderRadius: 3,
            bgcolor: `${BRAND.teal}14`,
            "& .MuiLinearProgress-bar": { bgcolor: BRAND.teal, borderRadius: 3 },
          }}
        />
        {hasOffer && !expanded && (
          <Button
            size="small"
            variant="contained"
            onClick={(e) => { e.stopPropagation(); onRespondOffer(); }}
            sx={{ mt: 1.5, bgcolor: BRAND.teal, textTransform: "none", fontWeight: 700, fontSize: 12 }}
          >
            Respond to offer →
          </Button>
        )}
        {isDraft && !expanded && (
          <Button
            size="small"
            onClick={(e) => { e.stopPropagation(); onContinue(); }}
            sx={{ mt: 1, textTransform: "none", fontWeight: 600, color: BRAND.navy, fontSize: 12, pl: 0 }}
          >
            Complete application →
          </Button>
        )}
      </Box>

      {/* ── Expanded detail panel ── */}
      <Collapse in={expanded}>
        <Box
          sx={{ px: 2.5, pb: 2, borderTop: `1px solid ${ST.colors.border}`, pt: 1.75 }}
          onClick={(e) => e.stopPropagation()}
        >
            {/* Pipeline stepper with labels */}
          <ScholarshipPipelineStepper steps={app.pipeline_steps || []} showLabels />

          {/* Committee review — hide once an offer/award stage is reached */}
          {!isDraft && !isPastReview && review?.status_label && (
            <Box sx={{ mt: 2, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              {review.reviewers_assigned > 0 && (
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {review.status_label} · {review.reviews_completed}/{review.reviewers_assigned} reviews
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={reviewPct}
                    sx={{
                      height: 4,
                      borderRadius: 3,
                      mt: 0.5,
                      bgcolor: `${BRAND.navy}14`,
                      "& .MuiLinearProgress-bar": { bgcolor: BRAND.navy },
                    }}
                  />
                </Box>
              )}
              {!review.reviewers_assigned && (
                <Typography variant="caption" color="text.secondary">{review.status_label}</Typography>
              )}
            </Box>
          )}

          {/* Action buttons */}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2, gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<InfoOutlinedIcon />}
              onClick={onOpenDetails}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5, borderColor: ST.colors.border }}
            >
              Full details
            </Button>
            {isDraft && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={onContinue}
                  sx={{ bgcolor: BRAND.navy, textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
                >
                  Continue application
                </Button>
                <Tooltip title="Delete draft">
                  <IconButton size="small" onClick={onDeleteDraft} sx={{ color: ST.colors.error }}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
            {hasOffer && (
              <Button
                size="small"
                variant="contained"
                onClick={onRespondOffer}
                sx={{ bgcolor: BRAND.teal, textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}
              >
                Respond to offer
              </Button>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
}
