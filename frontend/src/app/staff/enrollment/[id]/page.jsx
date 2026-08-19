"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import SchoolIcon from "@mui/icons-material/School";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DevicesIcon from "@mui/icons-material/Devices";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import FolderIcon from "@mui/icons-material/Folder";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";

const mockDb = {
  1: { id: 1, student_number: "STU001", full_name: "Alice Kamau", email: "alice.kamau@uni.edu", phone: "+254 712 001 001", program: "Computer Science", cohort: "2021", status: "active", compliance_status: "green", gpa: 3.82, credits_completed: 95, credits_required: 120, enrollment_date: "2021-09-01", expected_graduation: "2025-06-30", address: "14 Ngong Road, Nairobi", date_of_birth: "2002-03-12", lms_learning_path: "Software Engineering Track", lms_courses_enrolled: 6, lms_courses_completed: 22, lms_last_active: "2024-04-08", lms_avg_score: 84, sis_status: "Enrolled", nationality: "Kenyan", guardian: "Mary Kamau", guardian_phone: "+254 722 100 001" },
  2: { id: 2, student_number: "STU002", full_name: "Brian Otieno", email: "b.otieno@uni.edu", phone: "+254 712 001 002", program: "Business Administration", cohort: "2021", status: "active", compliance_status: "yellow", gpa: 3.15, credits_completed: 88, credits_required: 120, enrollment_date: "2021-09-01", expected_graduation: "2025-06-30", address: "7 Tom Mboya St, Kisumu", date_of_birth: "2001-08-25", lms_learning_path: "Business Analytics Track", lms_courses_enrolled: 5, lms_courses_completed: 18, lms_last_active: "2024-04-07", lms_avg_score: 71, sis_status: "Enrolled", nationality: "Kenyan", guardian: "Peter Otieno", guardian_phone: "+254 722 100 002" },
  3: { id: 3, student_number: "STU003", full_name: "Carol Wanjiku", email: "c.wanjiku@uni.edu", phone: "+254 712 001 003", program: "Engineering", cohort: "2020", status: "active", compliance_status: "green", gpa: 3.65, credits_completed: 115, credits_required: 140, enrollment_date: "2020-09-01", expected_graduation: "2024-06-30", address: "21 Kenyatta Ave, Mombasa", date_of_birth: "2001-01-18", lms_learning_path: "Civil Engineering Track", lms_courses_enrolled: 7, lms_courses_completed: 30, lms_last_active: "2024-04-09", lms_avg_score: 79, sis_status: "Enrolled", nationality: "Kenyan", guardian: "John Wanjiku", guardian_phone: "+254 722 100 003" },
};

const courseMock = [
  { code: "CS301", name: "Data Structures", semester: "Sem 1, 2023", grade: "A", credits: 4, gpa_points: 4.0 },
  { code: "CS302", name: "Algorithms", semester: "Sem 1, 2023", grade: "A-", credits: 4, gpa_points: 3.7 },
  { code: "CS401", name: "Machine Learning", semester: "Sem 2, 2023", grade: "B+", credits: 3, gpa_points: 3.3 },
  { code: "CS410", name: "Software Engineering", semester: "Sem 2, 2023", grade: "A", credits: 4, gpa_points: 4.0 },
  { code: "MATH301", name: "Linear Algebra", semester: "Sem 1, 2022", grade: "B+", credits: 3, gpa_points: 3.3 },
  { code: "CS205", name: "Operating Systems", semester: "Sem 1, 2022", grade: "A-", credits: 4, gpa_points: 3.7 },
];

const scholarshipMock = [
  { name: "Merit Excellence Award", amount: "KES 45,000", period: "2023/2024", status: "active", type: "Merit-based" },
  { name: "STEM Innovation Grant", amount: "KES 30,000", period: "2022/2023", status: "completed", type: "Government" },
];

const ticketMock = [
  { id: "TKT-0042", subject: "Transcript Request", status: "resolved", priority: "medium", created: "2024-03-15", assigned: "Dr. Odhiambo" },
  { id: "TKT-0028", subject: "Course Registration Issue", status: "resolved", priority: "high", created: "2024-02-01", assigned: "Registrar Office" },
];

