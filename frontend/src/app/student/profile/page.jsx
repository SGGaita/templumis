"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import LinearProgress from "@mui/material/LinearProgress";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import SchoolIcon from "@mui/icons-material/School";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import { inferStudentLevel, inferDegreeTier } from "@/lib/studentLevel";

/* helpers */
function Field({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25 }}>{value || "—"}</Typography>
    </Box>
  );
}

function SectionLabel({ icon: Icon, label }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
      <Icon sx={{ fontSize: 18, color: BRAND.teal }} />
      <Typography variant="subtitle1" fontWeight={700} sx={{ color: BRAND.navy }}>{label}</Typography>
    </Stack>
  );
}

const gradeColor = (g) => {
  if (!g) return ST.colors.textSecondary;
  const u = String(g).toUpperCase();
  if (u.startsWith("A")) return ST.colors.success;
  if (u.startsWith("B")) return "#16a34a";
  if (u.startsWith("C")) return ST.colors.warning;
  if (u.startsWith("D")) return "#f97316";
  if (u.startsWith("F")) return ST.colors.error;
  return ST.colors.textSecondary;
};
const gradeBg = (g) => {
  if (!g) return ST.colors.bg;
  const u = String(g).toUpperCase();
  if (u.startsWith("A")) return ST.colors.successLight;
  if (u.startsWith("B")) return "#dcfce7";
  if (u.startsWith("C")) return ST.colors.warningLight;
  if (u.startsWith("D")) return "#ffedd5";
  if (u.startsWith("F")) return ST.colors.errorLight;
  return ST.colors.bg;
};
const feeStatusStyle = (s) => {
  if (!s) return { bg: ST.colors.bg, color: ST.colors.textSecondary };
  const l = s.toLowerCase();
  if (l.includes("fully paid") || l === "paid") return { bg: ST.colors.successLight, color: ST.colors.success };
  if (l.includes("on track")) return { bg: ST.colors.infoLight, color: ST.colors.info };
  if (l.includes("partial") || l.includes("behind")) return { bg: ST.colors.warningLight, color: ST.colors.warning };
  if (l.includes("unpaid") || l.includes("overdue")) return { bg: ST.colors.errorLight, color: ST.colors.error };
  return { bg: ST.colors.bg, color: ST.colors.textSecondary };
};

