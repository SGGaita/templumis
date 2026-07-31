"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import CloseIcon from "@mui/icons-material/Close";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { BRAND } from "@/lib/brand";
import { ST } from "@/lib/staffTheme";
import { normalizeRubricWeights, parseRubricScore } from "@/lib/scoring";

const SCORE_SCALE = [
  { value: 1, label: "1", title: "Poor" },
  { value: 2, label: "2", title: "Weak" },
  { value: 3, label: "3", title: "Average" },
  { value: 4, label: "4", title: "Strong" },
  { value: 5, label: "5", title: "Exceptional" },
];

const CRITERIA = [
  {
    key: "academic",
    label: "Academic potential",
    hint: "Rigor, curriculum strength, academic growth",
    weightKey: "academic",
  },
  {
    key: "need",
    label: "Financial need & adversity",
    hint: "Socio-economic barriers (need-based programmes)",
    weightKey: "need",
  },
  {
    key: "lead",
    label: "Leadership & impact",
    hint: "Character, civic contribution, initiative",
    weightKey: "lead",
  },
];

function ScoreButton({ value, title, selected, onSelect }) {
  return (
    <Button
      variant={selected ? "contained" : "outlined"}
      onClick={() => onSelect(value)}
      sx={{
        minWidth: 0,
        flex: 1,
        py: 1.25,
        px: 0.5,
        flexDirection: "column",
        lineHeight: 1.2,
        textTransform: "none",
        fontWeight: selected ? 800 : 600,
        borderColor: selected ? BRAND.navy : ST.colors.border,
        bgcolor: selected ? BRAND.navy : "#fff",
        color: selected ? "#fff" : ST.colors.textPrimary,
        "&:hover": {
          bgcolor: selected ? BRAND.navy : `${BRAND.navy}08`,
          borderColor: BRAND.navy,
        },
      }}
    >
      <Typography variant="subtitle2" fontWeight="inherit" sx={{ fontSize: 15 }}>
        {value}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontSize: 9,
          opacity: selected ? 0.9 : 0.65,
          display: { xs: "none", sm: "block" },
        }}
      >
        {title}
      </Typography>
    </Button>
  );
}

function CriterionCard({ criterion, weightPct, score, onSelect }) {
  const parsed = parseRubricScore(score);
  const selectedLabel = parsed ? SCORE_SCALE.find((s) => s.value === parsed)?.title : null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: "#fff",
        borderColor: parsed ? `${BRAND.teal}55` : ST.colors.border,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.75 }}>
        <Box sx={{ flex: 1, pr: 1 }}>
          <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.navy }}>
            {criterion.label}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.4, mt: 0.25 }}>
            {criterion.hint}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={`${weightPct}% weight`}
          sx={{ fontWeight: 600, fontSize: 10, height: 22, flexShrink: 0 }}
        />
      </Stack>

      <Stack direction="row" spacing={0.5} sx={{ mt: 1.25 }}>
        {SCORE_SCALE.map(({ value, title }) => (
          <ScoreButton
            key={value}
            value={value}
            title={title}
            selected={parsed === value}
            onSelect={(v) => onSelect(String(v))}
          />
        ))}
      </Stack>

      {selectedLabel && (
        <Typography variant="caption" sx={{ display: "block", mt: 1, color: BRAND.teal, fontWeight: 600 }}>
          Your rating: {selectedLabel} ({parsed})
        </Typography>
      )}
    </Paper>
  );
}

