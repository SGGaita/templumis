"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SchoolIcon from "@mui/icons-material/School";
import ScienceIcon from "@mui/icons-material/Science";
import { ST } from "@/lib/staffTheme";
import { atRiskCategoryFilters } from "@/lib/staffNav";
import { apiFetch } from "@/lib/api";

const CATEGORY_COLORS = {
  finances: { bg: ST.colors.warningLight, color: ST.colors.warning },
  attendance: { bg: ST.colors.infoLight, color: ST.colors.info },
  academic: { bg: ST.colors.errorLight, color: ST.colors.error },
};

const StatCard = ({ label, value, subtitle, color, bg, onClick, active }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2,
      border: `1px solid ${active ? color : ST.colors.border}`,
      borderRadius: 2,
      cursor: onClick ? "pointer" : "default",
      bgcolor: active ? bg : "white",
      "&:hover": onClick ? { boxShadow: 2 } : {},
      transition: "all 0.15s",
    }}
  >
    <Typography variant="h4" fontWeight={700} sx={{ color }}>
      {value}
    </Typography>
    <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary, mt: 0.5 }}>
      {label}
    </Typography>
    {subtitle && (
      <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
        {subtitle}
      </Typography>
    )}
  </Paper>
);

function AtRiskStudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const category = searchParams.get("category") || "all";
  const cohort = searchParams.get("cohort") || "all";

  const updateFilters = useCallback(
    (next) => {
      const params = new URLSearchParams();
      const cat = next.category ?? category;
      const coh = next.cohort ?? cohort;
      if (cat && cat !== "all") params.set("category", cat);
      if (coh && coh !== "all") params.set("cohort", coh);
      const qs = params.toString();
      router.replace(qs ? `/staff/at-risk?${qs}` : "/staff/at-risk");
      setPage(0);
    },
    [router, category, cohort]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ limit: "500" });
        if (category !== "all") params.set("category", category);
        if (cohort !== "all") params.set("cohort_level", cohort);
        const [listData, summaryData] = await Promise.all([
          apiFetch(`/sis-lms/at-risk?${params.toString()}`),
          apiFetch("/sis-lms/at-risk/summary"),
        ]);
        setStudents(listData.students || []);
        setSummary(summaryData);
        setError("");
      } catch (err) {
        setError(err.message || "Failed to load at-risk students");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category, cohort]);

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(s.full_name || "").toLowerCase().includes(q) ||
      String(s.student_id || "").toLowerCase().includes(q) ||
      String(s.email || "").toLowerCase().includes(q)
    );
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
          At-Risk Students
        </Typography>
        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>
          Students flagged through finances, attendance, or academic progress — filter by cohort and risk type
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard
            label="All flagged"
            value={summary?.total ?? "—"}
            subtitle="Any risk category"
            color={ST.colors.error}
            bg={ST.colors.errorLight}
            active={category === "all" && cohort === "all"}
            onClick={() => updateFilters({ category: "all", cohort: "all" })}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            label="Finances"
            value={summary?.by_category?.finances ?? "—"}
            color={ST.colors.warning}
            bg={ST.colors.warningLight}
            active={category === "finances"}
            onClick={() => updateFilters({ category: "finances" })}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            label="Attendance"
            value={summary?.by_category?.attendance ?? "—"}
            color={ST.colors.info}
            bg={ST.colors.infoLight}
            active={category === "attendance"}
            onClick={() => updateFilters({ category: "attendance" })}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            label="Academic"
            value={summary?.by_category?.academic ?? "—"}
            color={ST.colors.error}
            bg={ST.colors.errorLight}
            active={category === "academic"}
            onClick={() => updateFilters({ category: "academic" })}
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 2 }}>
          <Typography variant="caption" fontWeight={600} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Risk type
          </Typography>
          <ToggleButtonGroup
            size="small"
            value={category}
            exclusive
            onChange={(_, val) => val && updateFilters({ category: val })}
          >
            {atRiskCategoryFilters.map((f) => (
              <ToggleButton key={f.id} value={f.id} sx={{ textTransform: "none", px: 1.5 }}>
                {f.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
          <Typography variant="caption" fontWeight={600} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Cohort
          </Typography>
          <ToggleButtonGroup
            size="small"
            value={cohort}
            exclusive
            onChange={(_, val) => val && updateFilters({ cohort: val })}
          >
            <ToggleButton value="all" sx={{ textTransform: "none" }}>All</ToggleButton>
            <ToggleButton value="undergraduate" sx={{ textTransform: "none" }}>
              <SchoolIcon sx={{ fontSize: 16, mr: 0.5 }} /> Undergrads
            </ToggleButton>
            <ToggleButton value="postgraduate" sx={{ textTransform: "none" }}>
              <ScienceIcon sx={{ fontSize: 16, mr: 0.5 }} /> Post Grads
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
        <TextField
          placeholder="Search by name, ID, or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          size="small"
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: ST.colors.textSecondary, fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
        <Chip label={`${filtered.length} students`} size="small" sx={{ bgcolor: ST.colors.errorLight, color: ST.colors.error, fontWeight: 600 }} />
      </Paper>

      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: ST.colors.bg }}>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Cohort</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Program</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Risk flags</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>GPA</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Balance</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: ST.colors.textSecondary }}>
                    No at-risk students match these filters
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((student, i) => (
                  <TableRow
                    key={student.student_id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => router.push(`/staff/enrollment/${student.student_id}`)}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: ST.colors.primary }}>
                          {student.full_name?.charAt(0) || "?"}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{student.full_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{student.student_id}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={student.cohort_level === "postgraduate" ? "Post Grad" : "Undergrad"}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: 11,
                          bgcolor: student.cohort_level === "postgraduate" ? "#EDE9FE" : "#DBEAFE",
                          color: student.cohort_level === "postgraduate" ? "#7C3AED" : ST.colors.primary,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{student.program}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {(student.risk_flags || []).map((flag, idx) => {
                          const colors = CATEGORY_COLORS[flag.category] || { bg: ST.colors.bg, color: ST.colors.textSecondary };
                          return (
                            <Chip
                              key={idx}
                              label={flag.label}
                              size="small"
                              sx={{ height: 22, fontSize: 10, fontWeight: 600, bgcolor: colors.bg, color: colors.color }}
                            />
                          );
                        })}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{student.gpa ?? "—"}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      {student.balance_due ? `KES ${Number(student.balance_due).toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" sx={{ textTransform: "none" }}
                        onClick={(e) => { e.stopPropagation(); router.push(`/staff/support`); }}>
                        Support
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 15, 25, 50]}
        />
      </Paper>
    </Box>
  );
}

export default function AtRiskPageWithSuspense() {
  return (
    <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>}>
      <AtRiskStudentsPage />
    </Suspense>
  );
}
