"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import SchoolIcon from "@mui/icons-material/School";
import WorkIcon from "@mui/icons-material/Work";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";

const POSITION_LABELS = {
  phd: "PhD Project Brief",
  postdoc: "Postdoctoral Position",
};

function formatDuration(months) {
  const m = Number(months);
  if (!m || m <= 0) return "—";
  if (m % 12 === 0) {
    const y = m / 12;
    return `${y} year${y !== 1 ? "s" : ""}`;
  }
  return `${m} months`;
}

export default function PiProjectBrief({ grant, scopeOfWork, compact = false }) {
  const sow = scopeOfWork || grant?.scope_of_work || grant?.eligibility_rules?.scope_of_work || {};
  const positionType = sow.position_type || "phd";
  const positionLabel = POSITION_LABELS[positionType] || "Research Position";
  const PositionIcon = positionType === "postdoc" ? WorkIcon : SchoolIcon;
  const piName = grant?.pi_name || grant?.eligibility_rules?.pi_name;
  const piDept = grant?.pi_department || grant?.eligibility_rules?.pi_department;
  const milestones = Array.isArray(sow.milestones) ? sow.milestones : [];
  const outputs = Array.isArray(sow.expected_outputs) ? sow.expected_outputs : [];

  if (!sow.research_question && milestones.length === 0 && !sow.reporting_obligations) {
    return (
      <AlertPlaceholder compact={compact} piName={piName} />
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: compact ? 2 : 3,
        border: `1px solid ${ST.colors.border}`,
        borderRadius: 2,
        borderLeft: `4px solid #7c3aed`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: "#f5f3ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <PositionIcon sx={{ color: "#7c3aed", fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy }}>
              {positionLabel}
            </Typography>
            <Chip
              size="small"
              label="PI-authored scope of work"
              sx={{ height: 20, fontSize: 10, fontWeight: 600, bgcolor: "#f5f3ff", color: "#7c3aed" }}
            />
          </Box>
          {(piName || piDept) && (
            <Typography variant="caption" color="text.secondary">
              {piName}{piDept ? ` · ${piDept}` : ""}
            </Typography>
          )}
        </Box>
      </Box>

      {sow.research_question && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.75 }}>
            Research question
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.7, color: BRAND.navy, fontWeight: 500 }}>
            {sow.research_question}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1fr 1fr", gap: 1.5, mb: milestones.length || sow.reporting_obligations ? 2 : 0 }}>
        {sow.duration_months != null && (
          <Box sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
              Duration
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.navy, mt: 0.25 }}>
              {formatDuration(sow.duration_months)}
            </Typography>
          </Box>
        )}
        {grant?.open_to && (
          <Box sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
              Open to
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.navy, mt: 0.25 }}>
              {grant.open_to}
            </Typography>
          </Box>
        )}
      </Box>

      {milestones.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
            Milestones
          </Typography>
          <Stack spacing={0.75}>
            {milestones.map((m, i) => (
              <Box
                key={m.id || i}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.25,
                  py: 0.75,
                  borderBottom: i < milestones.length - 1 ? `1px solid ${ST.colors.border}` : "none",
                }}
              >
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: "#f5f3ff",
                    color: "#7c3aed",
                    fontSize: 11,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: 13 }}>
                    {m.label || m.title || "—"}
                  </Typography>
                  {m.month != null && (
                    <Typography variant="caption" color="text.secondary">
                      Target: month {m.month}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {sow.reporting_obligations && (
        <Box sx={{ mb: outputs.length ? 2 : 0 }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.75 }}>
            Reporting obligations
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: 13 }}>
            {sow.reporting_obligations}
          </Typography>
        </Box>
      )}

      {outputs.length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
            Expected outputs
          </Typography>
          <Stack spacing={0.5}>
            {outputs.map((out, i) => (
              <Typography key={i} variant="body2" sx={{ fontSize: 13, display: "flex", gap: 0.75 }}>
                <Box component="span" sx={{ color: "#7c3aed", fontWeight: 700 }}>•</Box>
                {out}
              </Typography>
            ))}
          </Stack>
        </>
      )}
    </Paper>
  );
}

function AlertPlaceholder({ compact, piName }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: compact ? 2 : 3,
        border: `1px dashed ${ST.colors.border}`,
        borderRadius: 2,
        bgcolor: ST.colors.bg,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {piName
          ? `${piName} is preparing the project brief for this position. Check back soon or contact the PI directly.`
          : "The PI project brief for this grant is being prepared."}
      </Typography>
    </Paper>
  );
}
