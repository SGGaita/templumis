"use client";

import { useState, useEffect } from "react";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LineChart, Line, ReferenceLine } from "recharts";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";

const GRADE_POINTS = { A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0 };
const gradeColor = (g) => {
  if (g === "A") return ST.colors.success;
  if (g === "B") return ST.chart.blue;
  if (g === "C") return ST.colors.warning;
  return ST.colors.error;
};

export default function GradesPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/sis-lms/my-profile")
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const grades = profile?.grades ?? [];
  const stats = profile?.statistics ?? {};

  // Grade distribution
  const gradeMap = {};
  grades.forEach((g) => { if (g.letter_grade) gradeMap[g.letter_grade] = (gradeMap[g.letter_grade] || 0) + 1; });
  const gradeChartData = ["A", "B", "C", "D", "F"].filter((k) => gradeMap[k]).map((k) => ({ name: k, count: gradeMap[k] }));

  // Score timeline
  const scoreData = grades
    .filter((g) => g.score != null)
    .map((g) => ({ name: g.course_code, score: Number(g.score), grade: g.letter_grade }));

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>Grades & Results</Typography>
        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>Academic performance and grade history</Typography>
      </Box>

      {/* GPA Hero */}
      <Paper elevation={0} sx={{ mb: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2, p: 3, background: `linear-gradient(135deg, ${ST.colors.primary} 0%, #1e40af 100%)` }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3} sx={{ textAlign: "center" }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>Cumulative GPA</Typography>
            <Typography variant="h2" fontWeight={900} sx={{ color: "white", lineHeight: 1.1 }}>{stats.gpa?.toFixed(2) ?? "—"}</Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>out of 4.00</Typography>
          </Grid>
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              {[
                { label: "Courses Graded", value: grades.length },
                { label: "Highest Grade", value: grades.some((g) => g.letter_grade === "A") ? "A" : grades[0]?.letter_grade ?? "—" },
                { label: "Avg Score", value: grades.length > 0 ? `${Math.round(grades.reduce((s, g) => s + Number(g.score || 0), 0) / grades.length)}%` : "—" },
                { label: "Credits Graded", value: grades.reduce((s, g) => s + (profile?.enrollments?.find(e => e.course_code === g.course_code)?.course_details?.credits || 0), 0) },
              ].map(({ label, value }) => (
                <Grid item xs={6} sm={3} key={label}>
                  <Box sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2, p: 1.5, textAlign: "center" }}>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block" }}>{label}</Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: "white" }}>{value}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Grade Distribution */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: ST.colors.textPrimary, mb: 2 }}>Grade Distribution</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gradeChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 13, fill: ST.chart.text }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: ST.chart.text }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} cursor={{ fill: ST.colors.bg }} />
                <Bar dataKey="count" name="Courses" radius={[5, 5, 0, 0]}>
                  {gradeChartData.map((e, i) => <Cell key={i} fill={gradeColor(e.name)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Score Trend */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: ST.colors.textPrimary, mb: 2 }}>Score Trend</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scoreData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: ST.chart.text }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={40} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: ST.chart.text }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`, "Score"]} />
                <ReferenceLine y={50} stroke={ST.colors.error} strokeDasharray="4 2" strokeWidth={1} />
                <Line type="monotone" dataKey="score" stroke={ST.chart.blue} strokeWidth={2.5} dot={{ fill: ST.chart.blue, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Grades Table */}
      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>Detailed Results</Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: ST.colors.bg }}>
                <TableCell sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Course</TableCell>
                <TableCell sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Code</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Credits</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Score</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Grade</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Grade Points</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Score Bar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grades.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: ST.colors.textSecondary }}>No grades recorded</TableCell></TableRow>
              ) : (
                grades.map((g, i) => {
                  const enr = profile?.enrollments?.find((e) => e.course_code === g.course_code);
                  const credits = enr?.course_details?.credits ?? 0;
                  const gp = GRADE_POINTS[g.letter_grade] ?? 0;
                  const score = Number(g.score || 0);
                  return (
                    <TableRow key={i} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary }}>
                          {enr?.course_details?.title || g.course_code}
                        </Typography>
                        <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{enr?.course_details?.department}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="caption" sx={{ fontFamily: "monospace", color: ST.colors.textSecondary }}>{g.course_code}</Typography></TableCell>
                      <TableCell align="center"><Typography variant="body2" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>{credits}</Typography></TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>{g.score != null ? `${g.score}%` : "—"}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={g.letter_grade || "—"} size="small"
                          sx={{ fontWeight: 800, fontSize: 13, bgcolor: `${gradeColor(g.letter_grade)}18`, color: gradeColor(g.letter_grade), border: `1px solid ${gradeColor(g.letter_grade)}40` }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>{gp.toFixed(1)}</Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <LinearProgress variant="determinate" value={Math.min(score, 100)}
                          sx={{ height: 6, borderRadius: 3, bgcolor: ST.colors.bg, "& .MuiLinearProgress-bar": { bgcolor: gradeColor(g.letter_grade), borderRadius: 3 } }}
                        />
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