export default function ScoringSidebar({
  open,
  onClose,
  applicantName,
  scholarshipName,
  weights = {},
  scores,
  onScoresChange,
  composite,
  busy,
  onSubmit,
}) {
  if (!open) return null;

  const w = normalizeRubricWeights(weights);
  const weightMap = {
    academic: Math.round(w.academic * 100),
    need: Math.round(w.need * 100),
    lead: Math.round(w.lead * 100),
  };

  const completed = CRITERIA.filter((c) => parseRubricScore(scores[c.key]) != null).length;
  const allDone = completed === CRITERIA.length;
  const compositeNum = composite ? Number(composite) : null;
  const compositePct = compositeNum != null ? ((compositeNum - 1) / 4) * 100 : 0;

  const setScore = (key, value) => {
    onScoresChange({ ...scores, [key]: value });
  };

  return (
    <Box
      sx={{
        width: { xs: "100%", sm: 400 },
        flexShrink: 0,
        borderLeft: { xs: "none", sm: `1px solid ${ST.colors.border}` },
        borderTop: { xs: `1px solid ${ST.colors.border}`, sm: "none" },
        bgcolor: ST.colors.bg,
        display: "flex",
        flexDirection: "column",
        maxHeight: { xs: 420, sm: "calc(100vh - 180px)" },
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          borderBottom: `1px solid ${ST.colors.border}`,
          bgcolor: "#fff",
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <RateReviewIcon sx={{ color: BRAND.navy, fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: BRAND.navy }}>
              Your scorecard
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            Tap a number for each row. <strong>1 = Poor</strong> · <strong>5 = Exceptional</strong>
          </Typography>
          {applicantName && (
            <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
              {applicantName}
            </Typography>
          )}
          {scholarshipName && (
            <Typography variant="caption" color="text.secondary" display="block">
              {scholarshipName}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose} disabled={busy} aria-label="Close scoring panel">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, py: 1, bgcolor: "#fff", borderBottom: `1px solid ${ST.colors.border}` }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
          <Typography variant="caption" fontWeight={600}>
            Progress
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {completed} of {CRITERIA.length} criteria rated
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={(completed / CRITERIA.length) * 100}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: ST.colors.border,
            "& .MuiLinearProgress-bar": { bgcolor: completed === CRITERIA.length ? ST.colors.success : BRAND.teal },
          }}
        />
      </Box>

      <Box sx={{ p: 2, flex: 1, overflowY: "auto" }}>
        <Stack spacing={1.5}>
          {CRITERIA.map((criterion) => (
            <CriterionCard
              key={criterion.key}
              criterion={criterion}
              weightPct={weightMap[criterion.weightKey]}
              score={scores[criterion.key]}
              onSelect={(v) => setScore(criterion.key, v)}
            />
          ))}
        </Stack>

        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            border: `1px solid ${allDone ? BRAND.teal : ST.colors.border}`,
            bgcolor: allDone ? `${BRAND.teal}08` : "#fff",
          }}
        >
          <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            Weighted total (feeds committee ranking)
          </Typography>
          {compositeNum != null ? (
            <>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="h4" fontWeight={800} sx={{ color: BRAND.navy, lineHeight: 1 }}>
                  {composite}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  / 5.00
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, Math.max(0, compositePct))}
                sx={{
                  mt: 1,
                  height: 8,
                  borderRadius: 4,
                  bgcolor: ST.colors.border,
                  "& .MuiLinearProgress-bar": { bgcolor: BRAND.navy, borderRadius: 4 },
                }}
              />
              <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1, gap: 0.5 }}>
                {CRITERIA.map((c) => {
                  const s = parseRubricScore(scores[c.key]);
                  if (s == null) return null;
                  const contrib = (w[c.weightKey] * s).toFixed(2);
                  return (
                    <Chip
                      key={c.key}
                      size="small"
                      label={`${c.label.split(" ")[0]}: +${contrib}`}
                      sx={{ fontSize: 10, fontWeight: 600 }}
                    />
                  );
                })}
              </Stack>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Rate all three criteria to see the weighted total.
            </Typography>
          )}
        </Paper>
      </Box>

      <Divider />
      <Box sx={{ p: 2, bgcolor: "#fff" }}>
        <Button
          variant="contained"
          fullWidth
          onClick={onSubmit}
          disabled={busy || !allDone}
          startIcon={allDone ? <CheckCircleIcon /> : null}
          sx={{
            bgcolor: BRAND.navy,
            textTransform: "none",
            fontWeight: 700,
            py: 1.1,
            mb: 1,
          }}
        >
          {busy ? "Saving…" : allDone ? "Submit my score" : `Rate ${CRITERIA.length - completed} more`}
        </Button>
        <Button fullWidth onClick={onClose} disabled={busy} sx={{ textTransform: "none", color: ST.colors.textSecondary }}>
          Close panel
        </Button>
      </Box>
    </Box>
  );
}
