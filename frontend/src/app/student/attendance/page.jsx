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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";

export default function AttendancePage() {
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

  const attendance = profile?.attendance ?? [];
  const stats = profile?.statistics ?? {};
  const overallRate = stats.attendance_rate ?? 0;
  const compliant = overallRate >= 75;

  const courseAttData = attendance.map((a) => {
    const pct = a.total_sessions > 0 ? Math.round((a.present / a.total_sessions) * 100) : 0;
    const enr = profile?.enrollments?.find((e) => e.course_code === a.course_code);
    return { name: a.course_code, title: enr?.course_details?.title || a.course_code, present: a.present, total: a.total_sessions, pct };
  }).sort((a, b) => b.pct - a.pct);

  const radialData = [{ name: "Attendance", value: overallRate, fill: compliant ? ST.chart.green : ST.chart.red }];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>Attendance</Typography>
        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>Session attendance across all enrolled courses</Typography>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Radial Overview */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2, textAlign: "center", height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: ST.colors.textPrimary, mb: 2 }}>Overall Attendance</Typography>
            <Box sx={{ position: "relative", height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="60%" outerRadius="100%" data={[{ value: 100, fill: "#E2E8F0" }, ...radialData]} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={8} background={false} />
                </RadialBarChart>
              </ResponsiveContainer>
              <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="h3" fontWeight={900} sx={{ color: ST.colors.textPrimary, lineHeight: 1 }}>{overallRate}%</Typography>
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>attendance rate</Typography>
              </Box>
            </Box>
            <Chip
              size="small"
              label={compliant ? "Compliant" : "At Risk — Below 75%"}
              icon={compliant ? <CheckCircleIcon sx={{ fontSize: "14px !important" }} /> : <WarningAmberIcon sx={{ fontSize: "14px !important" }} />}
              sx={{ mt: 2, fontWeight: 700, bgcolor: compliant ? ST.colors.successLight : ST.colors.errorLight, color: compliant ? ST.colors.success : ST.colors.error }}
            />
            <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mt: 2 }}>
              <Box sx={{ flex: 1, bgcolor: ST.colors.bg, borderRadius: 1.5, p: 1 }}>
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block" }}>Present</Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: ST.colors.success }}>{stats.total_present ?? 0}</Typography>
              </Box>
              <Box sx={{ flex: 1, bgcolor: ST.colors.bg, borderRadius: 1.5, p: 1 }}>
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block" }}>Total</Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: ST.colors.textPrimary }}>{stats.total_sessions ?? 0}</Typography>
              </Box>
              <Box sx={{ flex: 1, bgcolor: ST.colors.bg, borderRadius: 1.5, p: 1 }}>
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block" }}>Absent</Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: ST.colors.error }}>
                  {(stats.total_sessions ?? 0) - (stats.total_present ?? 0)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Bar chart */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: ST.colors.textPrimary, mb: 2 }}>Attendance by Course</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={courseAttData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: ST.chart.text }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={40} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: ST.chart.text }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v, n, p) => [`${v}%`, "Attendance"]} labelFormatter={(l) => courseAttData.find(d => d.name === l)?.title || l} />
                <Bar dataKey="pct" name="Attendance %" radius={[4, 4, 0, 0]}>
                  {courseAttData.map((e, i) => <Cell key={i} fill={e.pct >= 75 ? ST.chart.green : ST.chart.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Box sx={{ display: "flex", gap: 2, mt: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: ST.chart.green }} />
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>≥ 75% (Compliant)</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: ST.chart.red }} />
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{"< 75% (At Risk)"}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed table */}
      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>Course Breakdown</Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: ST.colors.bg }}>
                <TableCell sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Course</TableCell>
                <TableCell sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Code</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Present</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Total Sessions</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Absent</TableCell>
                <TableCell sx={{ fontWeight: 700, color: ST.colors.textPrimary, minWidth: 160 }}>Rate</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: ST.colors.textPrimary }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courseAttData.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: ST.colors.textSecondary }}>No attendance records</TableCell></TableRow>
              ) : (
                courseAttData.map((a, i) => (
                  <TableRow key={i} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary }}>{a.title}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="caption" sx={{ fontFamily: "monospace", color: ST.colors.textSecondary }}>{a.name}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" fontWeight={700} sx={{ color: ST.colors.success }}>{a.present}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>{a.total}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" fontWeight={700} sx={{ color: ST.colors.error }}>{a.total - a.present}</Typography></TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LinearProgress variant="determinate" value={Math.min(a.pct, 100)}
                          sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: ST.colors.bg, "& .MuiLinearProgress-bar": { bgcolor: a.pct >= 75 ? ST.chart.green : ST.chart.red, borderRadius: 3 } }}
                        />
                        <Typography variant="caption" fontWeight={700} sx={{ color: a.pct >= 75 ? ST.colors.success : ST.colors.error, minWidth: 36, textAlign: "right" }}>{a.pct}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small"
                        label={a.pct >= 75 ? "Compliant" : "At Risk"}
                        sx={{ fontWeight: 700, fontSize: 11, bgcolor: a.pct >= 75 ? ST.colors.successLight : ST.colors.errorLight, color: a.pct >= 75 ? ST.colors.success : ST.colors.error }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
