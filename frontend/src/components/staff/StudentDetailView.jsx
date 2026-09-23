"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import LinearProgress from "@mui/material/LinearProgress";
import Avatar from "@mui/material/Avatar";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import SchoolIcon from "@mui/icons-material/School";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import WcIcon from "@mui/icons-material/Wc";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ST } from "@/lib/staffTheme";
import { useLanguage } from "@/lib/language-context";

const OUTCOME_STYLE = {
  passed: { bg: ST.colors.successLight, color: ST.colors.success },
  failed: { bg: ST.colors.errorLight, color: ST.colors.error },
  enrolled: { bg: ST.colors.primaryLight, color: ST.colors.primary },
};

const fmtKes = (n) => `KES ${Number(n || 0).toLocaleString()}`;

const programmeLabel = (student) => {
  if (student.programme_label) return student.programme_label;
  const program = student.program || student.programme;
  const major = student.major;
  if (program && major && String(major).toLowerCase() !== String(program).toLowerCase()) {
    return `${program}. ${major}`;
  }
  return program || major || "—";
};

const InfoRow = ({ icon, label, value }) => (
  <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", mb: 1.5 }}>
    <Box sx={{ color: ST.colors.textSecondary, mt: 0.2, flexShrink: 0 }}>{icon}</Box>
    <Box>
      <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", lineHeight: 1.2 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={500} sx={{ color: ST.colors.textPrimary }}>{value || "—"}</Typography>
    </Box>
  </Box>
);

const StatMini = ({ label, value, sub, color }) => (
  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2, textAlign: "center", height: "100%" }}>
    <Typography variant="h4" fontWeight={800} sx={{ color: color || ST.colors.primary, lineHeight: 1.1 }}>{value}</Typography>
    <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", mt: 0.25 }}>{label}</Typography>
    {sub && <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontSize: 10 }}>{sub}</Typography>}
  </Paper>
);

const summarizeCourses = (courses) => {
  const summary = { passed: 0, failed: 0, enrolled: 0, total: courses.length };
  courses.forEach((c) => {
    if (summary[c.outcome] != null) summary[c.outcome] += 1;
  });
  return summary;
};