/* Academic history tab */
function AcademicHistory({ grades, enrollments, attendance }) {
  const attMap = useMemo(() => {
    const m = {};
    attendance.forEach((a) => {
      const cc = a.course_code;
      if (!cc) return;
      const total = Number(a.total_sessions || 0);
      const present = Number(a.present || 0);
      m[cc] = total > 0 ? Math.round((present / total) * 100) : null;
    });
    return m;
  }, [attendance]);

  const grouped = useMemo(() => {
    const courseMap = {};
    enrollments.forEach((e) => {
      if (e.course_code) courseMap[e.course_code] = { ...courseMap[e.course_code], ...e };
    });
    grades.forEach((g) => {
      if (g.course_code) courseMap[g.course_code] = { ...courseMap[g.course_code], ...g };
    });

    const groups = {};
    Object.values(courseMap).forEach((c) => {
      const year = c.year || c.academic_year || "Unknown";
      const sem = c.semester || c.term || "";
      const key = `${year}||${sem}`;
      if (!groups[key]) groups[key] = { year, sem, courses: [] };
      groups[key].courses.push(c);
    });
    return Object.values(groups).sort((a, b) => String(b.year).localeCompare(String(a.year)));
  }, [grades, enrollments]);

  if (grouped.length === 0)
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <SchoolIcon sx={{ fontSize: 40, color: ST.colors.border, mb: 1 }} />
        <Typography variant="body2" color="text.secondary">No course records found.</Typography>
      </Box>
    );

  return (
    <Stack spacing={3}>
      {grouped.map(({ year, sem, courses }) => (
        <Box key={`${year}-${sem}`}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25, pb: 0.75, borderBottom: `2px solid ${BRAND.teal}25` }}>
            <Typography variant="caption" fontWeight={800} sx={{ color: BRAND.navy, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {year}
            </Typography>
            {sem && <Chip label={sem} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: `${BRAND.teal}14`, color: BRAND.teal }} />}
            <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
              {courses.length} course{courses.length !== 1 ? "s" : ""}
            </Typography>
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, color: ST.colors.textSecondary, py: 0.5, border: 0 } }}>
                <TableCell>Code</TableCell>
                <TableCell>Course name</TableCell>
                <TableCell align="center">Credits</TableCell>
                <TableCell align="center">Grade</TableCell>
                <TableCell align="center">GPA pts</TableCell>
                <TableCell align="center">Attendance</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.map((c, idx) => {
                const name = c.course_details?.course_name || c.course_name || c.course_code;
                const credits = c.course_details?.credits ?? c.credits ?? "—";
                const letter = c.letter_grade || c.grade || null;
                const gpt = c.grade_point ?? c.gpa_points ?? null;
                const att = attMap[c.course_code];
                const status = c.status || (letter ? "Completed" : "Enrolled");
                return (
                  <TableRow key={c.course_code + idx} sx={{
                    "&:last-child td": { border: 0 },
                    "& td": { py: 1, border: 0, borderBottom: `1px solid ${ST.colors.border}` },
                    "&:hover": { bgcolor: `${BRAND.teal}06` },
                  }}>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", color: BRAND.navy, fontWeight: 700 }}>
                        {c.course_code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: 12, maxWidth: 260 }} noWrap>{name}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption" fontWeight={700}>{credits}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      {letter
                        ? <Chip label={letter} size="small" sx={{ height: 22, fontSize: 12, fontWeight: 800, bgcolor: gradeBg(letter), color: gradeColor(letter) }} />
                        : <Typography variant="caption" color="text.secondary">—</Typography>
                      }
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption" fontWeight={600} sx={{ color: gpt != null ? BRAND.navy : ST.colors.textSecondary }}>
                        {gpt != null ? Number(gpt).toFixed(1) : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {att != null ? (
                        <Tooltip title={`${att}% attendance`}>
                          <Box sx={{ minWidth: 56 }}>
                            <Typography variant="caption" fontWeight={700} sx={{ color: att >= 75 ? ST.colors.success : att >= 50 ? ST.colors.warning : ST.colors.error }}>
                              {att}%
                            </Typography>
                            <LinearProgress variant="determinate" value={att} sx={{
                              height: 3, borderRadius: 2, mt: 0.25, bgcolor: ST.colors.border,
                              "& .MuiLinearProgress-bar": { bgcolor: att >= 75 ? ST.colors.success : att >= 50 ? ST.colors.warning : ST.colors.error },
                            }} />
                          </Box>
                        </Tooltip>
                      ) : <Typography variant="caption" color="text.secondary">—</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={status} size="small" sx={{
                        height: 18, fontSize: 10, fontWeight: 600,
                        bgcolor: status === "Completed" ? ST.colors.successLight : ST.colors.infoLight,
                        color: status === "Completed" ? ST.colors.success : ST.colors.info,
                      }} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      ))}
    </Stack>
  );
}

