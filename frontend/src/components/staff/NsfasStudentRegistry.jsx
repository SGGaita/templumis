"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
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
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import SearchIcon from "@mui/icons-material/Search";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";

const AWARD_STATUS_STYLE = {
  "fully funded": { bg: ST.colors.successLight, color: ST.colors.success },
  "provisionally funded": { bg: ST.colors.warningLight, color: ST.colors.warning },
  "appeal pending": { bg: ST.colors.warningLight, color: ST.colors.warning },
  "funding discontinued": { bg: ST.colors.errorLight, color: ST.colors.error },
};

const AwardStatusChip = ({ status }) => {
  const key = String(status || "").toLowerCase();
  const s = AWARD_STATUS_STYLE[key] || { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <Chip
      label={status || "Unknown"}
      size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 600, fontSize: 11, height: 22, border: "none" }}
    />
  );
};

const RiskChip = ({ risk }) => {
  const key = String(risk || "").toLowerCase();
  let s = { bg: ST.colors.successLight, color: ST.colors.success, label: risk || "Low Risk" };
  if (key.includes("critical")) s = { bg: ST.colors.errorLight, color: ST.colors.error, label: risk };
  else if (key.includes("high")) s = { bg: ST.colors.errorLight, color: ST.colors.error, label: risk };
  else if (key.includes("medium")) s = { bg: ST.colors.warningLight, color: ST.colors.warning, label: risk };
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 600, fontSize: 11, height: 22, border: "none" }}
    />
  );
};

function NsfasStudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const fromUrl = searchParams.get("search") || "";
    setSearchQuery(fromUrl);
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/sis-lms/nsfas/students");
        setStudents(data.students || []);
        setError("");
      } catch (err) {
        setError(err.message || "Failed to load NSFAS students");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      String(s.full_name || "").toLowerCase().includes(q) ||
      String(s.email || "").toLowerCase().includes(q) ||
      String(s.student_id || "").toLowerCase().includes(q)
    );
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const headCell = (label) => (
    <TableCell sx={{ fontWeight: 600, fontSize: 12, color: ST.colors.textSecondary, bgcolor: ST.colors.bg, borderBottom: `1px solid ${ST.colors.border}`, py: 1.5 }}>
      {label}
    </TableCell>
  );

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
            NSFAS Students
          </Typography>
          <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>
            Students receiving NSFAS financial aid · {students.length} beneficiaries
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<AssessmentIcon />}
          onClick={() => router.push("/staff/nsfas/reports")}
          sx={{ textTransform: "none", borderRadius: 1.5, borderColor: ST.colors.border, color: ST.colors.textPrimary }}
        >
          View tracking reports
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
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
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {headCell("Student")}
                {headCell("Programme")}
                {headCell("Award Status")}
                {headCell("GPA")}
                {headCell("NSFAS Support (KES)")}
                {headCell("Disbursed (KES)")}
                {headCell("Fee Balance (KES)")}
                {headCell("Disability")}
                {headCell("Risk")}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: ST.colors.textSecondary }}>
                    No NSFAS beneficiaries found
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((student, i) => (
                  <TableRow key={student.student_id} hover
                    sx={{ cursor: "pointer", "&:hover": { bgcolor: "#F8FAFF" }, "&:last-child td": { border: 0 } }}
                    onClick={() => router.push(`/staff/enrollment/${student.student_id}`)}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: [ST.chart.blue, ST.chart.teal, ST.chart.purple, ST.chart.orange, ST.chart.green, ST.chart.indigo][i % 6] }}>
                          {student.full_name?.charAt(0) || "?"}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary, fontSize: 13 }}>{student.full_name}</Typography>
                          <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{student.student_id}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: ST.colors.textPrimary }}>
                      {student.program || "N/A"}{student.year_of_study ? ` · ${student.year_of_study}` : ""}
                    </TableCell>
                    <TableCell><AwardStatusChip status={student.nsfas_award_status} /></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ color: (student.gpa || 0) >= 3.5 ? ST.colors.success : (student.gpa || 0) >= 3.0 ? ST.colors.warning : ST.colors.error }}>
                        {student.gpa ? Number(student.gpa).toFixed(2) : "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{Number(student["nsfas_total_support_(kes)"] || 0).toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{Number(student["nsfas_disbursed_(kes)"] || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ color: (student.balance_due || 0) > 0 ? ST.colors.error : ST.colors.success, fontSize: 13 }}>
                        {Number(student.balance_due || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: ST.colors.textPrimary }}>
                      {String(student.has_disability || "No").toLowerCase() === "yes" ? (student.disability_type || "Yes") : "—"}
                    </TableCell>
                    <TableCell><RiskChip risk={student.nsfas_continuation_risk} /></TableCell>
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
    </Box>
  );
}

export default function NsfasStudentsPageWithSuspense() {
  return (
    <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>}>
      <NsfasStudentsPage />
    </Suspense>
  );
}
