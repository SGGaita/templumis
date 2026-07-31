"use client";

import { useState } from "react";
import { Box, Typography, Paper, Popover, Chip, Divider, Stack } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import WarningIcon from "@mui/icons-material/Warning";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { ST } from "@/lib/staffTheme";

const PG_LABELS = {
  enrollment: "Enrolment",
  coursework: "Literature",
  research_proposal: "Proposal",
  data_collection: "Data",
  thesis_submission: "Writing",
  thesis_defence: "Defence",
  graduation: "Graduate",
};

function AdvisorLines({ advisors, compact }) {
  if (!advisors?.length) return null;
  return (
    <Stack spacing={0.15} sx={{ mt: 0.5, maxWidth: compact ? 76 : 96, width: "100%" }}>
      {advisors.slice(0, compact ? 2 : 3).map((a) => (
        <Box
          key={`${a.role}-${a.name}`}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.25,
          }}
        >
          <PersonOutlineIcon sx={{ fontSize: 9, color: ST.colors.textSecondary, flexShrink: 0 }} />
          <Typography
            variant="caption"
            noWrap
            title={`${a.role}: ${a.name}`}
            sx={{
              fontSize: 8,
              lineHeight: 1.1,
              color: ST.colors.textSecondary,
              maxWidth: compact ? 68 : 88,
            }}
          >
            {a.name}
          </Typography>
        </Box>
      ))}
      {advisors.length > (compact ? 2 : 3) && (
        <Typography variant="caption" sx={{ fontSize: 7, color: ST.colors.textSecondary, textAlign: "center" }}>
          +{advisors.length - (compact ? 2 : 3)} more
        </Typography>
      )}
    </Stack>
  );
}

