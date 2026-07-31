"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import CheckIcon from "@mui/icons-material/Check";
import LockIcon from "@mui/icons-material/Lock";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { GRANT_STAGES } from "@/lib/grantLifecycle";
import { BRAND } from "@/lib/brand";
import { ST } from "@/lib/staffTheme";

/**
 * Vertical sidebar navigation for grant workflow steps.
 */
export default function GrantLifecycleSidebar({
  stages,
  currentStage = "proposal_budget",
  viewStep,
  progressStep,
  onStepClick,
  accentColor = BRAND.navy,
  compact = false,
}) {
  const stageList = stages || GRANT_STAGES;

  const mappedIdx = stageList.findIndex(
    (s) => (s.backendStages || [s.key]).includes(currentStage)
  );
  const realIdx = mappedIdx >= 0 ? mappedIdx : 0;
  const progressIdx = progressStep !== undefined && progressStep !== null ? progressStep : realIdx;
  const activeIdx = viewStep !== undefined ? viewStep : progressIdx;
  const currentConfig = stageList[activeIdx];
  const isAhead = activeIdx > progressIdx;
  const isReadOnly = currentConfig?.readOnly && !isAhead;
  const clickable = Boolean(onStepClick);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography
        variant="caption"
        fontWeight={700}
        sx={{
          color: ST.colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          fontSize: 10,
          mb: 2,
          px: 0.5,
        }}
      >
        Workflow
      </Typography>

      <Box component="nav" sx={{ flex: 1 }}>
        {stageList.map((stage, i) => {
          const done = i < progressIdx;
          const isReal = i === progressIdx;
          const isViewing = i === activeIdx;
          const locked = i > progressIdx;

          const circleBg = done
            ? ST.colors.success
            : isViewing
            ? accentColor
            : ST.colors.bg;

          const circleColor = done || isViewing ? "white" : ST.colors.textSecondary;
          const labelColor = isViewing ? accentColor : done ? ST.colors.success : ST.colors.textSecondary;

          return (
            <Box key={stage.key} sx={{ display: "flex", position: "relative" }}>
              {/* Vertical connector */}
              {i < stageList.length - 1 && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 13,
                    top: 28,
                    bottom: -4,
                    width: 2,
                    bgcolor: done ? ST.colors.success : ST.colors.border,
                    zIndex: 0,
                  }}
                />
              )}

              <Tooltip title={stage.description || ""} placement="right" arrow disableHoverListener={!stage.description}>
                <Box
                  onClick={clickable ? () => onStepClick(i) : undefined}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.25,
                    py: 1,
                    px: 1,
                    mb: 0.25,
                    borderRadius: 1.5,
                    cursor: clickable ? "pointer" : "default",
                    width: "100%",
                    bgcolor: isViewing ? `${accentColor}10` : "transparent",
                    borderLeft: isViewing ? `3px solid ${accentColor}` : "3px solid transparent",
                    transition: "all 0.15s",
                    position: "relative",
                    zIndex: 1,
                    "&:hover": clickable
                      ? { bgcolor: isViewing ? `${accentColor}14` : ST.colors.bg }
                      : {},
                  }}
                >
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      bgcolor: circleBg,
                      color: circleColor,
                      border: isViewing
                        ? `2px solid ${accentColor}`
                        : done
                        ? `2px solid ${ST.colors.success}`
                        : `2px solid ${ST.colors.border}`,
                    }}
                  >
                    {done ? (
                      <CheckIcon sx={{ fontSize: 14, color: "white" }} />
                    ) : locked ? (
                      <LockIcon sx={{ fontSize: 12, color: ST.colors.textSecondary }} />
                    ) : (
                      stage.index
                    )}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: compact ? 12 : 13,
                        fontWeight: isViewing ? 700 : 500,
                        color: labelColor,
                        lineHeight: 1.3,
                      }}
                    >
                      {stage.shortLabel || stage.label}
                    </Typography>
                    {isReal && !isViewing && (
                      <Typography variant="caption" sx={{ color: BRAND.teal, fontSize: 10, fontWeight: 600 }}>
                        Current progress
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Tooltip>
            </Box>
          );
        })}
      </Box>

      {currentConfig && (
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${ST.colors.border}`,
            px: 0.5,
          }}
        >
          <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontSize: 11, display: "block", mb: 0.5 }}>
            Step {activeIdx + 1} of {stageList.length}
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.navy, fontSize: 13, mb: 0.75 }}>
            {currentConfig.label}
          </Typography>
          {(isAhead || isReadOnly) && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {isAhead ? (
                <LockIcon sx={{ fontSize: 12, color: ST.colors.textSecondary }} />
              ) : (
                <HourglassEmptyIcon sx={{ fontSize: 12, color: ST.colors.warning }} />
              )}
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontSize: 11 }}>
                {isAhead ? "Not yet available" : "Awaiting external action"}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