/* Financial activity tab */
function FinancialActivity({ feeRecords, payments, scholarshipApps, stats, router }) {
  /* Scholarship stage label + colour */
  const scholStyle = (app) => {
    const stage = app.award_stage || "";
    const status = String(app.status || "").toLowerCase();
    if (stage === "credited" || status === "awarded")
      return { label: "Applied to tuition", bg: ST.colors.successLight, color: ST.colors.success };
    if (stage === "offer_sent")
      return { label: "Offer received", bg: ST.colors.warningLight, color: ST.colors.warning };
    if (stage === "offer_accepted")
      return { label: "Offer accepted", bg: ST.colors.infoLight, color: ST.colors.info };
    if (stage === "offer_declined" || stage === "offer_expired")
      return { label: stage === "offer_declined" ? "Offer declined" : "Offer expired", bg: ST.colors.errorLight, color: ST.colors.error };
    if (status === "draft")
      return { label: "Draft", bg: ST.colors.bg, color: ST.colors.textSecondary };
    if (stage === "proposed" || stage === "approved")
      return { label: "Decision pending", bg: ST.colors.infoLight, color: ST.colors.info };
    return { label: app.workflow_label || "Under review", bg: ST.colors.warningLight, color: ST.colors.warning };
  };

  const totalFees = stats?.total_fees ?? 0;
  const totalPaid = stats?.total_paid ?? 0;
  const totalScholarships = stats?.total_scholarships ?? 0;
  const balance = stats?.net_balance_due ?? stats?.balance_due ?? 0;

  return (
    <Stack spacing={0} divider={<Divider />}>

      {/* ── 1. Summary bar ── */}
      <Box sx={{ pb: 3 }}>
        <Grid container spacing={2}>
          {[
            { label: "Total fees billed", value: totalFees, color: BRAND.navy, sub: `${feeRecords.length} year${feeRecords.length !== 1 ? "s" : ""}` },
            { label: "Amount paid", value: totalPaid, color: ST.colors.success, sub: `${payments.length} payment${payments.length !== 1 ? "s" : ""}` },
            { label: "Scholarships", value: totalScholarships, color: ST.chart?.purple || "#7c3aed", sub: `${scholarshipApps.length} application${scholarshipApps.length !== 1 ? "s" : ""}` },
            { label: "Balance due", value: balance, color: balance > 0 ? ST.colors.error : ST.colors.success, sub: balance > 0 ? "Outstanding" : "Cleared" },
          ].map(({ label, value, color, sub }) => (
            <Grid item xs={6} sm={3} key={label}>
              <Paper elevation={0} sx={{ p: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1.3, mt: 0.25 }}>
                  {value.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontSize: 10 }}>KES · {sub}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── 2. Scholarships applied ── */}
      <Box sx={{ py: 3 }}>
        <SectionLabel icon={EmojiEventsIcon} label="Scholarship applications" />
        {scholarshipApps.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No scholarship applications yet.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, color: ST.colors.textSecondary, py: 0.75, border: 0 } }}>
                <TableCell>Scholarship</TableCell>
                <TableCell align="center">Type</TableCell>
                <TableCell align="center">Applied</TableCell>
                <TableCell align="right">Amount (KES)</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scholarshipApps.map((a, i) => {
                const ss = scholStyle(a);
                const name = a.scholarship_name || a.scholarship_details?.scholarship_name || a.schol_id;
                const amount = a["award_amount_(kes)"] ?? a.scholarship_details?.["amount_(kes)"] ?? 0;
                return (
                  <TableRow key={i} sx={{
                    "&:last-child td": { border: 0 },
                    "& td": { py: 1, border: 0, borderBottom: `1px solid ${ST.colors.border}` },
                    "&:hover": { bgcolor: `${BRAND.teal}06` },
                  }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.navy, fontSize: 12 }}>{name}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      {a.scholarship_type
                        ? <Chip label={a.scholarship_type} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 600 }} />
                        : <Typography variant="caption" color="text.secondary">—</Typography>
                      }
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption" color="text.secondary">{a.applied_date || "—"}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" fontWeight={700} sx={{ color: Number(amount) > 0 ? ST.colors.success : ST.colors.textSecondary }}>
                        {Number(amount) > 0 ? Number(amount).toLocaleString() : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={ss.label} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: ss.bg, color: ss.color }} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* ── 3. Fee records ── */}
      <Box sx={{ py: 3 }}>
        <SectionLabel icon={ReceiptLongIcon} label="Fee records by academic year" />
        {feeRecords.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No fee records.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, color: ST.colors.textSecondary, py: 0.75, border: 0 } }}>
                <TableCell>Academic year</TableCell>
                <TableCell align="right">Total fees</TableCell>
                <TableCell align="right">Scholarship</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="center">Paid %</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {feeRecords.map((f, i) => {
                const sc = feeStatusStyle(f.status);
                const paid = Number(f.total_paid || 0);
                const total = Number(f.total_annual || f.net_payable || 0);
                const pct = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;
                const bal = Number(f.balance_due || 0);
                return (
                  <TableRow key={i} sx={{
                    "&:last-child td": { border: 0 },
                    "& td": { py: 1.25, border: 0, borderBottom: `1px solid ${ST.colors.border}` },
                    "&:hover": { bgcolor: `${BRAND.teal}06` },
                  }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.navy }}>AY {f.year || "—"}</Typography>
                      {f.program && <Typography variant="caption" color="text.secondary">{f.program}</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" fontWeight={600}>{total.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" fontWeight={600} sx={{ color: ST.chart?.purple || "#7c3aed" }}>
                        {Number(f.scholarship || 0) > 0 ? Number(f.scholarship).toLocaleString() : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" fontWeight={600} sx={{ color: ST.colors.success }}>{paid.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" fontWeight={700} sx={{ color: bal > 0 ? ST.colors.error : ST.colors.success }}>
                        {bal.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ minWidth: 80 }}>
                      <Box>
                        <Typography variant="caption" fontWeight={700} sx={{ color: pct === 100 ? ST.colors.success : BRAND.teal }}>{pct}%</Typography>
                        <LinearProgress variant="determinate" value={pct} sx={{
                          height: 4, borderRadius: 2, mt: 0.25, bgcolor: `${BRAND.teal}14`,
                          "& .MuiLinearProgress-bar": { bgcolor: pct === 100 ? ST.colors.success : BRAND.teal, borderRadius: 2 },
                        }} />
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={f.status || "—"} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: sc.bg, color: sc.color }} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* ── 4. Payment history ── */}
      <Box sx={{ pt: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <SectionLabel icon={CheckCircleOutlineIcon} label="Payment history" />
          <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => router.push("/student/financials")}
            sx={{ textTransform: "none", fontWeight: 600, color: BRAND.teal, fontSize: 12 }}>
            Full financials
          </Button>
        </Box>
        {payments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No payments recorded.</Typography>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, color: ST.colors.textSecondary, py: 0.75, border: 0 } }}>
                  <TableCell>Date</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell align="right">Amount (KES)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.slice(0, 8).map((p, i) => (
                  <TableRow key={i} sx={{
                    "&:last-child td": { border: 0 },
                    "& td": { py: 1, border: 0, borderBottom: `1px solid ${ST.colors.border}` },
                    "&:hover": { bgcolor: `${BRAND.teal}06` },
                  }}>
                    <TableCell><Typography variant="caption" fontWeight={600}>{p.date || "—"}</Typography></TableCell>
                    <TableCell><Typography variant="caption" sx={{ fontFamily: "monospace", color: ST.colors.textSecondary }}>{p.reference || p.payment_id || "—"}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{p.method || "—"}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" fontWeight={800} sx={{ color: ST.colors.success }}>
                        + {Number(p["amount_(kes)"] || p.amount || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {payments.length > 8 && (
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => router.push("/student/financials")}
                sx={{ mt: 1.5, textTransform: "none", fontWeight: 600, color: BRAND.teal, fontSize: 12 }}>
                View all {payments.length} payments
              </Button>
            )}
          </>
        )}
      </Box>
    </Stack>
  );
}

