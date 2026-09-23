"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { ST } from "@/lib/staffTheme";
import { statusTone, pct } from "@/lib/rankings/readiness";

/** Status palette - the only colours the Executive brief uses for meaning. */
export const STATUS_PALETTE = {
  success: ST.colors.success,
  successDark: "#047857",
  successLight: ST.colors.successLight,
  warning: ST.colors.warning,
  warningLight: ST.colors.warningLight,
  neutral: "#64748B",
  neutralLight: "#F1F5F9",
};

export const DATA_SOURCE_LABEL = {
  live: "Live data",
  partial: "Partly live",
  static: "Static assessment",
};

export function StatusChip({ status, size = "small" }) {
  if (!status) return null;
  const tone = statusTone(status, STATUS_PALETTE);
  return (
    <Chip
      label={status}
      size={size}
      sx={{
        height: 22,
        fontWeight: 600,
        bgcolor: tone.bg,
        color: tone.fg,
        "& .MuiChip-label": { px: 1 },
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      }}
    />
  );
}

/** Neutral readiness bar: navy fill on a light track, value printed beside it. */
export function ReadinessBar({ value, height = 8, showValue = true, width = "100%" }) {
  const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, width }}>
      <Box
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        sx={{
          flex: 1,
          height,
          borderRadius: height,
          bgcolor: ST.colors.primaryLight,
          overflow: "hidden",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        }}
      >
        <Box sx={{ width: `${v}%`, height: "100%", bgcolor: ST.colors.primary, borderRadius: height }} />
      </Box>
      {showValue && (
        <Typography
          variant="body2"
          sx={{ minWidth: 40, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
        >
          {pct(v)}
        </Typography>
      )}
    </Box>
  );
}

/**
 * One layer of the brief. `number` renders as a small eyebrow so the four
 * layers read as a sequence on screen and in the PDF.
 */
export function SectionCard({ number, title, subtitle, action, children, sx }) {
  return (
    <Paper
      elevation={0}
      component="section"
      sx={{
        border: `1px solid ${ST.colors.border}`,
        borderRadius: 2,
        p: { xs: 2, md: 2.5 },
        mb: 3,
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box>
          {number != null && (
            <Typography
              variant="overline"
              sx={{ color: ST.colors.textSecondary, fontWeight: 700, letterSpacing: 1, lineHeight: 1.6 }}
            >
              {number}
            </Typography>
          )}
          <Typography variant="h6" fontWeight={700} sx={{ color: ST.colors.textPrimary, lineHeight: 1.3 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && (
          <Box className="no-print" sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {action}
          </Box>
        )}
      </Box>
      {children}
    </Paper>
  );
}

export function StatTile({ label, value, caption }) {
  return (
    <Box
      sx={{
        border: `1px solid ${ST.colors.border}`,
        borderRadius: 1.5,
        p: 2,
        height: "100%",
        bgcolor: ST.colors.surface,
      }}
    >
      <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontWeight: 600, display: "block" }}>
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: ST.colors.textPrimary, mt: 0.5, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </Typography>
      {caption && (
        <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", mt: 0.25 }}>
          {caption}
        </Typography>
      )}
    </Box>
  );
}

export function MutedNote({ children, sx }) {
  return (
    <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", ...sx }}>
      {children}
    </Typography>
  );
}