export default function JourneyTimeline({ milestones, journeyData, compact = true }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const isPostgrad = journeyData?.is_postgraduate;

  const handleMilestoneClick = (event, milestone) => {
    setAnchorEl(event.currentTarget);
    setSelectedMilestone(milestone);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedMilestone(null);
  };

  const getMilestoneIcon = (status, size = 20) => {
    const sx = { fontSize: size };
    switch (status) {
      case "completed":
        return <CheckCircleIcon sx={sx} />;
      case "in_progress":
        return <HourglassEmptyIcon sx={sx} />;
      case "at_risk":
        return <WarningIcon sx={sx} />;
      default:
        return <RadioButtonUncheckedIcon sx={sx} />;
    }
  };

  const getMilestoneColor = (status) => {
    switch (status) {
      case "completed":
        return { bg: "#DCFCE7", color: "#059669", border: "#059669" };
      case "in_progress":
        return { bg: "#DBEAFE", color: "#1D4ED8", border: "#1D4ED8" };
      case "at_risk":
        return { bg: "#FEE2E2", color: "#DC2626", border: "#DC2626" };
      default:
        return { bg: "#F8FAFC", color: "#64748B", border: "#E2E8F0" };
    }
  };

  const getMilestoneLabel = (milestone) => {
    if (milestone.milestone_code) return milestone.milestone_code.replace(/^M\d+\s+/, "");
    if (isPostgrad && PG_LABELS[milestone.milestone_type]) return PG_LABELS[milestone.milestone_type];
    if (milestone.milestone_type === "academic_year") {
      return milestone.is_current_year ? `Yr ${milestone.year_number}` : `Yr ${milestone.year_number}`;
    }
    if (milestone.milestone_type === "enrollment") return "Enrolment";
    if (milestone.milestone_type === "graduation") return "Graduation";
    return milestone.milestone_type?.replace(/_/g, " ") || "Stage";
  };

  if (!milestones?.length) {
    return (
      <Paper elevation={0} sx={{ p: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">No journey milestones available yet</Typography>
      </Paper>
    );
  }

  const completed = milestones.filter((m) => m.status === "completed").length;
  const progressPct = Math.round((completed / milestones.length) * 100);
  const circleSize = compact ? 36 : 56;
  const iconSize = compact ? 18 : 26;

  return (
    <Paper elevation={0} sx={{ p: compact ? 2 : 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Box>
          <Typography variant={compact ? "subtitle2" : "h6"} fontWeight={700}>
            {isPostgrad ? "Research Journey" : "Academic Journey"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {journeyData?.student?.current_milestone || "Track your progression"}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={`${progressPct}% complete`}
          sx={{ fontWeight: 700, fontSize: 11, bgcolor: ST.colors.bg }}
        />
      </Box>

      <Box sx={{ position: "relative", py: 0.5 }}>
        <Box sx={{ position: "absolute", top: circleSize / 2 + 4, left: 24, right: 24, height: 2, bgcolor: ST.colors.border, zIndex: 0 }} />
        <Box
          sx={{
            position: "absolute",
            top: circleSize / 2 + 4,
            left: 24,
            width: `calc((100% - 48px) * ${progressPct / 100})`,
            height: 2,
            bgcolor: ST.colors.success,
            zIndex: 1,
            transition: "width 0.3s ease",
          }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 0.5, position: "relative", zIndex: 2, overflowX: "auto", pb: 0.5 }}>
          {milestones.map((milestone) => {
            const colors = getMilestoneColor(milestone.status);
            const active = milestone.status === "in_progress" || milestone.is_current;
            return (
              <Box
                key={milestone.id}
                onClick={(e) => handleMilestoneClick(e, milestone)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  minWidth: compact ? 72 : 88,
                  flex: 1,
                  "&:hover .jt-circle": { transform: "scale(1.06)" },
                }}
              >
                <Box
                  className="jt-circle"
                  sx={{
                    width: circleSize,
                    height: circleSize,
                    borderRadius: "50%",
                    bgcolor: colors.bg,
                    border: `2px solid ${colors.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.color,
                    transition: "transform 0.15s",
                    boxShadow: active ? `0 0 0 3px ${colors.bg}` : "none",
                  }}
                >
                  {getMilestoneIcon(milestone.status, iconSize)}
                </Box>
                <Typography
                  variant="caption"
                  fontWeight={active ? 700 : 500}
                  sx={{ color: active ? colors.color : ST.colors.textSecondary, textAlign: "center", mt: 0.75, fontSize: compact ? 10 : 11, lineHeight: 1.2 }}
                >
                  {getMilestoneLabel(milestone)}
                </Typography>
                <AdvisorLines advisors={milestone.advisors} compact={compact} />
              </Box>
            );
          })}
        </Box>
      </Box>

      <Popover open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={handleClose} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} transformOrigin={{ vertical: "top", horizontal: "center" }}>
        {selectedMilestone && (
          <Box sx={{ p: 2.5, minWidth: 280, maxWidth: 380 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
              {getMilestoneLabel(selectedMilestone)}
            </Typography>
            <Chip
              size="small"
              label={selectedMilestone.status.replace("_", " ")}
              sx={{ mb: 1.5, fontWeight: 600, bgcolor: getMilestoneColor(selectedMilestone.status).bg, color: getMilestoneColor(selectedMilestone.status).color }}
            />
            {selectedMilestone.notes && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {selectedMilestone.notes}
              </Typography>
            )}
            {selectedMilestone.dissertation_title && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Thesis:</strong> {selectedMilestone.dissertation_title}
              </Typography>
            )}

            {(selectedMilestone.advisors?.length > 0) && (
              <Box sx={{ mb: 1.5, p: 1.25, bgcolor: ST.colors.bg, borderRadius: 1.5 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                  Advisor(s) for this stage
                </Typography>
                <Stack spacing={0.75}>
                  {selectedMilestone.advisors.map((a) => (
                    <Box key={`${a.role}-${a.name}`} sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
                      <PersonOutlineIcon sx={{ fontSize: 16, color: ST.colors.primary, mt: 0.15 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>{a.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{a.role}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary">
              {selectedMilestone.milestone_date
                ? new Date(selectedMilestone.milestone_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                : "Date TBC"}
            </Typography>
            {journeyData?.student?.gpa && !isPostgrad && (
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                GPA {journeyData.student.gpa} · {journeyData.student.academic_standing}
              </Typography>
            )}
          </Box>
        )}
      </Popover>
    </Paper>
  );
}
