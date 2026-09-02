"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
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
import Button from "@mui/material/Button";
import { useRouter } from "next/navigation";
import SchoolIcon from "@mui/icons-material/School";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import JourneyTimeline from "@/components/student/JourneyTimeline";
import ApplicationDashboardHub from "@/components/student/scholarships/ApplicationDashboardHub";
import { transformExcelJourney } from "@/lib/studentJourney";
import { inferStudentLevel } from "@/lib/studentLevel";
import { isModuleEnabled } from "@/lib/institutionModules";
import ScienceIcon from "@mui/icons-material/Science";

const gradeColor = (g) => {
  if (!g) return ST.colors.textSecondary;
  if (g === "A") return ST.colors.success;
  if (g === "B") return ST.chart.blue;
  if (g === "C") return ST.colors.warning;
  return ST.colors.error;
};

const StatCard = ({ icon, label, value, sub, color, onClick }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%",
      cursor: onClick ? "pointer" : "default",
      "&:hover": onClick ? { borderColor: color, boxShadow: `0 0 0 1px ${color}20` } : {},
      transition: "all 0.2s",
    }}
  >
    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <Box>
        <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontWeight: 500 }}>{label}</Typography>
        <Typography variant="h4" fontWeight={800} sx={{ color: ST.colors.textPrimary, lineHeight: 1.1, mt: 0.5 }}>{value}</Typography>
        {sub && <Typography variant="caption" sx={{ color: ST.colors.textSecondary, mt: 0.5, display: "block" }}>{sub}</Typography>}
      </Box>
      <Box sx={{ bgcolor: `${color}18`, borderRadius: 2, p: 1.2, display: "flex" }}>
        {icon}
      </Box>
    </Box>
  </Paper>
);

function StudentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const D = t.student.dashboard;
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [journeyData, setJourneyData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [userData, profileData] = await Promise.all([
          apiFetch("/auth/me"),
          apiFetch("/sis-lms/my-profile"),
        ]);
        setUser(userData);
        setProfile(profileData);
        
        // Fetch journey data
        try {
          const excelJourneyData = await apiFetch("/student-journey/my-journey-excel");
          setJourneyData(transformExcelJourney(excelJourneyData));
        } catch (journeyErr) {
          console.error("Error fetching journey data:", journeyErr);
        }
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  const s = profile?.student ?? {};
  const stats = profile?.statistics ?? {};
  const enrollments = profile?.enrollments ?? [];
  const grades = profile?.grades ?? [];
  const payments = profile?.payments ?? [];
  const scholarshipApps = profile?.scholarship_apps ?? [];

  const activeEnrollments = enrollments.filter((e) => e.status === "Enrolled");
  const completedEnrollments = enrollments.filter((e) => e.status === "Completed");

  // Grade distribution for chart
  const gradeMap = {};
  grades.forEach((g) => { const l = g.letter_grade; if (l) gradeMap[l] = (gradeMap[l] || 0) + 1; });
  const gradeChartData = ["A", "B", "C", "D", "F"]
    .filter((k) => gradeMap[k])
    .map((k) => ({ name: k, count: gradeMap[k], fill: gradeColor(k) }));

  // Attendance radial
  const attendanceData = [{ name: "Attendance", value: stats.attendance_rate ?? 0, fill: stats.attendance_rate >= 75 ? ST.chart.green : ST.chart.red }];

  const approvedScholarship = scholarshipApps.find((a) => a.status?.toLowerCase() === "approved");
  const isPostgrad = inferStudentLevel(s) === "postgraduate" || journeyData?.is_postgraduate;
  const pg = journeyData?.pg_research;
  const showScholarships = isModuleEnabled(user?.enabled_modules, "student", "scholarships");
  const showGrants = isModuleEnabled(user?.enabled_modules, "student", "grants");

  return (
    <Box>
      {searchParams.get("submitted") === "1" && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {D.scholarshipSubmitted}
        </Alert>
      )}
      {/* Welcome Banner */}
      <Paper
        elevation={0}
        sx={{
          mb: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden",
          background: `linear-gradient(135deg, ${ST.colors.primary} 0%, #1e40af 100%)`,
        }}
      >
        <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap" }}>
          <Avatar sx={{ width: 68, height: 68, fontSize: 26, fontWeight: 800, bgcolor: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.4)" }}>
            {s.full_name?.charAt(0) || "?"}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} sx={{ color: "white", lineHeight: 1.2 }}>
              {D.welcomeBack} {s.full_name?.split(" ")[0] || user?.full_name?.split(" ")[0]}!
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.5 }}>
              {s.student_id} · {s.program} · {s.major}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
              <Chip label={isPostgrad ? (s.programme_level || s.program || "Postgraduate") : `Year ${s.year_of_study}`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 600, border: "1px solid rgba(255,255,255,0.3)" }} />
              {isPostgrad && pg?.supervisor && (
                <Chip label={`Supervisor: ${pg.supervisor}`} size="small" sx={{ bgcolor: "rgba(0,164,175,0.25)", color: "white", fontWeight: 600 }} />
              )}
              <Chip label={s.status || "Active"} size="small"
                sx={{ bgcolor: s.status === "Active" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)", color: "white", fontWeight: 600, border: `1px solid ${s.status === "Active" ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)"}` }}
              />
              <Chip label={journeyData?.student?.current_milestone || s.journey_stage || s.nationality} size="small" sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 600, border: "1px solid rgba(255,255,255,0.3)" }} />
            </Box>
          </Box>
          <Box sx={{ textAlign: "right", display: { xs: "none", md: "block" } }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>{D.cumulativeGpa}</Typography>
            <Typography variant="h3" fontWeight={900} sx={{ color: "white", lineHeight: 1 }}>{stats.gpa?.toFixed(2) ?? "—"}</Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>{D.outOf}</Typography>
          </Box>
        </Box>
      </Paper>

      {!isPostgrad && showScholarships && <ApplicationDashboardHub profile={profile} user={user} />}

      {isPostgrad && pg && showGrants && (
        <Paper elevation={0} sx={{ mb: 3, p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <Box sx={{ bgcolor: `${ST.chart.purple}18`, borderRadius: 2, p: 1.2 }}><ScienceIcon sx={{ color: ST.chart.purple }} /></Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>{pg.dissertation_title || D.researchProgramme}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {pg.research_area} · {D.next} {pg.next_milestone || "—"}
              </Typography>
              <Button size="small" sx={{ mt: 1, textTransform: "none", fontWeight: 600 }} onClick={() => router.push("/student/grants")}>
                {D.viewGrantInfo}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {journeyData && (
        <Box sx={{ mb: 3 }}>
          <JourneyTimeline milestones={journeyData.milestones || []} journeyData={journeyData} compact />
        </Box>
      )}

      {/* Stat Cards Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<SchoolIcon sx={{ fontSize: 22, color: ST.chart.blue }} />}
            label={D.stats.creditsEnrolled} color={ST.chart.blue}
            value={stats.total_credits_enrolled ?? 0}
            sub={`${stats.total_credits_completed ?? 0} ${D.stats.completed}`}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<EventAvailableIcon sx={{ fontSize: 22, color: ST.chart.green }} />}
            label={D.stats.attendanceRate} color={ST.chart.green}
            value={`${stats.attendance_rate ?? 0}%`}
            sub={`${stats.total_present ?? 0} / ${stats.total_sessions ?? 0} ${D.stats.sessions}`}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<AccountBalanceWalletIcon sx={{ fontSize: 22, color: stats.balance_due > 0 ? ST.colors.error : ST.colors.success }} />}
            label={D.stats.balanceDue} color={stats.balance_due > 0 ? ST.colors.error : ST.colors.success}
            value={`KES ${(stats.balance_due ?? 0).toLocaleString()}`}
            sub={`KES ${(stats.total_paid ?? 0).toLocaleString()} ${D.stats.paid}`}
            onClick={() => router.push("/student/financials")}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={isPostgrad ? <ScienceIcon sx={{ fontSize: 22, color: ST.chart.purple }} /> : <EmojiEventsIcon sx={{ fontSize: 22, color: ST.chart.purple }} />}
            label={isPostgrad ? D.stats.publications : D.stats.scholarships}
            color={ST.chart.purple}
            value={isPostgrad ? (pg?.publications ?? 0) : (stats.approved_scholarships ?? 0)}
            sub={isPostgrad ? `${pg?.conferences ?? 0} ${D.stats.conferences}` : `KES ${(stats.total_scholarships ?? 0).toLocaleString()} ${D.stats.appliedToFees}`}
            onClick={() => router.push(isPostgrad ? "/student/grants" : "/student/scholarships")}
          />
        </Grid>
      </Grid>

      {/* Row 2: Courses + Charts */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Current Courses */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%" }}>
            <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>{D.courses.title}</Typography>
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{activeEnrollments.length} {D.courses.enrolledSemester}</Typography>
              </Box>
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => router.push("/student/courses")}
                sx={{ textTransform: "none", color: ST.colors.primary, fontWeight: 600, fontSize: 12 }}>
                {t.common.viewAll}
              </Button>
            </Box>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: ST.colors.bg }}>
                    <TableCell sx={{ fontWeight: 700, color: ST.colors.textPrimary, fontSize: 12 }}>{D.courses.headers.course}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: ST.colors.textPrimary, fontSize: 12 }}>{D.courses.headers.code}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: ST.colors.textPrimary, fontSize: 12 }}>{D.courses.headers.credits}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: ST.colors.textPrimary, fontSize: 12 }}>{D.courses.headers.grade}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeEnrollments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: ST.colors.textSecondary }}>{D.courses.noActive}</TableCell>
                    </TableRow>
                  ) : (
                    activeEnrollments.slice(0, 6).map((e, i) => {
                      const grade = grades.find((g) => g.course_code === e.course_code);
                      return (
                        <TableRow key={i} hover sx={{ "&:last-child td": { border: 0 } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary, fontSize: 13 }}>
                              {e.course_details?.title || e.course_code}
                            </Typography>
                            <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
                              {e.course_details?.department || ""}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontFamily: "monospace" }}>{e.course_code}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>{e.course_details?.credits ?? "—"}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            {grade?.letter_grade ? (
                              <Chip label={grade.letter_grade} size="small"
                                sx={{ fontWeight: 800, fontSize: 12, bgcolor: `${gradeColor(grade.letter_grade)}18`, color: gradeColor(grade.letter_grade), border: `1px solid ${gradeColor(grade.letter_grade)}40` }}
                              />
                            ) : (
                              <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>—</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Attendance + Grade Dist */}
        <Grid item xs={12} md={5}>
          <Grid container spacing={2.5} sx={{ height: "100%" }}>
            {/* Attendance Radial */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: ST.colors.textPrimary, mb: 1 }}>{D.attendance.title}</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ width: 100, height: 100, position: "relative" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ value: 100, fill: "#E2E8F0" }, ...attendanceData]} startAngle={90} endAngle={-270}>
                        <RadialBar dataKey="value" cornerRadius={6} background={false} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: ST.colors.textPrimary }}>{stats.attendance_rate ?? 0}%</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Sessions attended</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>{stats.total_present}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Total sessions</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>{stats.total_sessions}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Status</Typography>
                      <Chip
                        size="small"
                        label={stats.attendance_rate >= 75 ? "Compliant" : "At Risk"}
                        icon={stats.attendance_rate >= 75 ? <CheckCircleIcon sx={{ fontSize: "14px !important" }} /> : <WarningAmberIcon sx={{ fontSize: "14px !important" }} />}
                        sx={{
                          height: 20, fontSize: 10, fontWeight: 700,
                          bgcolor: stats.attendance_rate >= 75 ? ST.colors.successLight : ST.colors.errorLight,
                          color: stats.attendance_rate >= 75 ? ST.colors.success : ST.colors.error,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Grade Distribution */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: ST.colors.textPrimary, mb: 1.5 }}>{D.grades.title}</Typography>
                {gradeChartData.length === 0 ? (
                  <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{t.student.grades.noGrades}</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={gradeChartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: ST.chart.text }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: ST.chart.text }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} cursor={{ fill: ST.colors.bg }} />
                      <Bar dataKey="count" name="Courses" radius={[4, 4, 0, 0]}>
                        {gradeChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Row 3: Financial Summary + Scholarship Status */}
      <Grid container spacing={2.5}>
        {/* Financial Summary */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>{D.financial.title}</Typography>
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Current academic year fees</Typography>
              </Box>
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => router.push("/student/financials")}
                sx={{ textTransform: "none", color: ST.colors.primary, fontWeight: 600, fontSize: 12 }}>
                Details
              </Button>
            </Box>
            <Divider />
            <Box sx={{ p: 3 }}>
              {/* Fee breakdown bars */}
              {[
                { label: D.financial.totalFees, value: stats.total_fees ?? 0, color: ST.chart.blue, pct: 100 },
                { label: D.financial.paid, value: stats.total_paid ?? 0, color: ST.chart.green, pct: stats.total_fees > 0 ? (stats.total_paid / stats.total_fees) * 100 : 0 },
                { label: D.financial.scholarship, value: stats.total_scholarships ?? 0, color: ST.chart.purple, pct: stats.total_fees > 0 ? (stats.total_scholarships / stats.total_fees) * 100 : 0 },
                { label: D.financial.balance, value: stats.balance_due ?? 0, color: stats.balance_due > 0 ? ST.chart.red : ST.chart.green, pct: stats.total_fees > 0 ? (stats.balance_due / stats.total_fees) * 100 : 0 },
              ].map((item) => (
                <Box key={item.label} sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: ST.colors.textSecondary, fontSize: 13 }}>{item.label}</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: ST.colors.textPrimary, fontSize: 13 }}>
                      KES {item.value.toLocaleString()}
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={Math.min(item.pct, 100)}
                    sx={{ height: 6, borderRadius: 3, bgcolor: ST.colors.bg, "& .MuiLinearProgress-bar": { bgcolor: item.color, borderRadius: 3 } }}
                  />
                </Box>
              ))}

              {/* Recent payments */}
              {payments.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>{t.student.financials.paymentHistory}</Typography>
                  {payments.slice(0, 3).map((p, i) => (
                    <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5 }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary, fontSize: 13 }}>{p.method || "Payment"}</Typography>
                        <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{p.date || "—"}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: ST.colors.success, fontSize: 13 }}>
                        + KES {Number(p["amount_(kes)"] || p.amount || 0).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Scholarship & Academic Info */}
        <Grid item xs={12} md={5}>
          <Grid container spacing={2.5}>
            {/* Scholarship Status */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>{t.student.scholarships.title}</Typography>
                  <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => router.push("/student/scholarships")}
                    sx={{ textTransform: "none", color: ST.colors.primary, fontWeight: 600, fontSize: 12 }}>
                    {t.common.viewAll}
                  </Button>
                </Box>
                {scholarshipApps.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 2 }}>
                    <EmojiEventsIcon sx={{ color: ST.colors.border, fontSize: 36 }} />
                    <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 1 }}>No scholarship applications</Typography>
                  </Box>
                ) : (
                  scholarshipApps.slice(0, 3).map((app, i) => {
                    const statusColor = app.status === "Approved" ? ST.colors.success : app.status === "Rejected" ? ST.colors.error : ST.colors.warning;
                    const statusBg = app.status === "Approved" ? ST.colors.successLight : app.status === "Rejected" ? ST.colors.errorLight : ST.colors.warningLight;
                    return (
                      <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5, borderBottom: i < Math.min(scholarshipApps.length, 3) - 1 ? `1px solid ${ST.colors.border}` : "none" }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {app.scholarship_details?.scholarship_name || app.scholarship_name || `Scholarship #${app.schol_id}`}
                          </Typography>
                          <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
                            Applied: {app.applied_date || "—"}
                          </Typography>
                        </Box>
                        <Chip label={app.status} size="small" sx={{ fontWeight: 700, fontSize: 11, bgcolor: statusBg, color: statusColor, ml: 1, flexShrink: 0 }} />
                      </Box>
                    );
                  })
                )}
              </Paper>
            </Grid>

            {/* Academic Info Card */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: ST.colors.textPrimary, mb: 2 }}>{D.academicProfile.title}</Typography>
                {[
                  { label: D.academicProfile.programme, value: s.student_id },
                  { label: D.academicProfile.programme, value: s.program },
                  { label: t.student.profile.fields.department, value: s.major },
                  { label: D.academicProfile.year, value: s.year_of_study },
                  { label: "Cohort", value: s.cohort },
                  { label: D.academicProfile.enrolled, value: s.enrollment_date ? String(s.enrollment_date).split("T")[0] : "—" },
                  { label: "Advisor", value: s.advisor_name || "—" },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ display: "flex", justifyContent: "space-between", py: 0.75, borderBottom: `1px solid ${ST.colors.bg}` }}>
                    <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{label}</Typography>
                    <Typography variant="caption" fontWeight={600} sx={{ color: ST.colors.textPrimary, textAlign: "right", maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {value || "—"}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>}>
      <StudentDashboardContent />
    </Suspense>
  );
}
