"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CancelIcon from "@mui/icons-material/Cancel";
import { ST } from "@/lib/staffTheme";
import { STEP_VISUAL } from "@/lib/scholarshipPipeline";

const ICONS = {
  complete: CheckCircleIcon,
  current: HourglassEmptyIcon,
  pending: RadioButtonUncheckedIcon,
  failed: CancelIcon,
};

export default function ScholarshipPipelineStepper({
  steps = [],
  compact = false,
  showLabels = true,
}) {
  if (!steps.length) return null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: compact ? "center" : "flex-start",
        width: "100%",
        overflowX: "auto",
        "&::-webkit-scrollbar": { height: 4 },
      }}
    >
      {steps.map((step, idx) => {
        const visual = STEP_VISUAL[step.state] || STEP_VISUAL.pending;
        const Icon = ICONS[step.state] || RadioButtonUncheckedIcon;
        const isLast = idx === steps.length - 1;
        const connectorDone = step.state === "complete" || step.state === "failed";

        return (
          <Box
            key={step.key}
            sx={{
              display: "flex",
              alignItems: "center",
              flex: isLast ? "0 0 auto" : 1,
              minWidth: compact ? 48 : 72,
            }}
          >
            <Tooltip title={step.label} placement="top">
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: compact ? 40 : 64,
                }}
              >
                <Box
                  sx={{
                    width: compact ? 28 : 36,
                    height: compact ? 28 : 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: visual.bg,
                    border: `2px solid ${visual.color}`,
                    ...(step.state === "current" && {
                      boxShadow: `0 0 0 4px ${visual.bg}`,
                      transform: "scale(1.05)",
                    }),
                  }}
                >
                  <Icon sx={{ fontSize: compact ? 14 : 18, color: visual.color }} />
                </Box>
                {showLabels && !compact && (
                  <Typography
                    variant="caption"
                    align="center"
                    sx={{
                      mt: 0.75,
                      fontWeight: step.state === "current" ? 700 : 500,
                      color: step.state === "pending" ? "text.secondary" : visual.color,
                      fontSize: 10,
                      lineHeight: 1.2,
                      maxWidth: 72,
                    }}
                  >
                    {step.label}
                  </Typography>
                )}
              </Box>
            </Tooltip>
            {!isLast && (
              <Box
                sx={{
                  flex: 1,
                  height: 3,
                  mx: 0.5,
                  minWidth: 12,
                  borderRadius: 2,
                  bgcolor: connectorDone ? STEP_VISUAL.complete.color : ST.colors.border,
                  opacity: connectorDone ? 0.5 : 0.35,
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
