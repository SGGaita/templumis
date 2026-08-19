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
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import SearchIcon from "@mui/icons-material/Search";
import SchoolIcon from "@mui/icons-material/School";
import ScienceIcon from "@mui/icons-material/Science";
import PeopleIcon from "@mui/icons-material/People";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FilterListIcon from "@mui/icons-material/FilterList";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";

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
  all: { title: "Students", subtitle: "Undergraduate and postgraduate enrollment records" },
  undergraduate: { title: "Students", subtitle: "Bachelor and diploma cohorts" },
  postgraduate: { title: "Students", subtitle: "Masters, PhD, and research programmes" },
};

function EnrollmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cohortParam = searchParams.get("cohort");
  const cohortFilter = cohortParam === "undergraduate" || cohortParam === "postgraduate" ? cohortParam : null;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [rowMenuAnchor, setRowMenuAnchor] = useState(null);
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

  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      String(s.full_name || "").toLowerCase().includes(q) ||
      String(s.email || "").toLowerCase().includes(q) ||
      String(s.student_id || s.student_number || "").toLowerCase().includes(q)
    );
  });

  const pageMeta = COHORT_LABELS[cohortFilter || "all"];

  const setCohort = (value) => {
    const params = new URLSearchParams();
    if (value && value !== "all") params.set("cohort", value);
    const qs = params.toString();
    router.replace(`/staff/students${qs ? `?${qs}` : ""}`, { scroll: false });
    setPage(0);
  };

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const headCell = (label) => (
    <TableCell sx={{ fontWeight: 600, fontSize: 12, color: ST.colors.textSecondary, bgcolor: ST.colors.bg, borderBottom: `1px solid ${ST.colors.border}`, py: 1.5 }}>
      {label}
    </TableCell>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
          {pageMeta.title}
        </Typography>
        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>
          {pageMeta.subtitle} · {students.length} students
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Cohort tabs + Search */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={cohortFilter || "all"}
          onChange={(_, val) => val && setCohort(val)}
          sx={{ mb: 1.5, flexWrap: "wrap" }}
        >
          <ToggleButton value="all" sx={{ textTransform: "none", px: 1.5 }}>
            <PeopleIcon sx={{ fontSize: 16, mr: 0.5 }} /> All Students
          </ToggleButton>
          <ToggleButton value="undergraduate" sx={{ textTransform: "none", px: 1.5 }}>
            <SchoolIcon sx={{ fontSize: 16, mr: 0.5 }} /> Undergraduates
          </ToggleButton>
          <ToggleButton value="postgraduate" sx={{ textTransform: "none", px: 1.5 }}>
            <ScienceIcon sx={{ fontSize: 16, mr: 0.5 }} /> Postgraduates
          </ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
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
        </Box>
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
