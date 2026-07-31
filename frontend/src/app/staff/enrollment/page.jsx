"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Checkbox from "@mui/material/Checkbox";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import ButtonGroup from "@mui/material/ButtonGroup";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import ApiIcon from "@mui/icons-material/Api";
import TableChartIcon from "@mui/icons-material/TableChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";

// SIS + LMS mock data for API import (10 students)
const sisLmsMockStudents = [
  { id: 1, student_number: "SIS2021001", full_name: "Alice Kamau", email: "alice.kamau@uni.edu", phone: "+254 712 001 001", program: "Computer Science", cohort: "2021", enrollment_date: "2021-09-01", expected_graduation: "2025-06-30", gpa: 3.82, credits_completed: 95, status: "active", sis_status: "Enrolled", lms_courses_enrolled: 6, lms_courses_completed: 22, lms_last_active: "2024-04-08", lms_avg_score: 84, lms_learning_path: "Software Engineering Track" },
  { id: 2, student_number: "SIS2021002", full_name: "Brian Otieno", email: "b.otieno@uni.edu", phone: "+254 712 001 002", program: "Business Administration", cohort: "2021", enrollment_date: "2021-09-01", expected_graduation: "2025-06-30", gpa: 3.15, credits_completed: 88, status: "active", sis_status: "Enrolled", lms_courses_enrolled: 5, lms_courses_completed: 18, lms_last_active: "2024-04-07", lms_avg_score: 71, lms_learning_path: "Business Analytics Track" },
  { id: 3, student_number: "SIS2020001", full_name: "Carol Wanjiku", email: "c.wanjiku@uni.edu", phone: "+254 712 001 003", program: "Engineering", cohort: "2020", enrollment_date: "2020-09-01", expected_graduation: "2024-06-30", gpa: 3.65, credits_completed: 115, status: "active", sis_status: "Enrolled", lms_courses_enrolled: 7, lms_courses_completed: 30, lms_last_active: "2024-04-09", lms_avg_score: 79, lms_learning_path: "Civil Engineering Track" },
  { id: 4, student_number: "SIS2020002", full_name: "David Mwangi", email: "d.mwangi@uni.edu", phone: "+254 712 001 004", program: "Medicine", cohort: "2020", enrollment_date: "2020-09-01", expected_graduation: "2026-06-30", gpa: 3.90, credits_completed: 120, status: "active", sis_status: "Enrolled", lms_courses_enrolled: 8, lms_courses_completed: 35, lms_last_active: "2024-04-08", lms_avg_score: 91, lms_learning_path: "Clinical Medicine Track" },
  { id: 5, student_number: "SIS2022001", full_name: "Eva Njeri", email: "e.njeri@uni.edu", phone: "+254 712 001 005", program: "Computer Science", cohort: "2022", enrollment_date: "2022-09-01", expected_graduation: "2026-06-30", gpa: 3.92, credits_completed: 65, status: "active", sis_status: "Enrolled", lms_courses_enrolled: 4, lms_courses_completed: 12, lms_last_active: "2024-04-09", lms_avg_score: 93, lms_learning_path: "AI & Machine Learning Track" },
  { id: 6, student_number: "SIS2019001", full_name: "Frank Kipchoge", email: "f.kipchoge@uni.edu", phone: "+254 712 001 006", program: "Law", cohort: "2019", enrollment_date: "2019-09-01", expected_graduation: "2024-06-30", gpa: 2.95, credits_completed: 140, status: "active", sis_status: "At Risk", lms_courses_enrolled: 5, lms_courses_completed: 38, lms_last_active: "2024-03-30", lms_avg_score: 62, lms_learning_path: "Corporate Law Track" },
  { id: 7, student_number: "SIS2021003", full_name: "Grace Achieng", email: "g.achieng@uni.edu", phone: "+254 712 001 007", program: "Education", cohort: "2021", enrollment_date: "2021-09-01", expected_graduation: "2025-06-30", gpa: 3.45, credits_completed: 90, status: "active", sis_status: "Enrolled", lms_courses_enrolled: 6, lms_courses_completed: 20, lms_last_active: "2024-04-06", lms_avg_score: 76, lms_learning_path: "Early Childhood Education" },
  { id: 8, student_number: "SIS2022002", full_name: "Henry Omondi", email: "h.omondi@uni.edu", phone: "+254 712 001 008", program: "Engineering", cohort: "2022", enrollment_date: "2022-09-01", expected_graduation: "2026-06-30", gpa: 3.28, credits_completed: 60, status: "active", sis_status: "Enrolled", lms_courses_enrolled: 4, lms_courses_completed: 10, lms_last_active: "2024-04-05", lms_avg_score: 69, lms_learning_path: "Electrical Engineering Track" },
  { id: 9, student_number: "SIS2020003", full_name: "Irene Chepkoech", email: "i.chepkoech@uni.edu", phone: "+254 712 001 009", program: "Business Administration", cohort: "2020", enrollment_date: "2020-09-01", expected_graduation: "2024-06-30", gpa: 2.80, credits_completed: 108, status: "on_leave", sis_status: "On Leave", lms_courses_enrolled: 0, lms_courses_completed: 24, lms_last_active: "2024-01-15", lms_avg_score: 58, lms_learning_path: "Finance Track" },
  { id: 10, student_number: "SIS2021004", full_name: "James Kariuki", email: "j.kariuki@uni.edu", phone: "+254 712 001 010", program: "Medicine", cohort: "2021", enrollment_date: "2021-09-01", expected_graduation: "2027-06-30", gpa: 3.70, credits_completed: 85, status: "active", sis_status: "Enrolled", lms_courses_enrolled: 7, lms_courses_completed: 19, lms_last_active: "2024-04-09", lms_avg_score: 82, lms_learning_path: "Surgery Track" },
];