const documentMock = [
  { name: "Admission Letter", type: "PDF", size: "245 KB", date: "2021-09-01" },
  { name: "Transcript — Sem 1 2023", type: "PDF", size: "180 KB", date: "2024-02-10" },
  { name: "ID Verification", type: "Image", size: "512 KB", date: "2021-08-20" },
];

const InfoRow = ({ icon, label, value }) => (
  <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", mb: 1.5 }}>
    <Box sx={{ color: ST.colors.textSecondary, mt: 0.2, flexShrink: 0 }}>{icon}</Box>
    <Box>
      <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", lineHeight: 1.2 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={500} sx={{ color: ST.colors.textPrimary }}>{value}</Typography>
    </Box>
  </Box>
);

const StatMini = ({ label, value, sub, color }) => (
  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2, textAlign: "center" }}>
    <Typography variant="h4" fontWeight={800} sx={{ color: color || ST.colors.primary, lineHeight: 1.1 }}>{value}</Typography>
    <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", mt: 0.25 }}>{label}</Typography>
    {sub && <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontSize: 10 }}>{sub}</Typography>}
  </Paper>
);

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/sis-lms/students/${params.id}`);
        // API returns nested structure with student, payments, scholarship_apps, statistics
        setStudent({
          ...data.student,
          payments: data.payments,
          scholarship_apps: data.scholarship_apps,
          fee_records: data.fee_records,
          statistics: data.statistics
        });
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to load student");
        setLoading(false);
      }
    };
    if (params.id) {
      fetchStudent();
    }
  }, [params.id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!student) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Student not found.</Alert>
      </Box>
    );
  }

  const creditsCompleted = student.credit_hours || student.credits_completed || 0;
  const creditsRequired = student.credits_required || 120;
  const creditPct = Math.min(100, (creditsCompleted / creditsRequired) * 100);
  
  const lmsCompleted = student.lms_courses_completed || 0;
  const lmsEnrolled = student.lms_courses_enrolled || 0;
  const lmsPct = (lmsCompleted + lmsEnrolled) > 0 ? (lmsCompleted / (lmsCompleted + lmsEnrolled)) * 100 : 0;
  
  const avatarColor = [ST.chart.blue, ST.chart.teal, ST.chart.purple, ST.chart.orange][Math.abs(parseInt(student.id || 0)) % 4];
  const compMap = { green: { label: "On Track", bg: ST.colors.successLight, color: ST.colors.success }, yellow: { label: "At Risk", bg: ST.colors.warningLight, color: ST.colors.warning }, red: { label: "Critical", bg: ST.colors.errorLight, color: ST.colors.error } };
  const statusMap = { active: { label: "Active", bg: ST.colors.successLight, color: ST.colors.success }, on_leave: { label: "On Leave", bg: ST.colors.warningLight, color: ST.colors.warning }, graduated: { label: "Graduated", bg: ST.colors.infoLight, color: ST.colors.info } };
  const comp = compMap[student.compliance_status] || compMap.green;
  const stat = statusMap[student.status] || statusMap.active;

  const headSx = { fontWeight: 600, fontSize: 12, color: ST.colors.textSecondary, bgcolor: ST.colors.bg, borderBottom: `1px solid ${ST.colors.border}` };

  return (
    <Box>
      {/* Breadcrumb / Back */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
        <Button onClick={() => router.push("/staff/students")} startIcon={<ArrowBackIcon />} size="small"
          sx={{ textTransform: "none", color: ST.colors.textSecondary, fontWeight: 500, "&:hover": { bgcolor: ST.colors.bg } }}>
          Enrollment
        </Button>
        <Typography sx={{ color: ST.colors.textSecondary, fontSize: 14 }}>›</Typography>
        <Typography sx={{ fontSize: 14, color: ST.colors.textPrimary, fontWeight: 500 }}>{student.full_name}</Typography>
      </Box>

      {/* Hero Card */}
      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden", mb: 2.5 }}>
        {/* Blue header stripe */}
        <Box sx={{ bgcolor: ST.colors.primary, height: 80, position: "relative" }} />
        <Box sx={{ px: 3, pb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mt: -5, mb: 2 }}>
            <Avatar sx={{ width: 80, height: 80, fontSize: 28, fontWeight: 700, bgcolor: avatarColor, border: "4px solid white", boxShadow: 2 }}>
              {student.full_name?.charAt(0) || "?"}
            </Avatar>
            <Box sx={{ display: "flex", gap: 1, pb: 0.5 }}>
              <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => router.push(`/staff/enrollment/${student.id}/edit`)}
                sx={{ textTransform: "none", borderRadius: 1.5, borderColor: ST.colors.border, color: ST.colors.textPrimary, fontWeight: 500 }}>
                Edit Record
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary, lineHeight: 1.2 }}>
                {student.full_name}
              </Typography>
              <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.25 }}>
                {student.student_id || student.student_number || "N/A"} · {student.program || "N/A"} · {student.major || "N/A"}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                <Chip label={stat.label} size="small" sx={{ bgcolor: stat.bg, color: stat.color, fontWeight: 600, fontSize: 11, height: 22 }} />
                <Chip label={comp.label} size="small" sx={{ bgcolor: comp.bg, color: comp.color, fontWeight: 600, fontSize: 11, height: 22 }} />
                {student.year_of_study && <Chip label={`Year ${student.year_of_study}`} size="small" sx={{ bgcolor: ST.colors.primaryLight, color: ST.colors.primary, fontWeight: 600, fontSize: 11, height: 22 }} />}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={4}>
            {/* SIS Info */}
            <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: ST.colors.primary, textTransform: "uppercase", letterSpacing: 0.8, display: "block", mb: 1.5 }}>
                Student Information System (SIS)
              </Typography>
              <InfoRow icon={<EmailIcon sx={{ fontSize: 18 }} />} label="Institutional Email" value={student.email || "N/A"} />
              <InfoRow icon={<PhoneIcon sx={{ fontSize: 18 }} />} label="Phone" value={student.phone_number || student.phone || "N/A"} />
              <InfoRow icon={<SchoolIcon sx={{ fontSize: 18 }} />} label="Programme & Major" value={`${student.program || "N/A"} - ${student.major || "N/A"}`} />
              <InfoRow icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />} label="Enrollment Date" value={student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "N/A"} />
              <InfoRow icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />} label="Date of Birth" value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "N/A"} />
              <InfoRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />} label="Nationality & Gender" value={`${student.nationality || "N/A"} · ${student.gender || "N/A"}`} />
            </Grid>

            {/* LMS Info */}
            <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: ST.chart.teal, textTransform: "uppercase", letterSpacing: 0.8, display: "block", mb: 1.5 }}>
                Learning Management System (LMS)
              </Typography>
              <InfoRow icon={<SchoolIcon sx={{ fontSize: 18 }} />} label="Year of Study" value={student.year_of_study ? `Year ${student.year_of_study}` : "N/A"} />
              <InfoRow icon={<AssignmentIcon sx={{ fontSize: 18 }} />} label="Credit Hours" value={`${creditsCompleted} / ${creditsRequired}`} />
              <InfoRow icon={<TrendingUpIcon sx={{ fontSize: 18 }} />} label="GPA" value={student.gpa ? student.gpa.toFixed(2) : "N/A"} />
              <InfoRow icon={<MenuBookIcon sx={{ fontSize: 18 }} />} label="Status" value={student.status || "N/A"} />
              <InfoRow icon={<DevicesIcon sx={{ fontSize: 18 }} />} label="Attendance" value={student.avg_attendance ? `${student.avg_attendance}%` : "N/A"} />
              <InfoRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />} label="Address" value={student.address || "N/A"} />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={6} md={3}>
          <StatMini label="GPA" value={student.gpa ? student.gpa.toFixed(2) : "N/A"} sub="out of 4.0" color={(student.gpa || 0) >= 3.5 ? ST.colors.success : (student.gpa || 0) >= 3.0 ? ST.colors.warning : ST.colors.error} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper elevation={0} sx={{ p: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Credit Progress</Typography>
              <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.primary }}>{creditPct.toFixed(0)}%</Typography>
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: ST.colors.textPrimary }}>{creditsCompleted}<Typography component="span" variant="caption" sx={{ color: ST.colors.textSecondary }}> / {creditsRequired}</Typography></Typography>
            <LinearProgress variant="determinate" value={creditPct} sx={{ height: 6, borderRadius: 3, mt: 1, bgcolor: ST.colors.primaryLight, "& .MuiLinearProgress-bar": { bgcolor: ST.colors.primary } }} />
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper elevation={0} sx={{ p: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Attendance</Typography>
              <Typography variant="caption" fontWeight={700} sx={{ color: ST.chart.teal }}>{student.avg_attendance ? `${student.avg_attendance}%` : "N/A"}</Typography>
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: ST.colors.textPrimary }}>{student.avg_attendance ? student.avg_attendance.toFixed(1) : "N/A"}<Typography component="span" variant="caption" sx={{ color: ST.colors.textSecondary }}>%</Typography></Typography>
            <LinearProgress variant="determinate" value={lmsPct} sx={{ height: 6, borderRadius: 3, mt: 1, bgcolor: "#CCFBF1", "& .MuiLinearProgress-bar": { bgcolor: ST.chart.teal } }} />
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <StatMini label="Year of Study" value={student.year_of_study || "N/A"} sub={`${student.program || "N/A"}`} color={ST.colors.info} />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ px: 2, borderBottom: `1px solid ${ST.colors.border}`, "& .MuiTab-root": { textTransform: "none", fontWeight: 500, fontSize: 14, minHeight: 48 }, "& .Mui-selected": { fontWeight: 700, color: ST.colors.primary }, "& .MuiTabs-indicator": { bgcolor: ST.colors.primary } }}>
          <Tab label="Academic History" icon={<AssignmentIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label="Financial" icon={<AttachMoneyIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label="Scholarships" icon={<AttachMoneyIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label="Documents" icon={<FolderIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Academic History */}
          {tab === 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Course Code", "Course Name", "Semester", "Credits", "Grade", "Grade Points"].map((h) => (
                      <TableCell key={h} sx={headSx}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courseMock.map((c) => (
                    <TableRow key={c.code} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell sx={{ fontSize: 13, fontFamily: "monospace", color: ST.colors.primary }}>{c.code}</TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{c.name}</TableCell>
                      <TableCell sx={{ fontSize: 13, color: ST.colors.textSecondary }}>{c.semester}</TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{c.credits}</TableCell>
                      <TableCell>
                        <Chip label={c.grade} size="small" sx={{ fontWeight: 700, fontSize: 12, bgcolor: c.gpa_points >= 3.7 ? ST.colors.successLight : c.gpa_points >= 3.0 ? ST.colors.warningLight : ST.colors.errorLight, color: c.gpa_points >= 3.7 ? ST.colors.success : c.gpa_points >= 3.0 ? ST.colors.warning : ST.colors.error }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{c.gpa_points.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Financial */}
          {tab === 1 && (
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: ST.colors.textPrimary }}>Fee Records & Payments</Typography>
              
              {/* Financial Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2, textAlign: "center" }}>
                    <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Total Fees</Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: ST.colors.textPrimary }}>
                      KES {(student.statistics?.total_fees || 0).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2, textAlign: "center" }}>
                    <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Total Paid</Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: ST.colors.success }}>
                      KES {(student.statistics?.total_paid || 0).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2, textAlign: "center" }}>
                    <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Balance Due</Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: ST.colors.error }}>
                      KES {(student.statistics?.balance_due || 0).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2, textAlign: "center" }}>
                    <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Scholarships</Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: ST.colors.info }}>
                      KES {(student.statistics?.total_scholarships || 0).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Payments Table */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: ST.colors.textPrimary }}>Payment History</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["Payment ID", "Date", "Amount", "Method", "Reference", "Status"].map((h) => (
                        <TableCell key={h} sx={headSx}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(student.payments || []).map((p, i) => (
                      <TableRow key={i} hover sx={{ "&:last-child td": { border: 0 } }}>
                        <TableCell sx={{ fontSize: 12, fontFamily: "monospace", color: ST.colors.primary }}>{p.payment_id || "N/A"}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{p.date ? new Date(p.date).toLocaleDateString() : "N/A"}</TableCell>
                        <TableCell sx={{ fontSize: 13, fontWeight: 700, color: ST.colors.success }}>KES {(p["amount_(kes)"] || 0).toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{p.method || "N/A"}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>{p.reference || "N/A"}</TableCell>
                        <TableCell>
                          <Chip label={p.status || "N/A"} size="small" sx={{ fontSize: 11, fontWeight: 600, bgcolor: ST.colors.successLight, color: ST.colors.success }} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!student.payments || student.payments.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: ST.colors.textSecondary }}>
                          No payment records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Scholarships */}
          {tab === 2 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Application ID", "Scholarship Name", "Applied Date", "GPA", "Status"].map((h) => (
                      <TableCell key={h} sx={headSx}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(student.scholarship_apps || []).map((app, i) => (
                    <TableRow key={i} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell sx={{ fontSize: 12, fontFamily: "monospace", color: ST.colors.primary }}>{app.app_id || "N/A"}</TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{app.scholarship_details?.scholarship_name || app.scholarship_name || "N/A"}</TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{app.applied_date ? new Date(app.applied_date).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{app.gpa || "N/A"}</TableCell>
                      <TableCell>
                        <Chip 
                          label={app.status || "N/A"} 
                          size="small" 
                          sx={{ 
                            fontSize: 11, 
                            fontWeight: 600, 
                            bgcolor: app.status?.toLowerCase() === "approved" ? ST.colors.successLight : 
                                     app.status?.toLowerCase() === "rejected" ? ST.colors.errorLight : 
                                     app.status?.toLowerCase() === "under review" ? ST.colors.warningLight : ST.colors.infoLight,
                            color: app.status?.toLowerCase() === "approved" ? ST.colors.success : 
                                   app.status?.toLowerCase() === "rejected" ? ST.colors.error : 
                                   app.status?.toLowerCase() === "under review" ? ST.colors.warning : ST.colors.info
                          }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!student.scholarship_apps || student.scholarship_apps.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: ST.colors.textSecondary }}>
                        No scholarship applications found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Documents */}
          {tab === 3 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Ticket ID", "Subject", "Priority", "Status", "Assigned To", "Created"].map((h) => (
                      <TableCell key={h} sx={headSx}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ticketMock.map((t) => (
                    <TableRow key={t.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell sx={{ fontSize: 12, fontFamily: "monospace", color: ST.colors.primary }}>{t.id}</TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{t.subject}</TableCell>
                      <TableCell>
                        <Chip label={t.priority} size="small" sx={{ fontSize: 10, fontWeight: 600, height: 20, bgcolor: t.priority === "high" ? ST.colors.errorLight : t.priority === "medium" ? ST.colors.warningLight : ST.colors.infoLight, color: t.priority === "high" ? ST.colors.error : t.priority === "medium" ? ST.colors.warning : ST.colors.info }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={t.status} size="small" sx={{ fontSize: 10, fontWeight: 600, height: 20, bgcolor: t.status === "resolved" ? ST.colors.successLight : ST.colors.primaryLight, color: t.status === "resolved" ? ST.colors.success : ST.colors.primary }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, color: ST.colors.textSecondary }}>{t.assigned}</TableCell>
                      <TableCell sx={{ fontSize: 13, color: ST.colors.textSecondary }}>{new Date(t.created).toLocaleDateString("en-GB")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Documents */}
          {tab === 3 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {documentMock.map((d, i) => (
                <Paper key={i} elevation={0} sx={{ p: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 1.5, display: "flex", alignItems: "center", gap: 2, "&:hover": { borderColor: ST.colors.primary } }}>
                  <Box sx={{ bgcolor: ST.colors.primaryLight, p: 1, borderRadius: 1, display: "flex" }}>
                    <FolderIcon sx={{ color: ST.colors.primary, fontSize: 22 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary }}>{d.name}</Typography>
                    <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{d.type} · {d.size} · {d.date}</Typography>
                  </Box>
                  <Button size="small" variant="outlined" sx={{ textTransform: "none", borderRadius: 1.5, borderColor: ST.colors.border, color: ST.colors.textPrimary, fontSize: 12 }}>
                    Download
                  </Button>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
