"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EditNoteIcon from "@mui/icons-material/EditNote";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { BRAND } from "@/lib/brand";
import { ST } from "@/lib/staffTheme";

const TYPE_STYLES = {
  merit:      { bg: BRAND.tealLight,  color: BRAND.teal },
  "need-based": { bg: "#FFF4E5",     color: "#B45309" },
  need:       { bg: "#FFF4E5",        color: "#B45309" },
  talent:     { bg: "#E8F5E9",        color: "#2E7D32" },
  sports:     { bg: "#E8F5E9",        color: "#2E7D32" },
};

function formatType(type) {
  const t = String(type || "general").toLowerCase();
  if (t.includes("need")) return "Need-based";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function StatusChip({ s }) {
  if (s.hasApplied)
    return <Chip size="small" icon={<CheckCircleOutlineIcon sx={{ fontSize: "13px !important" }} />} label="Submitted" sx={{ bgcolor: BRAND.navyLight, color: BRAND.navy, fontWeight: 700, fontSize: 11 }} />;
  if (s.isDraft)
    return <Chip size="small" icon={<EditNoteIcon sx={{ fontSize: "13px !important" }} />} label="Draft in progress" sx={{ bgcolor: "#E3F2FD", color: "#1565C0", fontWeight: 700, fontSize: 11 }} />;
  if (s.eligible)
    return <Chip size="small" label="Matches your profile" sx={{ bgcolor: BRAND.tealLight, color: BRAND.teal, fontWeight: 700, fontSize: 11 }} />;
  if (s.reason)
    return (
      <Tooltip title={s.reason}>
        <Chip size="small" icon={<InfoOutlinedIcon sx={{ fontSize: "13px !important" }} />} label="Requirements not met" sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontWeight: 600, fontSize: 11 }} />
      </Tooltip>
    );
  return null;
}

