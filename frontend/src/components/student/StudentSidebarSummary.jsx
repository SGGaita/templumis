"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import LinearProgress from "@mui/material/LinearProgress";
import Button from "@mui/material/Button";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ScienceIcon from "@mui/icons-material/Science";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { parseCurrentYearSem } from "@/lib/studentJourney";

function parseYearLabel(yearOfStudy) {
  const m = String(yearOfStudy || "").match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * @param {object} props
 * @param {{ full_name?: string }} props.user
 * @param {object} [props.student]
 * @param {{ gpa?: number, attendance_rate?: number }} [props.statistics]
 * @param {string} [props.currentYearSem]
 * @param {number} [props.eligibleScholarships]
 */
export default function StudentSidebarSummary({
  user,
  student = {},
  statistics = {},
  currentYearSem,
  eligibleScholarships = 0,
  isPostgraduate = false,
}) {
  const router = useRouter();
  const gpa = Number(statistics.gpa ?? 0);
  const attendance = Number(statistics.attendance_rate ?? 0);
  const parsed = parseCurrentYearSem(currentYearSem || student.year_of_study);
  const yearNum = parsed.year || parseYearLabel(student.year_of_study) || 1;
  const currentSem = parsed.semester || 1;
  const yearProgressPct = currentSem === 1 ? 50 : currentSem >= 2 ? 100 : 25;

  const gpaColor = gpa >= 3.5 ? "#34D399" : gpa >= 2.5 ? "#FCD34D" : "#F87171";
  const attColor = attendance >= 85 ? "#34D399" : attendance >= 75 ? "#FCD34D" : "#F87171";

  const programLine = [student.program, student.major].filter(Boolean).join(" · ") || "—";

  return (
    <Box
      sx={{
        mx: 1.5,
        mb: 0.5,
        px: 1.25,
        py: 1,
        borderRadius: 1.5,
        bgcolor: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: BRAND.teal,
            fontSize: 13,
            fontWeight: 700,
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          {user?.full_name?.charAt(0)?.toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            noWrap
            sx={{ fontSize: 12, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}
          >
            {user?.full_name}
          </Typography>
          <Typography noWrap sx={{ fontSize: 10, color: "rgba(255,255,255,0.65)", lineHeight: 1.3 }}>
            {programLine}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 0.5,
          mb: 0.75,
          px: 0.75,
          py: 0.5,
          borderRadius: 1,
          bgcolor: "rgba(0,0,0,0.2)",
        }}
      >
        <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>
          GPA{" "}
          <Box component="span" sx={{ fontWeight: 800, color: gpaColor, fontSize: 12 }}>
            {gpa.toFixed(2)}
          </Box>
        </Typography>
        <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>
          Attend.{" "}
          <Box component="span" sx={{ fontWeight: 800, color: attColor, fontSize: 12 }}>
            {attendance}%
          </Box>
        </Typography>
      </Box>

      <Box sx={{ mb: 0.75 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
          <Typography sx={{ fontSize: 9, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
            Year {yearNum} · Sem {currentSem}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.25 }}>
            {["1", "2"].map((sem) => {
              const active = String(currentSem) === sem;
              return (
                <Box
                  key={sem}
                  sx={{
                    fontSize: 8,
                    fontWeight: 700,
                    px: 0.5,
                    py: 0.15,
                    borderRadius: 0.5,
                    bgcolor: active ? "rgba(0,164,175,0.4)" : "rgba(255,255,255,0.06)",
                    color: active ? "#fff" : "rgba(255,255,255,0.4)",
                    border: active ? `1px solid ${BRAND.teal}` : "1px solid transparent",
                  }}
                >
                  S{sem}
                </Box>
              );
            })}
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={yearProgressPct}
          sx={{
            height: 3,
            borderRadius: 2,
            bgcolor: "rgba(255,255,255,0.1)",
            "& .MuiLinearProgress-bar": { bgcolor: BRAND.teal, borderRadius: 2 },
          }}
        />
      </Box>

      <Button
        fullWidth
        size="small"
        startIcon={isPostgraduate ? <ScienceIcon sx={{ fontSize: 14 }} /> : <EmojiEventsIcon sx={{ fontSize: 14 }} />}
        onClick={() => router.push(isPostgraduate ? "/student/grants/opportunities" : "/student/scholarships/available")}
        sx={{
          textTransform: "none",
          fontWeight: 700,
          fontSize: 11,
          minHeight: 28,
          py: 0.35,
          bgcolor: !isPostgraduate && eligibleScholarships > 0 ? BRAND.teal : "rgba(255,255,255,0.1)",
          color: "#fff",
          border: !isPostgraduate && eligibleScholarships > 0 ? "none" : "1px solid rgba(255,255,255,0.2)",
          "&:hover": { bgcolor: !isPostgraduate && eligibleScholarships > 0 ? "#008f98" : "rgba(255,255,255,0.16)" },
          "& .MuiButton-startIcon": { mr: 0.5 },
        }}
      >
        {isPostgraduate ? "Grant opportunities" : eligibleScholarships > 0 ? `${eligibleScholarships} open — apply` : "Scholarships"}
      </Button>
    </Box>
  );
}
