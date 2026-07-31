"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import CheckIcon from "@mui/icons-material/Check";
import { GRANT_STAGES } from "@/lib/grantLifecycle";
import { BRAND } from "@/lib/brand";
import { ST } from "@/lib/staffTheme";

/**
 * GrantLifecycleStepper
 *
 * Props:
 *   stages        — array of stage objects (PI_GRANT_STAGES / UNIVERSITY_GRANT_STAGES / GRANT_STAGES)
 *                   Falls back to GRANT_STAGES if omitted.
 *   currentStage  — backend lifecycle_stage key (used to determine "done" steps)
 *   viewStep      — 0-based index of the step currently displayed (controlled)
 *   onStepClick   — (index) => void — called when user clicks a step (enables free navigation)
 *   compact       — boolean, reduces font/circle size
 */
export default function GrantLifecycleStepper({
  stages,
  currentStage = "proposal_budget",
  viewStep,
  progressStep,
  onStepClick,
  compact = false,
}) {
  const stageList = stages || GRANT_STAGES;

  // "real" progress: how far the application has actually reached
  const mappedIdx = stageList.findIndex(
    (s) => (s.backendStages || [s.key]).includes(currentStage)
  );
  const realIdx = mappedIdx >= 0 ? mappedIdx : 0;
  const progressIdx = progressStep !== undefined && progressStep !== null ? progressStep : realIdx;

  // "view" step: what the user is looking at (may differ from real progress)
  const activeIdx = viewStep !== undefined ? viewStep : progressIdx;

  const circleSize = compact ? 24 : 28;
  const fontSize = compact ? 9 : 10;
  const doneColor = ST.colors.success;

  return (
    <Box sx={{ mb: compact ? 1.5 : 2.5, overflowX: "auto", pb: 0.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          minWidth: compact ? 400 : Math.max(480, stageList.length * 100),
          gap: 0,
        }}
      >
        {stageList.map((stage, i) => {
          const done = i < progressIdx;
          const isReal = i === progressIdx;
          const isViewing = i === activeIdx;
          const clickable = Boolean(onStepClick);

          const circleBg = done
            ? doneColor
            : isViewing
            ? BRAND.navy
            : ST.colors.bg;

          const circleColor = done || isViewing ? "white" : ST.colors.textSecondary;

          const circleBorder = isViewing
            ? `2px solid ${BRAND.navy}`
            : done
            ? `2px solid ${doneColor}`
            : `2px solid ${ST.colors.border}`;

          const labelColor = isViewing
            ? BRAND.navy
            : done
            ? doneColor
            : ST.colors.textSecondary;

          return (
            <Box
              key={stage.key}
              sx={{ flex: 1, textAlign: "center", position: "relative" }}
            >
              {/* Connector line */}
              {i > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: circleSize / 2,
                    left: "-50%",
                    width: "100%",
                    height: 2,
                    bgcolor: done || isReal ? doneColor : ST.colors.border,
                    zIndex: 0,
                  }}
                />
              )}

              {/* Circle */}
              <Tooltip
                title={clickable ? stage.description || stage.label : ""}
                placement="top"
                arrow
              >
                <Box
                  onClick={clickable ? () => onStepClick(i) : undefined}
                  sx={{
                    width: circleSize,
                    height: circleSize,
                    borderRadius: "50%",
                    mx: "auto",
                    mb: 0.75,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    bgcolor: circleBg,
                    color: circleColor,
                    border: circleBorder,
                    position: "relative",
                    zIndex: 1,
                    cursor: clickable ? "pointer" : "default",
                    transition: "all 0.15s",
                    ...(clickable && {
                      "&:hover": {
                        boxShadow: `0 0 0 3px ${BRAND.teal}30`,
                        transform: "scale(1.08)",
                      },
                    }),
                  }}
                >
                  {done ? (
                    <CheckIcon sx={{ fontSize: 13, color: "white" }} />
                  ) : (
                    stage.index
                  )}
                </Box>
              </Tooltip>

              {/* Label */}
              <Typography
                variant="caption"
                onClick={clickable ? () => onStepClick(i) : undefined}
                sx={{
                  display: "block",
                  fontSize,
                  fontWeight: isViewing ? 700 : 500,
                  color: labelColor,
                  lineHeight: 1.2,
                  px: 0.25,
                  cursor: clickable ? "pointer" : "default",
                  "&:hover": clickable ? { color: BRAND.navy } : {},
                }}
              >
                {stage.shortLabel || stage.label}
              </Typography>

              {/* "You are here" dot under the real current stage when user has navigated away */}
              {isReal && !isViewing && (
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    bgcolor: BRAND.teal,
                    mx: "auto",
                    mt: 0.5,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