const mockStudents = [
  { id: 1, student_number: "STU001", full_name: "Alice Kamau", email: "alice.kamau@uni.edu", program: "Computer Science", cohort: "2021", status: "active", compliance_status: "green", gpa: 3.82, credits_completed: 95 },
  { id: 2, student_number: "STU002", full_name: "Brian Otieno", email: "b.otieno@uni.edu", program: "Business Administration", cohort: "2021", status: "active", compliance_status: "yellow", gpa: 3.15, credits_completed: 88 },
  { id: 3, student_number: "STU003", full_name: "Carol Wanjiku", email: "c.wanjiku@uni.edu", program: "Engineering", cohort: "2020", status: "active", compliance_status: "green", gpa: 3.65, credits_completed: 115 },
  { id: 4, student_number: "STU004", full_name: "David Mwangi", email: "d.mwangi@uni.edu", program: "Medicine", cohort: "2020", status: "active", compliance_status: "green", gpa: 3.90, credits_completed: 120 },
  { id: 5, student_number: "STU005", full_name: "Eva Njeri", email: "e.njeri@uni.edu", program: "Computer Science", cohort: "2022", status: "active", compliance_status: "green", gpa: 3.92, credits_completed: 65 },
  { id: 6, student_number: "STU006", full_name: "Frank Kipchoge", email: "f.kipchoge@uni.edu", program: "Law", cohort: "2019", status: "active", compliance_status: "red", gpa: 2.95, credits_completed: 140 },
  { id: 7, student_number: "STU007", full_name: "Grace Achieng", email: "g.achieng@uni.edu", program: "Education", cohort: "2021", status: "active", compliance_status: "green", gpa: 3.45, credits_completed: 90 },
  { id: 8, student_number: "STU008", full_name: "Henry Omondi", email: "h.omondi@uni.edu", program: "Engineering", cohort: "2022", status: "active", compliance_status: "yellow", gpa: 3.28, credits_completed: 60 },
  { id: 9, student_number: "STU009", full_name: "Irene Chepkoech", email: "i.chepkoech@uni.edu", program: "Business Administration", cohort: "2020", status: "on_leave", compliance_status: "red", gpa: 2.80, credits_completed: 108 },
  { id: 10, student_number: "STU010", full_name: "James Kariuki", email: "j.kariuki@uni.edu", program: "Medicine", cohort: "2021", status: "active", compliance_status: "green", gpa: 3.70, credits_completed: 85 },
];