export default function ScholarshipOpportunityCard({ scholarship: s, onApply, onViewDetails, horizontal = false }) {
  const typeKey = String(s.type || "").toLowerCase();
  const tc = TYPE_STYLES[typeKey] || { bg: BRAND.navyLight, color: BRAND.navy };
  const amount = Number(s["amount_(kes)"] || 0);
  const slotsRemaining = s.remaining ?? 0;
  const slotsTotal = s.slots ?? 0;
  const slotsPct = slotsTotal > 0 ? (slotsRemaining / slotsTotal) * 100 : 0;
  const noSlots = slotsRemaining === 0 && slotsTotal > 0;
  const description = (s.description || s.criteria || "").trim();

  const ctaLabel = () => {
    if (s.hasApplied) return "View application";
    if (s.isDraft) return "Continue";
    if (noSlots) return "Fully allocated";
    if (!s.eligible) return "View details";
    return "Apply now";
  };
  const ctaColor = s.eligible && !s.hasApplied && !noSlots ? BRAND.teal : BRAND.navy;
  const ctaVariant = s.eligible && !s.hasApplied && !noSlots ? "contained" : "outlined";
  const ctaDisabled = noSlots && !s.isDraft && !s.hasApplied;

  const borderAccent = s.eligible && !s.hasApplied
    ? BRAND.teal
    : s.hasApplied
    ? BRAND.navyMuted
    : ST.colors.border;

  /* ── Horizontal row card (one per row) ── */
  if (horizontal) {
    return (
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "stretch",
          border: `1px solid ${ST.colors.border}`,
          borderLeft: `4px solid ${borderAccent}`,
          borderRadius: 2,
          bgcolor: "white",
          transition: "box-shadow 0.15s, border-color 0.15s",
          overflow: "hidden",
          "&:hover": { boxShadow: "0 4px 16px rgba(25,47,90,0.08)", borderColor: borderAccent === ST.colors.border ? BRAND.navyMuted : borderAccent },
        }}
      >
        {/* Type icon column */}
        <Box sx={{ width: 52, flexShrink: 0, bgcolor: tc.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <EmojiEventsIcon sx={{ color: tc.color, fontSize: 22 }} />
        </Box>

        {/* Main content */}
        <Box sx={{ flex: 1, minWidth: 0, px: 2, py: 1.75, display: "flex", flexDirection: "column", justifyContent: "center", gap: 0.5 }}>
          {/* Title + status chip */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, lineHeight: 1.3 }}>
              {s.scholarship_name || "Scholarship programme"}
            </Typography>
            <StatusChip s={s} />
          </Box>

          {/* Meta chips */}
          <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
            <Chip label={formatType(s.type)} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 600, bgcolor: tc.bg, color: tc.color }} />
            {s.min_gpa != null && (
              <Chip label={`Min GPA ${s.min_gpa}`} size="small" variant="outlined" sx={{ height: 18, fontSize: 10, borderColor: ST.colors.border }} />
            )}
            {s.year_of_study && (
              <Chip label={`Year ${s.year_of_study}`} size="small" variant="outlined" sx={{ height: 18, fontSize: 10, borderColor: ST.colors.border }} />
            )}
          </Stack>

          {/* Description */}
          {description && (
            <Typography variant="caption" sx={{ color: ST.colors.textSecondary, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {description}
            </Typography>
          )}

          {/* Slots progress */}
          {slotsTotal > 0 && (
            <Box sx={{ maxWidth: 200, mt: 0.25 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontSize: 10 }}>Awards remaining</Typography>
                <Typography variant="caption" fontWeight={700} sx={{ fontSize: 10 }}>{slotsRemaining}/{slotsTotal}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={slotsPct} sx={{
                height: 3, borderRadius: 2, bgcolor: ST.colors.border,
                "& .MuiLinearProgress-bar": { bgcolor: slotsPct > 40 ? BRAND.teal : slotsPct > 15 ? "#F59E0B" : "#EF4444", borderRadius: 2 },
              }} />
            </Box>
          )}
        </Box>

        {/* Right: amount + actions */}
        <Box sx={{ flexShrink: 0, px: 2.5, py: 1.75, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", gap: 1, borderLeft: `1px solid ${ST.colors.border}`, minWidth: 160 }}>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h6" fontWeight={800} sx={{ color: BRAND.teal, lineHeight: 1.1 }}>
              KES {amount.toLocaleString()}
            </Typography>
            {(s.coverage || s.frequency) && (
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontSize: 10 }}>
                {[s.coverage, s.frequency].filter(Boolean).join(" · ")}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={0.75}>
            {onViewDetails && (
              <Button size="small" onClick={() => onViewDetails(s)} sx={{ textTransform: "none", fontWeight: 600, color: ST.colors.textSecondary, fontSize: 12, minWidth: 0 }}>
                Details
              </Button>
            )}
            <Button
              size="small"
              variant={ctaVariant}
              disabled={ctaDisabled}
              endIcon={ctaVariant === "contained" ? <ArrowForwardIcon sx={{ fontSize: "14px !important" }} /> : null}
              onClick={() => onApply(s)}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                fontSize: 12,
                borderRadius: 1.5,
                px: 1.5,
                bgcolor: ctaVariant === "contained" ? ctaColor : undefined,
                borderColor: ctaVariant === "outlined" ? ST.colors.border : undefined,
                color: ctaVariant === "outlined" ? BRAND.navy : "white",
                "&:hover": { bgcolor: ctaVariant === "contained" ? BRAND.navy : undefined },
              }}
            >
              {ctaLabel()}
            </Button>
          </Stack>
        </Box>
      </Paper>
    );
  }

  /* ── Original grid card (kept for any other usage) ── */
  return (
    <Paper elevation={0} sx={{
      height: "100%", display: "flex", flexDirection: "column", borderRadius: 2,
      border: `1px solid ${s.eligible && !s.hasApplied ? `${BRAND.teal}55` : ST.colors.border}`,
      borderLeft: `4px solid ${borderAccent}`,
      bgcolor: "white", transition: "box-shadow 0.2s",
      "&:hover": { boxShadow: "0 8px 24px rgba(25,47,90,0.08)" },
    }}>
      <Box sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1.5 }}>
          <Box sx={{ bgcolor: tc.bg, borderRadius: 1.5, p: 1, display: "flex", flexShrink: 0 }}>
            <EmojiEventsIcon sx={{ color: tc.color, fontSize: 22 }} />
          </Box>
          <StatusChip s={s} />
        </Box>
        <Typography variant="subtitle1" fontWeight={800} sx={{ color: BRAND.navy, lineHeight: 1.35, mb: 0.75 }}>
          {s.scholarship_name || "Scholarship programme"}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
          <Chip label={formatType(s.type)} size="small" sx={{ bgcolor: tc.bg, color: tc.color, fontWeight: 600, fontSize: 11 }} />
          {s.min_gpa != null && <Chip label={`Min GPA ${s.min_gpa}`} size="small" variant="outlined" sx={{ fontSize: 11 }} />}
        </Box>
        {description && (
          <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mb: 2, flex: 1, lineHeight: 1.55 }}>
            {description.length > 160 ? description.slice(0, 160) + "…" : description}
          </Typography>
        )}
        <Typography variant="h5" fontWeight={800} sx={{ color: BRAND.teal, mb: 0.25 }}>KES {amount.toLocaleString()}</Typography>
        <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", mb: 1.5 }}>
          {[s.coverage, s.frequency].filter(Boolean).join(" · ") || "University award"}
        </Typography>
        {slotsTotal > 0 && (
          <Box sx={{ mb: 0.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Awards remaining</Typography>
              <Typography variant="caption" fontWeight={700}>{slotsRemaining} of {slotsTotal}</Typography>
            </Box>
            <LinearProgress variant="determinate" value={slotsPct} sx={{ height: 5, borderRadius: 3, bgcolor: ST.colors.border, "& .MuiLinearProgress-bar": { bgcolor: slotsPct > 40 ? BRAND.teal : slotsPct > 15 ? "#F59E0B" : "#EF4444", borderRadius: 3 } }} />
          </Box>
        )}
      </Box>
      <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${ST.colors.border}`, display: "flex", gap: 1 }}>
        {onViewDetails && <Button size="small" onClick={() => onViewDetails(s)} sx={{ textTransform: "none", fontWeight: 600, color: BRAND.navy }}>Details</Button>}
        <Button size="small" fullWidth={!onViewDetails} variant={ctaVariant} disabled={ctaDisabled && !s.isDraft && !s.hasApplied} onClick={() => onApply(s)} sx={{ flex: 1, textTransform: "none", fontWeight: 700, py: 1, bgcolor: ctaVariant === "contained" ? BRAND.teal : undefined, "&:hover": { bgcolor: ctaVariant === "contained" ? BRAND.navy : undefined } }}>
          {ctaLabel()}
        </Button>
      </Box>
    </Paper>
  );
}
