"use client";

import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import LinearProgress from "@mui/material/LinearProgress";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";

const gradeColor = (g) => {
  if (!g) return ST.colors.textSecondary;
  if (g === "A") return ST.colors.success;
  if (g === "B") return ST.chart.blue;
  if (g === "C") return ST.colors.warning;
  return ST.colors.error;
};

const statusColor = (s) => ({
  Enrolled: { bg: ST.colors.infoLight, color: ST.colors.info },
  Completed: { bg: ST.colors.successLight, color: ST.colors.success },
  Dropped: { bg: ST.colors.errorLight, color: ST.colors.error },
}[s] || { bg: ST.colors.bg, color: ST.colors.textSecondary });

export default function CoursesPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Enrolled");

  useEffect(() => {
    apiFetch("/sis-lms/my-profile")
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const enrollments = profile?.enrollments ?? [];
  const grades = profile?.grades ?? [];
  const attendance = profile?.attendance ?? [];

  const filtered = filter === "All" ? enrollments : enrollments.filter((e) => e.status === filter);

  const counts = {
    All: enrollments.length,
    Enrolled: enrollments.filter((e) => e.status === "Enrolled").length,
    Completed: enrollments.filter((e) => e.status === "Completed").length,
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>My Courses</Typography>
        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>
          All enrolled and completed courses
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: "Total Enrolled", value: counts.Enrolled, icon: <ScheduleIcon />, color: ST.chart.blue },
          { label: "Completed", value: counts.Completed, icon: <CheckCircleIcon />, color: ST.chart.green },
          { label: "Credits Enrolled", value: profile?.statistics?.total_credits_enrolled ?? 0, icon: <MenuBookIcon />, color: ST.chart.purple },
          { label: "Credits Completed", value: profile?.statistics?.total_credits_completed ?? 0, icon: <MenuBookIcon />, color: ST.chart.teal },
        ].map((c) => (
          <Grid item xs={6} md={3} key={c.label}>
            <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2, display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ bgcolor: `${c.color}18`, borderRadius: 1.5, p: 1, display: "flex" }}>
                {React.cloneElement(c.icon, { sx: { fontSize: 22, color: c.color } })}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{c.label}</Typography>
                <Typography variant="h5" fontWeight={800} sx={{ color: ST.colors.textPrimary }}>{c.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Table */}
      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>Course List</Typography>
          <ToggleButtonGroup value={filter} exclusive onChange={(_, v) => v && setFilter(v)} size="small">
            {["All", "Enrolled", "Completed"].map((f) => (
              <ToggleButton key={f} value={f} sx={{ textTransform: "none", fontWeight: 600, fontSize: 12, px: 2 }}>
                {f} ({counts[f] ?? enrollments.length})
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: ST.colors.bg }}>
                <TableCell sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Course</TableCell>
                <TableCell sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Department</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Credits</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Attendance</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Grade</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: ST.colors.textSecondary }}>
                    No courses found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e, i) => {
                  const grade = grades.find((g) => g.course_code === e.course_code);
                  const att = attendance.find((a) => a.course_code === e.course_code);
                  const attPct = att && att.total_sessions > 0
                    ? Math.round((att.present / att.total_sessions) * 100) : null;
                  const sc = statusColor(e.status);
                  return (
                    <TableRow key={i} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary }}>
                          {e.course_details?.title || e.course_code}
                        </Typography>
                        <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
                          {e.course_details?.instructor || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontFamily: "monospace", fontSize: 12 }}>{e.course_code}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, fontSize: 13 }}>
                          {e.course_details?.department || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
                          {e.course_details?.credits ?? "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 120 }}>
                        {attPct !== null ? (
                          <Box>
                            <Typography variant="caption" fontWeight={700} sx={{ color: attPct >= 75 ? ST.colors.success : ST.colors.error }}>
                              {attPct}%
                            </Typography>
                            <LinearProgress variant="determinate" value={Math.min(attPct, 100)}
                              sx={{ height: 4, borderRadius: 2, mt: 0.5, bgcolor: ST.colors.bg,
                                "& .MuiLinearProgress-bar": { bgcolor: attPct >= 75 ? ST.chart.green : ST.chart.red } }}
                            />
                          </Box>
                        ) : <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>—</Typography>}
                      </TableCell>
                      <TableCell align="center">
                        {grade?.letter_grade ? (
                          <Chip label={grade.letter_grade} size="small"
                            sx={{ fontWeight: 800, fontSize: 13, bgcolor: `${gradeColor(grade.letter_grade)}18`, color: gradeColor(grade.letter_grade), border: `1px solid ${gradeColor(grade.letter_grade)}40` }}
                          />
                        ) : <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>—</Typography>}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={e.status} size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: sc.bg, color: sc.color }} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