/* ── Main page ── */
export default function StudentProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activityTab, setActivityTab] = useState(0);

  useEffect(() => {
    Promise.all([
      apiFetch("/auth/me"),
      apiFetch("/sis-lms/my-profile"),
      apiFetch("/student-journey/my-journey-excel").catch(() => null),
    ])
      .then(([u, p, j]) => { setUser(u); setProfile(p); setJourney(j); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress sx={{ color: BRAND.teal }} /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const s = profile?.student ?? {};
  const stats = profile?.statistics ?? {};
  const grades = profile?.grades ?? [];
  const enrollments = profile?.enrollments ?? [];
  const attendance = profile?.attendance ?? [];
  const feeRecords = profile?.fee_records ?? [];
  const payments = profile?.payments ?? [];
  const scholarshipApps = profile?.scholarship_apps ?? [];

  const level = inferStudentLevel(s);
  const tier = inferDegreeTier(s);
  const isPostgrad = level === "postgraduate";
  const pg = journey?.pg_research;

  const creditedScholarships = scholarshipApps.filter(
    (a) => a.award_stage === "credited" || String(a.status || "").toLowerCase() === "awarded"
  );

  return (
    <Box>
      {/* Hero */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, background: `linear-gradient(135deg, ${BRAND.navy} 0%, #1e3a5f 100%)` }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap" }}>
          <Avatar sx={{ width: 68, height: 68, fontSize: 26, fontWeight: 800, bgcolor: BRAND.teal }}>
            {user?.full_name?.charAt(0) || "?"}
          </Avatar>
          <Box sx={{ flex: 1, color: "white" }}>
            <Typography variant="h5" fontWeight={800}>{user?.full_name}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.25 }}>{user?.email}</Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
              <Chip size="small" label={s.student_id} sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 600 }} />
              <Chip size="small" label={isPostgrad ? (tier === "phd" ? "PhD" : "Postgraduate") : "Undergraduate"} sx={{ bgcolor: "rgba(0,164,175,0.35)", color: "white", fontWeight: 700 }} />
              <Chip size="small" label={s.status || "Active"} sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "white" }} />
            </Box>
          </Box>
          {/* Quick stats */}
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {[
              { label: "GPA", value: stats.gpa?.toFixed?.(2) ?? "—" },
              { label: "Credits", value: stats.total_credits_completed ?? "—" },
              { label: "Attendance", value: `${stats.attendance_rate ?? 0}%` },
              { label: "Courses done", value: stats.total_courses_completed ?? "—" },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", display: "block" }}>{label}</Typography>
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: "white", lineHeight: 1.2 }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Profile cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%" }}>
            <SectionLabel icon={SchoolIcon} label="Academic profile" />
            <Grid container spacing={2}>
              <Grid item xs={12}><Field label="Programme · Major" value={[s.program, s.major].filter(Boolean).join(" · ")} /></Grid>
              <Grid item xs={6}><Field label="Department" value={s.department} /></Grid>
              <Grid item xs={6}><Field label="Year of study" value={s.year_of_study || journey?.current_year_sem} /></Grid>
              <Grid item xs={6}><Field label="Enrolled" value={s.enrollment_date} /></Grid>
              <Grid item xs={6}><Field label="Expected graduation" value={s.expected_graduation} /></Grid>
              <Grid item xs={6}><Field label="Nationality" value={s.nationality} /></Grid>
              <Grid item xs={6}><Field label="Standing" value={journey?.academic_standing?.standing} /></Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%" }}>
            <SectionLabel icon={TrendingUpIcon} label={isPostgrad ? "Research profile" : "Journey & finances"} />
            {isPostgrad ? (
              <Grid container spacing={2}>
                <Grid item xs={12}><Field label="Dissertation" value={pg?.dissertation_title || s.dissertation_title} /></Grid>
                <Grid item xs={6}><Field label="Supervisor" value={pg?.supervisor} /></Grid>
                <Grid item xs={6}><Field label="Research area" value={pg?.research_area} /></Grid>
                <Grid item xs={6}><Field label="Proposal" value={pg?.proposal_status || journey?.research_thesis?.proposal_status} /></Grid>
                <Grid item xs={6}><Field label="Journey stage" value={journey?.journey_stage} /></Grid>
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12}><Field label="Journey stage" value={journey?.journey_stage || s.journey_stage} /></Grid>
                <Grid item xs={6}>
                  <Field label="Balance due" value={
                    (stats.net_balance_due ?? 0) > 0
                      ? `KES ${(stats.net_balance_due).toLocaleString()} outstanding`
                      : "Cleared"
                  } />
                </Grid>
                <Grid item xs={6}><Field label="Total paid" value={`KES ${(stats.total_paid ?? 0).toLocaleString()}`} /></Grid>
                <Grid item xs={6}><Field label="Scholarships" value={`KES ${(stats.total_scholarships ?? 0).toLocaleString()}`} /></Grid>
                <Grid item xs={6}><Field label="Total fees" value={`KES ${(stats.total_fees ?? 0).toLocaleString()}`} /></Grid>
                {creditedScholarships.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Scholarships awarded</Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5, gap: 0.5 }}>
                      {creditedScholarships.map((a, i) => (
                        <Chip key={i} size="small" icon={<EmojiEventsIcon sx={{ fontSize: "12px !important" }} />}
                          label={a.scholarship_name || a.schol_id}
                          sx={{ height: 20, fontSize: 10, fontWeight: 600, bgcolor: ST.colors.successLight, color: ST.colors.success }} />
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Activity history */}
      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2.5 }}>
        <Box sx={{ borderBottom: `1px solid ${ST.colors.border}`, px: 1 }}>
          <Tabs value={activityTab} onChange={(_, v) => setActivityTab(v)} sx={{
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 48, fontSize: 13 },
            "& .MuiTabs-indicator": { bgcolor: BRAND.teal, height: 3, borderRadius: "3px 3px 0 0" },
          }}>
            <Tab label={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <SchoolIcon sx={{ fontSize: 16 }} />
                <span>Academic history</span>
                <Box component="span" sx={{ bgcolor: activityTab === 0 ? BRAND.teal : ST.colors.bg, color: activityTab === 0 ? "white" : ST.colors.textSecondary, px: 0.75, borderRadius: 1, fontSize: 11, fontWeight: 700 }}>
                  {Math.max(grades.length, enrollments.length)}
                </Box>
              </Stack>
            } />
            <Tab label={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <AccountBalanceWalletIcon sx={{ fontSize: 16 }} />
                <span>Financial activity</span>
                <Box component="span" sx={{ bgcolor: activityTab === 1 ? BRAND.teal : ST.colors.bg, color: activityTab === 1 ? "white" : ST.colors.textSecondary, px: 0.75, borderRadius: 1, fontSize: 11, fontWeight: 700 }}>
                  {payments.length + scholarshipApps.length}
                </Box>
              </Stack>
            } />
          </Tabs>
        </Box>
        <Box sx={{ p: 3 }}>
          {activityTab === 0 && <AcademicHistory grades={grades} enrollments={enrollments} attendance={attendance} />}
          {activityTab === 1 && <FinancialActivity feeRecords={feeRecords} payments={payments} scholarshipApps={scholarshipApps} stats={stats} router={router} />}
        </Box>
      </Paper>
    </Box>
  );
}