const StatusChip = ({ status }) => {
  const map = { 
    active: { label: "Active", bg: ST.colors.successLight, color: ST.colors.success, dotColor: ST.colors.success }, 
    on_leave: { label: "On Leave", bg: ST.colors.warningLight, color: ST.colors.warning, dotColor: ST.colors.warning }, 
    graduated: { label: "Graduated", bg: ST.colors.infoLight, color: ST.colors.info, dotColor: ST.colors.info }, 
    withdrawn: { label: "Withdrawn", bg: ST.colors.errorLight, color: ST.colors.error, dotColor: ST.colors.error }, 
    suspended: { label: "Suspended", bg: ST.colors.errorLight, color: ST.colors.error, dotColor: ST.colors.error } 
  };
  const s = map[status] || { label: status, bg: "#f3f4f6", color: "#6b7280", dotColor: "#6b7280" };
  return (
    <Chip 
      icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: s.dotColor, ml: 1 }} />}
      label={s.label} 
      size="small" 
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 600, fontSize: 11, height: 22, border: "none", "& .MuiChip-icon": { ml: 1, mr: -0.5 } }} 
    />
  );
};

const ComplianceChip = ({ status }) => {
  const map = { 
    green: { label: "On Track", bg: ST.colors.successLight, color: ST.colors.success, dotColor: ST.colors.success }, 
    yellow: { label: "At Risk", bg: ST.colors.warningLight, color: ST.colors.warning, dotColor: ST.colors.warning }, 
    red: { label: "Critical", bg: ST.colors.errorLight, color: ST.colors.error, dotColor: ST.colors.error } 
  };
  const s = map[status] || { label: status, bg: "#f3f4f6", color: "#6b7280", dotColor: "#6b7280" };
  return (
    <Chip 
      icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: s.dotColor, ml: 1 }} />}
      label={s.label} 
      size="small" 
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 600, fontSize: 11, height: 22, border: "none", "& .MuiChip-icon": { ml: 1, mr: -0.5 } }} 
    />
  );
};

const COHORT_LABELS = {
  undergraduate: { title: "Undergraduate Students", subtitle: "Bachelor and diploma cohorts" },
  postgraduate: { title: "Postgraduate Students", subtitle: "Masters, PhD, and research programmes" },
};

function EnrollmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cohortFilter = searchParams.get("cohort");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [rowMenuAnchor, setRowMenuAnchor] = useState(null);
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ limit: "500" });
        if (cohortFilter) params.set("cohort_level", cohortFilter);
        const data = await apiFetch(`/sis-lms/students?${params.toString()}`);
        setStudents(data.students || []);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to load students");
        setLoading(false);
      }
    };
    fetchStudents();
  }, [cohortFilter]);

  // Excel import state
  const [excelOpen, setExcelOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelImporting, setExcelImporting] = useState(false);
  const [excelDone, setExcelDone] = useState(false);

  // API import state
  const [apiOpen, setApiOpen] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiStudents, setApiStudents] = useState([]);
  const [selectedApiIds, setSelectedApiIds] = useState([]);
  const [apiImporting, setApiImporting] = useState(false);
  const [apiDone, setApiDone] = useState(false);

  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      String(s.full_name || "").toLowerCase().includes(q) ||
      String(s.email || "").toLowerCase().includes(q) ||
      String(s.student_id || s.student_number || "").toLowerCase().includes(q)
    );
  });

  const pageMeta = COHORT_LABELS[cohortFilter] || {
    title: "All Students",
    subtitle: "Complete enrollment registry from SIS and LMS",
  };

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const downloadTemplate = () => {
    const headers = ["student_number", "full_name", "email", "phone", "program", "cohort", "enrollment_date", "expected_graduation", "gpa", "credits_completed", "status"];
    const sample = ["STU001", "John Doe", "john@university.edu", "+1 555 000 001", "Computer Science", "2021", "2021-09-01", "2025-06-30", "3.75", "90", "active"];
    const csv = [headers.join(","), sample.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "student_import_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExcelImport = () => {
    setExcelImporting(true);
    setTimeout(() => { setExcelImporting(false); setExcelDone(true); }, 2000);
  };

  const handleFetchApiStudents = () => {
    setApiLoading(true);
    setTimeout(() => { setApiStudents(sisLmsMockStudents); setApiLoading(false); }, 1200);
  };

  const toggleApiSelect = (id) => {
    setSelectedApiIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleApiImport = () => {
    setApiImporting(true);
    setTimeout(() => {
      const toAdd = apiStudents.filter((s) => selectedApiIds.includes(s.id)).map((s) => ({
        id: students.length + s.id,
        student_number: s.student_number,
        full_name: s.full_name,
        email: s.email,
        program: s.program,
        cohort: s.cohort,
        status: s.status,
        compliance_status: "green",
        gpa: s.gpa,
        credits_completed: s.credits_completed,
      }));
      setStudents((prev) => [...prev, ...toAdd]);
      setApiImporting(false);
      setApiDone(true);
    }, 1500);
  };

  const headCell = (label) => (
    <TableCell sx={{ fontWeight: 600, fontSize: 12, color: ST.colors.textSecondary, bgcolor: ST.colors.bg, borderBottom: `1px solid ${ST.colors.border}`, py: 1.5 }}>
      {label}
    </TableCell>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
            {pageMeta.title}
          </Typography>
          <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>
            {pageMeta.subtitle} · {students.length} students
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {/* Add Student split button */}
          <ButtonGroup variant="contained" disableElevation>
            <Button
              startIcon={<AddIcon />}
              onClick={() => router.push("/staff/enrollment/new")}
              sx={{ bgcolor: ST.colors.primary, "&:hover": { bgcolor: "#1e3a8a" }, textTransform: "none", fontWeight: 600 }}
            >
              Add Student
            </Button>
            <Button
              size="small"
              onClick={(e) => setAddMenuAnchor(e.currentTarget)}
              sx={{ bgcolor: ST.colors.primary, "&:hover": { bgcolor: "#1e3a8a" }, px: 0.5, minWidth: 34, borderLeft: "1px solid rgba(255,255,255,0.3) !important" }}
            >
              <ArrowDropDownIcon />
            </Button>
          </ButtonGroup>
          <Menu anchorEl={addMenuAnchor} open={Boolean(addMenuAnchor)} onClose={() => setAddMenuAnchor(null)}
            PaperProps={{ elevation: 2, sx: { borderRadius: 2, border: `1px solid ${ST.colors.border}`, minWidth: 220, mt: 0.5 } }}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="caption" fontWeight={600} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Import Options
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setAddMenuAnchor(null); setExcelOpen(true); setExcelDone(false); setExcelFile(null); }}
              sx={{ py: 1.5, gap: 1.5 }}>
              <TableChartIcon sx={{ color: ST.colors.success, fontSize: 20 }} />
              <Box>
                <Typography variant="body2" fontWeight={600}>Import from Excel</Typography>
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Upload .xlsx or .csv file</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => { setAddMenuAnchor(null); setApiOpen(true); setApiDone(false); setSelectedApiIds([]); setApiStudents([]); }}
              sx={{ py: 1.5, gap: 1.5 }}>
              <ApiIcon sx={{ color: ST.colors.primary, fontSize: 20 }} />
              <Box>
                <Typography variant="body2" fontWeight={600}>Import via API</Typography>
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Sync from SIS / LMS</Typography>
              </Box>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Search + Filter Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
        <TextField
          placeholder="Search by name, email or student ID..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          size="small"
          sx={{ flexGrow: 1, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: ST.colors.textSecondary, fontSize: 20 }} /></InputAdornment> }}
        />
        <Chip label={`${filtered.length} results`} size="small" sx={{ bgcolor: ST.colors.primaryLight, color: ST.colors.primary, fontWeight: 600 }} />
        <Button startIcon={<FilterListIcon />} size="small" variant="outlined" sx={{ borderRadius: 1.5, textTransform: "none", borderColor: ST.colors.border, color: ST.colors.textSecondary }}>
          Filter
        </Button>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {headCell("Student ID")}
                {headCell("Student")}
                {!cohortFilter && headCell("Cohort")}
                {headCell("Program")}
                {headCell("Major")}
                {headCell("Status")}
                {headCell("Compliance")}
                {headCell("GPA")}
                {headCell("Credits")}
                {headCell("Balance Due")}
                <TableCell sx={{ bgcolor: ST.colors.bg, borderBottom: `1px solid ${ST.colors.border}`, py: 1.5 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: ST.colors.textSecondary }}>
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((student, i) => (
                  <TableRow key={student.student_id || student.id} hover
                    sx={{ cursor: "pointer", "&:hover": { bgcolor: "#F8FAFF" }, "&:last-child td": { border: 0 } }}
                    onClick={() => router.push(`/staff/enrollment/${student.student_id || student.id}`)}
                  >
                    <TableCell sx={{ fontSize: 13, color: ST.colors.textSecondary }}>{student.student_id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: [ST.chart.blue, ST.chart.teal, ST.chart.purple, ST.chart.orange, ST.chart.green, ST.chart.indigo][i % 6] }}>
                          {student.full_name?.charAt(0) || "?"}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary, fontSize: 13 }}>{student.full_name}</Typography>
                          <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{student.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    {!cohortFilter && (
                      <TableCell>
                        <Chip
                          label={student.cohort_level === "postgraduate" ? "Post Grad" : "Undergrad"}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: 10,
                            bgcolor: student.cohort_level === "postgraduate" ? "#EDE9FE" : ST.colors.primaryLight,
                            color: student.cohort_level === "postgraduate" ? "#7C3AED" : ST.colors.primary,
                          }}
                        />
                      </TableCell>
                    )}
                    <TableCell sx={{ fontSize: 13, color: ST.colors.textPrimary }}>{student.program || "N/A"}</TableCell>
                    <TableCell sx={{ fontSize: 13, color: ST.colors.textPrimary }}>{student.major || "N/A"}</TableCell>
                    <TableCell><StatusChip status={student.status || "active"} /></TableCell>
                    <TableCell><ComplianceChip status={student.compliance_status || "green"} /></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ color: (student.gpa || 0) >= 3.5 ? ST.colors.success : (student.gpa || 0) >= 3.0 ? ST.colors.warning : ST.colors.error }}>
                        {student.gpa ? student.gpa.toFixed(2) : "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{student.credit_hours || student.credits_completed || 0}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ color: (student.balance_due || 0) > 0 ? ST.colors.error : ST.colors.success, fontSize: 13 }}>
                        KES {(student.balance_due || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => router.push(`/staff/enrollment/${student.student_id || student.id}`)}>
                            <VisibilityIcon sx={{ fontSize: 16, color: ST.colors.textSecondary }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More">
                          <IconButton size="small" onClick={(e) => { setRowMenuAnchor(e.currentTarget); setSelectedStudent(student); }}>
                            <MoreVertIcon sx={{ fontSize: 16, color: ST.colors.textSecondary }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          sx={{ borderTop: `1px solid ${ST.colors.border}`, "& .MuiTablePagination-toolbar": { fontSize: 13 } }}
        />
      </Paper>

      {/* Row action menu */}
      <Menu anchorEl={rowMenuAnchor} open={Boolean(rowMenuAnchor)} onClose={() => setRowMenuAnchor(null)}
        PaperProps={{ elevation: 2, sx: { borderRadius: 2, border: `1px solid ${ST.colors.border}`, minWidth: 180 } }}>
        <MenuItem onClick={() => { router.push(`/staff/enrollment/${selectedStudent?.id}`); setRowMenuAnchor(null); }} sx={{ gap: 1.5, fontSize: 14 }}>
          <VisibilityIcon fontSize="small" sx={{ color: ST.colors.textSecondary }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/staff/enrollment/${selectedStudent?.id}/edit`); setRowMenuAnchor(null); }} sx={{ gap: 1.5, fontSize: 14 }}>
          <EditIcon fontSize="small" sx={{ color: ST.colors.textSecondary }} /> Edit Record
        </MenuItem>
        <Divider />
        <MenuItem sx={{ gap: 1.5, fontSize: 14 }} onClick={() => setRowMenuAnchor(null)}>View Scholarships</MenuItem>
        <MenuItem sx={{ gap: 1.5, fontSize: 14 }} onClick={() => setRowMenuAnchor(null)}>View Support Tickets</MenuItem>
      </Menu>

      {/* ── EXCEL IMPORT DIALOG ── */}
      <Dialog open={excelOpen} onClose={() => setExcelOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ bgcolor: ST.colors.successLight, p: 1, borderRadius: 1.5, display: "flex" }}>
              <TableChartIcon sx={{ color: ST.colors.success, fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>Import from Excel</Typography>
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Upload a .xlsx or .csv file to bulk import students</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {excelDone ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: ST.colors.success, mb: 2 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>Import Successful!</Typography>
              <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>Students have been added to the enrollment system.</Typography>
            </Box>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5, fontSize: 13 }}>
                <strong>Required columns:</strong> student_number, full_name, email, program, cohort, enrollment_date<br />
                <strong>Optional:</strong> phone, gpa, credits_completed, expected_graduation, status
              </Alert>
              <Box
                sx={{ border: `2px dashed ${ST.colors.border}`, borderRadius: 2, p: 4, textAlign: "center", bgcolor: ST.colors.bg, mb: 2, cursor: "pointer", "&:hover": { borderColor: ST.colors.primary } }}
                onClick={() => document.getElementById("excel-upload").click()}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: excelFile ? ST.colors.success : ST.colors.textSecondary, mb: 1 }} />
                <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary }}>
                  {excelFile ? excelFile.name : "Click to select file or drag & drop"}
                </Typography>
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Supports .xlsx, .csv — max 10MB</Typography>
                <input id="excel-upload" type="file" accept=".csv,.xlsx" hidden onChange={(e) => setExcelFile(e.target.files[0])} />
              </Box>
              {excelImporting && <LinearProgress sx={{ borderRadius: 1, mb: 1 }} />}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          {!excelDone ? (
            <>
              <Button onClick={downloadTemplate} startIcon={<DownloadIcon />} variant="outlined"
                sx={{ textTransform: "none", borderRadius: 1.5, borderColor: ST.colors.border, color: ST.colors.textPrimary }}>
                Download Template
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button onClick={() => setExcelOpen(false)} sx={{ textTransform: "none", color: ST.colors.textSecondary }}>Cancel</Button>
              <Button onClick={handleExcelImport} variant="contained" disabled={!excelFile || excelImporting}
                sx={{ textTransform: "none", bgcolor: ST.colors.primary, borderRadius: 1.5 }}>
                {excelImporting ? "Importing..." : "Import Students"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setExcelOpen(false)} variant="contained" fullWidth sx={{ textTransform: "none", bgcolor: ST.colors.primary, borderRadius: 1.5 }}>
              Done
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── API IMPORT DIALOG ── */}
      <Dialog open={apiOpen} onClose={() => setApiOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ bgcolor: ST.colors.primaryLight, p: 1, borderRadius: 1.5, display: "flex" }}>
              <ApiIcon sx={{ color: ST.colors.primary, fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>Import via SIS / LMS API</Typography>
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Fetch students from Student Information System and Learning Management System</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {apiDone ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: ST.colors.success, mb: 2 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>{selectedApiIds.length} Students Imported!</Typography>
              <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>Student records have been synced from SIS & LMS and added to enrollment.</Typography>
            </Box>
          ) : apiStudents.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <ApiIcon sx={{ fontSize: 56, color: ST.colors.textSecondary, mb: 2 }} />
              <Typography variant="body1" fontWeight={600} gutterBottom>Connect to SIS / LMS</Typography>
              <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mb: 3 }}>
                Fetch student data from your institution's SIS and LMS systems
              </Typography>
              <Button variant="contained" onClick={handleFetchApiStudents} disabled={apiLoading}
                sx={{ textTransform: "none", bgcolor: ST.colors.primary, borderRadius: 1.5, px: 4 }}>
                {apiLoading ? "Fetching..." : "Fetch Students from API"}
              </Button>
              {apiLoading && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}
            </Box>
          ) : (
            <>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
                  <strong>{apiStudents.length}</strong> students fetched · <strong>{selectedApiIds.length}</strong> selected
                </Typography>
                <Button size="small" onClick={() => setSelectedApiIds(selectedApiIds.length === apiStudents.length ? [] : apiStudents.map((s) => s.id))}
                  sx={{ textTransform: "none", color: ST.colors.primary, fontSize: 12 }}>
                  {selectedApiIds.length === apiStudents.length ? "Deselect All" : "Select All"}
                </Button>
              </Box>
              <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ bgcolor: ST.colors.bg }} />
                      {["Student ID", "Name", "Program", "Cohort", "SIS Status", "GPA", "Credits", "LMS Courses", "Avg Score", "Last Active", "Learning Path"].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, color: ST.colors.textSecondary, bgcolor: ST.colors.bg, whiteSpace: "nowrap" }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {apiStudents.map((s) => (
                      <TableRow key={s.id} hover selected={selectedApiIds.includes(s.id)} onClick={() => toggleApiSelect(s.id)} sx={{ cursor: "pointer" }}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selectedApiIds.includes(s.id)} size="small" sx={{ color: ST.colors.primary }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, color: ST.colors.textSecondary }}>{s.student_number}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: ST.chart.blue }}>{s.full_name.charAt(0)}</Avatar>
                            <Box>
                              <Typography variant="caption" fontWeight={600} sx={{ display: "block" }}>{s.full_name}</Typography>
                              <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{s.email}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{s.program}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{s.cohort}</TableCell>
                        <TableCell>
                          <Chip label={s.sis_status} size="small" sx={{ fontSize: 10, height: 20, bgcolor: s.sis_status === "Enrolled" ? ST.colors.successLight : s.sis_status === "At Risk" ? ST.colors.warningLight : ST.colors.errorLight, color: s.sis_status === "Enrolled" ? ST.colors.success : s.sis_status === "At Risk" ? ST.colors.warning : ST.colors.error }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, fontWeight: 600, color: s.gpa >= 3.5 ? ST.colors.success : s.gpa >= 3.0 ? ST.colors.warning : ST.colors.error }}>{s.gpa}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{s.credits_completed}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{s.lms_courses_completed}/{s.lms_courses_enrolled + s.lms_courses_completed}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontWeight: 600, color: s.lms_avg_score >= 80 ? ST.colors.success : s.lms_avg_score >= 65 ? ST.colors.warning : ST.colors.error }}>{s.lms_avg_score}%</TableCell>
                        <TableCell sx={{ fontSize: 12, color: ST.colors.textSecondary }}>{s.lms_last_active}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{s.lms_learning_path}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {apiImporting && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}
            </>
          )}
        </DialogContent>
        {!apiDone && apiStudents.length > 0 && (
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setApiOpen(false)} sx={{ textTransform: "none", color: ST.colors.textSecondary }}>Cancel</Button>
            <Button onClick={handleApiImport} variant="contained" disabled={selectedApiIds.length === 0 || apiImporting}
              sx={{ textTransform: "none", bgcolor: ST.colors.primary, borderRadius: 1.5, px: 3 }}>
              {apiImporting ? "Importing..." : `Import ${selectedApiIds.length} Student${selectedApiIds.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogActions>
        )}
        {apiDone && (
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setApiOpen(false)} variant="contained" fullWidth sx={{ textTransform: "none", bgcolor: ST.colors.primary, borderRadius: 1.5 }}>Done</Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
}

export default function EnrollmentPageWithSuspense() {
  return (
    <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>}>
      <EnrollmentPage />
    </Suspense>
  );
}