export default function StudentDetailView({ data }) {
  const router = useRouter();
  const { t } = useLanguage();
  const L = t.staff.studentDetail;

  const student = data.student || {};
  const stats = data.statistics || {};
  const demographics = data.demographics || {};
  const support = data.financial_support || {};
  const allCourses = data.course_performance?.courses || [];
  const periods = data.course_performance?.periods || { academic_years: [], semesters: [] };

  const [tab, setTab] = useState(0);
  const [academicYear, setAcademicYear] = useState("all");
  const [semester, setSemester] = useState("all");

  const filteredCourses = useMemo(() => allCourses.filter((c) => {
    if (academicYear !== "all" && c.academic_year !== academicYear) return false;
    if (semester !== "all" && c.semester !== semester) return false;
    return true;
  }), [allCourses, academicYear, semester]);

  const summary = useMemo(() => summarizeCourses(filteredCourses), [filteredCourses]);

  const headSx = {
    fontWeight: 600, fontSize: 12, color: ST.colors.textSecondary,
    bgcolor: ST.colors.bg, borderBottom: `1px solid ${ST.colors.border}`,
  };

  const outcomeChart = [
    { name: L.passed, value: summary.passed, fill: ST.chart.green },
    { name: L.failed, value: summary.failed, fill: ST.chart.red },
    { name: L.inProgress, value: summary.enrolled, fill: ST.chart.blue },
  ].filter((d) => d.value > 0);

  const scoreChart = filteredCourses
    .map((c) => ({
      name: c.course_code,
      score: Number(c.final_score ?? c.midterm_grade ?? c.midterm_score ?? c.current_grade ?? 0),
      outcome: c.outcome,
    }))
    .filter((c) => c.score > 0);

  const creditsCompleted = student.credits_completed || student.credit_hours_earned || stats.total_credits_completed || 0;
  const creditsRequired = student.credits_required || 120;
  const creditPct = Math.min(100, (creditsCompleted / creditsRequired) * 100);

  const disabilityLabel = demographics.has_disability === "Yes"
    ? `${L.yes}${demographics.disability_type && demographics.disability_type !== "None" ? ` · ${demographics.disability_type}` : ""}`
    : demographics.has_disability === "No" ? L.no : L.notRecorded;

  const prog = programmeLabel(student);
  const filterLabel = [
    academicYear !== "all" ? academicYear : null,
    semester !== "all" ? semester : null,
  ].filter(Boolean).join(" · ") || L.filterAllPeriods;

  const PeriodFilters = () => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 2 }}>
      <Box>
        <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", mb: 0.5 }}>{L.filterAcademicYear}</Typography>
        <ToggleButtonGroup size="small" value={academicYear} exclusive onChange={(_, v) => v && setAcademicYear(v)}>
          <ToggleButton value="all" sx={{ textTransform: "none", px: 1.5 }}>{L.filterAll}</ToggleButton>
          {periods.academic_years.map((y) => (
            <ToggleButton key={y} value={y} sx={{ textTransform: "none", px: 1.5 }}>{y}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", mb: 0.5 }}>{L.filterSemester}</Typography>
        <ToggleButtonGroup size="small" value={semester} exclusive onChange={(_, v) => v && setSemester(v)}>
          <ToggleButton value="all" sx={{ textTransform: "none", px: 1.5 }}>{L.filterAll}</ToggleButton>
          {periods.semesters.map((s) => (
            <ToggleButton key={s} value={s} sx={{ textTransform: "none", px: 1.5 }}>{s}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Chip label={filterLabel} size="small" sx={{ ml: "auto", fontWeight: 600, bgcolor: ST.colors.primaryLight, color: ST.colors.primary }} />
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
        <Button onClick={() => router.push("/staff/students")} startIcon={<ArrowBackIcon />} size="small"
          sx={{ textTransform: "none", color: ST.colors.textSecondary, fontWeight: 500 }}>
          {L.back}
        </Button>
        <Typography sx={{ color: ST.colors.textSecondary, fontSize: 14 }}>›</Typography>
        <Typography sx={{ fontSize: 14, color: ST.colors.textPrimary, fontWeight: 500 }}>{student.full_name}</Typography>
      </Box>

      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden", mb: 2.5 }}>
        <Box sx={{ bgcolor: ST.colors.primary, height: 72 }} />
        <Box sx={{ px: 3, pb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "flex-end", mt: -4.5, mb: 2, gap: 2, flexWrap: "wrap" }}>
            <Avatar sx={{ width: 72, height: 72, fontSize: 26, fontWeight: 700, bgcolor: ST.chart.teal, border: "4px solid white", boxShadow: 2 }}>
              {student.full_name?.charAt(0) || "?"}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 200, pb: 0.5 }}>
              <Typography variant="h5" fontWeight={700}>{student.full_name}</Typography>
              <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
                {student.student_id} · {prog}{student.year_of_study ? ` · ${student.year_of_study}` : ""}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                {student.status && student.status !== student.academic_standing && (
                  <Chip label={student.status} size="small" sx={{ fontWeight: 600, fontSize: 11, height: 22 }} />
                )}
                {student.academic_standing && (
                  <Chip
                    label={student.academic_standing}
                    size="small"
                    sx={{
                      bgcolor: String(student.academic_standing).toLowerCase().includes("probation")
                        ? ST.colors.warningLight : ST.colors.primaryLight,
                      color: String(student.academic_standing).toLowerCase().includes("probation")
                        ? ST.colors.warning : ST.colors.primary,
                      fontWeight: 600, fontSize: 11, height: 22,
                    }}
                  />
                )}
                {student.current_semester && (
                  <Chip label={student.current_semester} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />
                )}
              </Box>
            </Box>
          </Box>

          {/* Financial support strip */}
          <Paper
            variant="outlined"
            sx={{
              p: 2, mb: 2.5, borderRadius: 2,
              bgcolor: support.has_any_support ? ST.colors.primaryLight : ST.colors.bg,
              borderColor: support.has_any_support ? ST.colors.secondary : ST.colors.border,
            }}
          >
            <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, display: "block", mb: 1.5 }}>
              {L.financialSupport}
            </Typography>
            {!support.has_any_support ? (
              <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>{L.noFinancialSupport}</Typography>
            ) : (
              <Grid container spacing={2}>
                {support.nsfas && (
                  <Grid item xs={12} md={support.active_scholarships?.length ? 6 : 12}>
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                      <Box sx={{ bgcolor: ST.colors.secondary, color: "white", p: 1, borderRadius: 1.5, display: "flex" }}>
                        <VolunteerActivismIcon fontSize="small" />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={700}>{L.nsfasSupport}</Typography>
                        <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block" }}>
                          {support.nsfas.award_status || L.nsfasBeneficiary}
                        </Typography>
                        {support.nsfas["total_support_(kes)"] > 0 && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {L.nsfasAwarded}: <strong>{fmtKes(support.nsfas["total_support_(kes)"])}</strong>
                            {" · "}{L.nsfasDisbursed}: <strong>{fmtKes(support.nsfas["disbursed_(kes)"])}</strong>
                          </Typography>
                        )}
                        {support.nsfas.continuation_risk && (
                          <Chip label={support.nsfas.continuation_risk} size="small" sx={{ mt: 1, fontSize: 10, height: 20, fontWeight: 600 }} />
                        )}
                      </Box>
                    </Box>
                  </Grid>
                )}
                {support.active_scholarships?.length > 0 && (
                  <Grid item xs={12} md={support.nsfas ? 6 : 12}>
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                      <Box sx={{ bgcolor: ST.colors.warning, color: "white", p: 1, borderRadius: 1.5, display: "flex" }}>
                        <EmojiEventsIcon fontSize="small" />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={700}>{L.scholarshipSupport}</Typography>
                        {support.active_scholarships.map((s, i) => (
                          <Box key={i} sx={{ mt: i ? 1 : 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                            <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
                              {s.status}{s["amount_(kes)"] ? ` · ${fmtKes(s["amount_(kes)"])}` : ""}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            )}
          </Paper>

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.primary, textTransform: "uppercase", letterSpacing: 0.8, display: "block", mb: 1 }}>{L.contact}</Typography>
              <InfoRow icon={<EmailIcon sx={{ fontSize: 18 }} />} label={L.email} value={student.email} />
              <InfoRow icon={<PhoneIcon sx={{ fontSize: 18 }} />} label={L.phone} value={student.phone} />
              <InfoRow icon={<SchoolIcon sx={{ fontSize: 18 }} />} label={L.programme} value={prog} />
              {student.department && <InfoRow icon={<SchoolIcon sx={{ fontSize: 18 }} />} label={L.department} value={student.department} />}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" fontWeight={700} sx={{ color: ST.chart.teal, textTransform: "uppercase", letterSpacing: 0.8, display: "block", mb: 1 }}>{L.demographics}</Typography>
              <InfoRow icon={<WcIcon sx={{ fontSize: 18 }} />} label={L.gender} value={demographics.gender} />
              <InfoRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />} label={L.homeProvince} value={demographics.home_province || L.notRecorded} />
              <InfoRow icon={<AccessibilityNewIcon sx={{ fontSize: 18 }} />} label={L.disability} value={disabilityLabel} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.secondary, textTransform: "uppercase", letterSpacing: 0.8, display: "block", mb: 1 }}>{L.performance}</Typography>
              <InfoRow icon={<TrendingUpIcon sx={{ fontSize: 18 }} />} label={L.gpa} value={stats.gpa ?? student.gpa ?? "—"} />
              <InfoRow icon={<MenuBookIcon sx={{ fontSize: 18 }} />} label={L.attendance} value={stats.attendance_rate != null ? `${stats.attendance_rate}%` : "—"} />
              <InfoRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />} label={L.nationality} value={demographics.nationality} />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <PeriodFilters />

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3}><StatMini label={L.gpa} value={stats.gpa ?? "—"} sub=" / 4.0" color={(stats.gpa || 0) >= 3.5 ? ST.colors.success : ST.colors.warning} /></Grid>
        <Grid item xs={6} sm={3}><StatMini label={L.coursesPassed} value={summary.passed} color={ST.colors.success} /></Grid>
        <Grid item xs={6} sm={3}><StatMini label={L.coursesFailed} value={summary.failed} color={summary.failed > 0 ? ST.colors.error : ST.colors.textSecondary} /></Grid>
        <Grid item xs={6} sm={3}><StatMini label={L.inProgress} value={summary.enrolled} color={ST.colors.primary} /></Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>{L.courseOutcomes}</Typography>
            <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", mb: 2 }}>{filterLabel}</Typography>
            {outcomeChart.length === 0 ? (
              <Typography variant="body2" color="text.secondary">{L.noCoursesFilter}</Typography>
            ) : (
              <Box sx={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={outcomeChart} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {outcomeChart.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>{L.scoresByCourse}</Typography>
            <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", mb: 2 }}>{L.scoresSub} · {filterLabel}</Typography>
            {scoreChart.length === 0 ? (
              <Typography variant="body2" color="text.secondary">{L.noScoresFilter}</Typography>
            ) : (
              <Box sx={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreChart} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: ST.chart.text }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: ST.chart.text }} />
                    <Tooltip />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]} name={L.score}>
                      {scoreChart.map((e, i) => (
                        <Cell key={i} fill={e.outcome === "failed" ? ST.chart.red : e.outcome === "passed" ? ST.chart.green : ST.chart.teal} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ px: 2, borderBottom: `1px solid ${ST.colors.border}`, "& .MuiTab-root": { textTransform: "none", fontWeight: 500, minHeight: 48 } }}>
          <Tab label={L.tabCourses} />
          <Tab label={L.tabFinancial} icon={<AttachMoneyIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label={L.tabScholarships} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{L.creditProgress}</Typography>
                  <Typography variant="caption" fontWeight={700}>{creditPct.toFixed(0)}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={creditPct} sx={{ height: 8, borderRadius: 1, "& .MuiLinearProgress-bar": { bgcolor: ST.colors.primary } }} />
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary, mt: 0.5, display: "block" }}>
                  {creditsCompleted} / {creditsRequired} {L.credits}
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {[L.colCode, L.colTitle, L.colPeriod, L.colStatus, L.colOutcome, L.colMidterm, L.colFinal, L.colGrade, L.colCredits].map((h) => (
                        <TableCell key={h} sx={headSx}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCourses.length === 0 ? (
                      <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: ST.colors.textSecondary }}>{L.noCoursesFilter}</TableCell></TableRow>
                    ) : filteredCourses.map((c) => {
                      const st = OUTCOME_STYLE[c.outcome] || OUTCOME_STYLE.enrolled;
                      return (
                        <TableRow key={`${c.course_code}-${c.enrol_date}`} hover>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: 12, color: ST.colors.primary }}>{c.course_code}</TableCell>
                          <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{c.course_title}</TableCell>
                          <TableCell sx={{ fontSize: 11, color: ST.colors.textSecondary, whiteSpace: "nowrap" }}>
                            {c.academic_year}<br />{c.semester}
                          </TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{c.status}</TableCell>
                          <TableCell><Chip label={L[c.outcome] || c.outcome} size="small" sx={{ bgcolor: st.bg, color: st.color, fontWeight: 600, fontSize: 10, height: 20 }} /></TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{c.midterm_score ?? c.midterm_grade ?? "—"}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{c.final_score ?? "—"}</TableCell>
                          <TableCell sx={{ fontSize: 13, fontWeight: 700 }}>{c.letter_grade ?? c.current_grade ?? "—"}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{c.credits ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {tab === 1 && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { label: L.totalFees, value: stats.total_fees, color: ST.colors.textPrimary },
                  { label: L.totalPaid, value: stats.total_paid, color: ST.colors.success },
                  { label: L.balanceDue, value: stats.balance_due, color: ST.colors.error },
                ].map((item) => (
                  <Grid item xs={12} md={4} key={item.label}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ color: item.color }}>{fmtKes(item.value)}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>{[L.paymentId, L.date, L.amount, L.method, L.status].map((h) => <TableCell key={h} sx={headSx}>{h}</TableCell>)}</TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.payments || []).map((p, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>{p.payment_id || "—"}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{p.date ? new Date(p.date).toLocaleDateString() : "—"}</TableCell>
                        <TableCell sx={{ fontSize: 13, fontWeight: 700, color: ST.colors.success }}>{fmtKes(p["amount_(kes)"])}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{p.method || "—"}</TableCell>
                        <TableCell><Chip label={p.status || "—"} size="small" sx={{ fontSize: 10, height: 20 }} /></TableCell>
                      </TableRow>
                    ))}
                    {(!data.payments || data.payments.length === 0) && (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: ST.colors.textSecondary }}>{L.noPayments}</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {tab === 2 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>{[L.scholarshipName, L.appliedDate, L.scholarshipStatus, L.amount].map((h) => <TableCell key={h} sx={headSx}>{h}</TableCell>)}</TableRow>
                </TableHead>
                <TableBody>
                  {(data.scholarship_apps || []).map((app, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{app.scholarship_details?.scholarship_name || app.scholarship_name || "—"}</TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{app.applied_date ? new Date(app.applied_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell><Chip label={app.status || "—"} size="small" sx={{ fontSize: 10, height: 20 }} /></TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{app["award_amount_(kes)"] ? fmtKes(app["award_amount_(kes)"]) : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {(!data.scholarship_apps || data.scholarship_apps.length === 0) && (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: ST.colors.textSecondary }}>{L.noScholarships}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
