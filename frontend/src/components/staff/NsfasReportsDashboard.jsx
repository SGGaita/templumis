"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TablePagination from "@mui/material/TablePagination";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import IconButton from "@mui/material/IconButton";
import PeopleIcon from "@mui/icons-material/People";
import BarChartIcon from "@mui/icons-material/BarChart";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import {
  EMPTY_FILTERS,
  parseFiltersFromParams,
  filtersToSearchParams,
  matchStudent,
  countActiveFilters,
  toggleFilter,
  flattenFilterChips,
} from "@/lib/nsfasAnalytics";

const fmtKes = (n) => `KES ${Number(n || 0).toLocaleString()}`;

const StatCard = ({ label, value, subtitle, color, onClick, active }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2,
      border: `2px solid ${active ? ST.colors.secondary : ST.colors.border}`,
      borderRadius: 2,
      height: "100%",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.15s",
      "&:hover": onClick ? { boxShadow: 3 } : {},
    }}
  >
    <Typography variant="h4" fontWeight={700} sx={{ color: color || ST.colors.textPrimary }}>
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

const SectionCard = ({ title, children, sx }) => (
  <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2, ...sx }}>
    <Typography variant="subtitle1" fontWeight={700} sx={{ color: ST.colors.textPrimary, mb: 1.5 }}>
      {title}
    </Typography>
    {children}
  </Paper>
);

const BreakdownList = ({ counts, onSelect, selectedKey, filterLabel }) => {
  const entries = Object.entries(counts || {}).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, v]) => sum + v, 0) || 1;
  if (!entries.length) {
    return (
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
        {filterLabel}
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {entries.map(([label, count]) => (
        <Box
          key={label}
          onClick={() => onSelect?.(label)}
          sx={{
            cursor: onSelect ? "pointer" : "default",
            p: 0.5,
            mx: -0.5,
            borderRadius: 1,
            bgcolor: selectedKey === label ? ST.colors.primaryLight : "transparent",
            "&:hover": onSelect ? { bgcolor: ST.colors.bg } : {},
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2" sx={{ color: ST.colors.textPrimary, fontSize: 13 }}>
              {label}
            </Typography>
            <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary, fontSize: 13 }}>
              {count}
            </Typography>
          </Box>
          <Box sx={{ height: 6, borderRadius: 3, bgcolor: ST.colors.bg, overflow: "hidden" }}>
            <Box
              sx={{
                height: "100%",
                width: `${(count / total) * 100}%`,
                bgcolor: selectedKey === label ? ST.colors.primary : ST.colors.secondary,
                borderRadius: 3,
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const RISK_STYLE = {
  "critical — funding discontinued": { bg: ST.colors.errorLight, color: ST.colors.error },
  "high risk": { bg: ST.colors.errorLight, color: ST.colors.error },
  "medium risk": { bg: ST.colors.warningLight, color: ST.colors.warning },
};

const RiskChip = ({ risk }) => {
  const key = String(risk || "").toLowerCase();
  const s = RISK_STYLE[key] || { bg: ST.colors.successLight, color: ST.colors.success };
  return (
    <Chip
      label={risk || "Low Risk"}
      size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 600, fontSize: 11, height: 22, border: "none" }}
    />
  );
};

const SORT_FIELDS = {
  name: (s) => String(s.full_name || "").toLowerCase(),
  support: (s) => Number(s["total_support_(kes)"] || 0),
  disbursed: (s) => Number(s["disbursed_(kes)"] || 0),
  outstanding: (s) => Number(s["outstanding_balance_(kes)"] || 0),
  gpa: (s) => Number(s.gpa ?? -1),
  attendance: (s) => Number(s.attendance_pct ?? -1),
};

function NsfasReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const L = t.staff.nsfas.reports;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState(() => parseFiltersFromParams(searchParams));
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await apiFetch("/sis-lms/nsfas/tracking");
        setData(result);
        setError("");
      } catch (err) {
        setError(err.message || L.loadError);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [L.loadError]);

  useEffect(() => {
    setFilters(parseFiltersFromParams(searchParams));
    setPage(0);
  }, [searchParams]);

  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];
    let list = [...data.students];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          String(s.full_name || "").toLowerCase().includes(q) ||
          String(s.student_id || "").toLowerCase().includes(q) ||
          String(s.programme || "").toLowerCase().includes(q)
      );
    }
    list = list.filter((s) => matchStudent(s, filters));
    if (atRiskOnly) {
      list = list.filter((s) => {
        const r = String(s.continuation_risk || "").toLowerCase();
        return r.includes("high") || r.includes("critical") || r.includes("medium");
      });
    }
    const getter = SORT_FIELDS[sortField] || SORT_FIELDS.name;
    list.sort((a, b) => {
      const av = getter(a);
      const bv = getter(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [data, searchQuery, filters, atRiskOnly, sortField, sortDir]);

  const paginatedStudents = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredStudents.slice(start, start + rowsPerPage);
  }, [filteredStudents, page, rowsPerPage]);

  const activeFilters = countActiveFilters(filters) + (atRiskOnly ? 1 : 0);

  const clearFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
    setAtRiskOnly(false);
    setSearchQuery("");
    setPage(0);
    router.replace("/staff/nsfas/reports");
  };

  const syncFilters = (next) => {
    setFilters(next);
    setPage(0);
    const params = filtersToSearchParams(next);
    router.replace(params.toString() ? `/staff/nsfas/reports?${params}` : "/staff/nsfas/reports", { scroll: false });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const applyBreakdownFilter = (type, value) => {
    const key = type === "award" ? "award" : type === "risk" ? "risk" : "standing";
    syncFilters(toggleFilter(filters, key, value));
  };

  const filterChips = useMemo(() => flattenFilterChips(filters, {
    region: L.filterRegion,
    gender: L.filterGender,
    disability: L.filterDisability,
    department: L.filterDepartment,
    award: L.awardStatus,
    risk: L.continuationRisk,
    standing: L.academicStanding,
    withDisability: L.filterWithDisability,
    withoutDisability: L.filterWithoutDisability,
  }), [filters, L]);

  const headCell = (label, sortKey) => (
    <TableCell
      sx={{
        fontWeight: 600,
        fontSize: 12,
        color: ST.colors.textSecondary,
        bgcolor: ST.colors.bg,
        borderBottom: `1px solid ${ST.colors.border}`,
        py: 1.5,
      }}
    >
      {sortKey ? (
        <TableSortLabel
          active={sortField === sortKey}
          direction={sortField === sortKey ? sortDir : "asc"}
          onClick={() => handleSort(sortKey)}
        >
          {label}
        </TableSortLabel>
      ) : (
        label
      )}
    </TableCell>
  );

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
            {L.title}
          </Typography>
          <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>
            {L.subtitle}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            startIcon={<BarChartIcon />}
            onClick={() => router.push("/staff/nsfas/reports/analytics")}
            sx={{ textTransform: "none", borderRadius: 1.5, bgcolor: ST.colors.secondary }}
          >
            {L.visualAnalytics}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => router.push("/staff/nsfas")}
            sx={{ textTransform: "none", borderRadius: 1.5, borderColor: ST.colors.border, color: ST.colors.textPrimary }}
          >
            {L.viewStudentList}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !data || data.kpis.total_beneficiaries === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: "center", border: `1px solid ${ST.colors.border}`, borderRadius: 2, color: ST.colors.textSecondary }}>
          {L.noData}
        </Paper>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label={L.kpiBeneficiaries} value={data.kpis.total_beneficiaries} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label={L.kpiSupport}
                value={fmtKes(data.kpis["total_support_awarded_(kes)"])}
                color={ST.colors.secondary}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label={L.kpiDisbursed}
                value={fmtKes(data.kpis["total_disbursed_(kes)"])}
                color={ST.colors.success}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label={L.kpiOutstanding}
                value={fmtKes(data.kpis["total_outstanding_balance_(kes)"])}
                color={data.kpis["total_outstanding_balance_(kes)"] > 0 ? ST.colors.error : ST.colors.success}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label={L.kpiGpa} value={data.kpis.average_gpa ?? "N/A"} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label={L.kpiAttendance}
                value={data.kpis.average_attendance_pct != null ? `${data.kpis.average_attendance_pct}%` : "N/A"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label={L.kpiDisability} value={data.kpis.with_disability} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label={L.kpiAtRisk}
                value={data.kpis.high_risk_or_critical}
                color={data.kpis.high_risk_or_critical > 0 ? ST.colors.error : ST.colors.success}
                subtitle={L.kpiAtRiskSub}
                onClick={() => setAtRiskOnly((v) => !v)}
                active={atRiskOnly}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <SectionCard title={L.awardStatus}>
                <BreakdownList
                  counts={data.breakdowns.by_award_status}
                  onSelect={(v) => applyBreakdownFilter("award", v)}
                  selectedKey={filters.award?.length === 1 ? filters.award[0] : ""}
                  filterLabel={L.noBreakdown}
                />
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <SectionCard title={L.academicStanding}>
                <BreakdownList
                  counts={data.breakdowns.by_academic_standing}
                  onSelect={(v) => applyBreakdownFilter("standing", v)}
                  selectedKey={filters.standing?.length === 1 ? filters.standing[0] : ""}
                  filterLabel={L.noBreakdown}
                />
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <SectionCard title={L.continuationRisk}>
                <BreakdownList
                  counts={data.breakdowns.by_continuation_risk}
                  onSelect={(v) => applyBreakdownFilter("risk", v)}
                  selectedKey={filters.risk?.length === 1 ? filters.risk[0] : ""}
                  filterLabel={L.noBreakdown}
                />
              </SectionCard>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={7}>
              <SectionCard title={L.allowanceTotals}>
                <Table size="small">
                  <TableBody>
                    {Object.entries(data.breakdowns["allowance_category_totals_(kes)"] || {}).map(([label, amount]) => (
                      <TableRow key={label} sx={{ "&:last-child td": { border: 0 } }}>
                        <TableCell sx={{ fontSize: 13, color: ST.colors.textPrimary, border: 0, py: 0.75, pl: 0 }}>{label}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 13, fontWeight: 600, color: ST.colors.textPrimary, border: 0, py: 0.75, pr: 0 }}>
                          {fmtKes(amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={5}>
              <SectionCard title={L.disabilityImpact}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ color: ST.colors.textSecondary, fontSize: 13 }}>{L.withDisability}</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13 }}>
                      {data.breakdowns.disability.with_disability.count}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ color: ST.colors.textSecondary, fontSize: 13 }}>{L.disabilityTopUp}</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13 }}>
                      {fmtKes(data.breakdowns.disability.with_disability["top_up_disbursed_(kes)"])}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ color: ST.colors.textSecondary, fontSize: 13 }}>{L.avgGpaWith}</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13 }}>
                      {data.breakdowns.disability.with_disability.avg_gpa ?? "N/A"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ color: ST.colors.textSecondary, fontSize: 13 }}>{L.avgGpaWithout}</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13 }}>
                      {data.breakdowns.disability.without_disability.avg_gpa ?? "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </SectionCard>
            </Grid>
          </Grid>

          <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ p: 2.5, pb: 1.5 }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
                  {L.studentTable}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                  <TextField
                    size="small"
                    placeholder={L.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18, color: ST.colors.textSecondary }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ minWidth: 220 }}
                  />
                  <ToggleButtonGroup
                    size="small"
                    value={atRiskOnly ? "risk" : "all"}
                    exclusive
                    onChange={(_, v) => { if (v) { setAtRiskOnly(v === "risk"); setPage(0); } }}
                  >
                    <ToggleButton value="all" sx={{ textTransform: "none", px: 1.5 }}>{L.filterAll}</ToggleButton>
                    <ToggleButton value="risk" sx={{ textTransform: "none", px: 1.5 }}>{L.filterAtRisk}</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Box>
              {activeFilters > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center", mb: 1 }}>
                  <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{L.activeFilters}</Typography>
                  {filterChips.map((chip) => (
                    <Chip
                      key={`${chip.key}-${chip.value}`}
                      size="small"
                      label={chip.label}
                      onDelete={() => {
                        if (chip.key === "disability") {
                          syncFilters({ ...filters, disability: filters.disability.filter((d) => d !== chip.value) });
                        } else {
                          syncFilters({ ...filters, [chip.key]: filters[chip.key].filter((v) => v !== chip.value) });
                        }
                      }}
                    />
                  ))}
                  {atRiskOnly && <Chip size="small" label={L.filterAtRisk} onDelete={() => setAtRiskOnly(false)} />}
                  <IconButton size="small" onClick={clearFilters} aria-label={L.clearFilters}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
                {L.showingCount.replace("{shown}", String(filteredStudents.length)).replace("{total}", String(data.students.length))}
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {headCell(L.colStudent, "name")}
                    {headCell(L.colProgramme)}
                    {headCell(L.colAwardStatus)}
                    {headCell(L.colSupport, "support")}
                    {headCell(L.colDisbursed, "disbursed")}
                    {headCell(L.colOutstanding, "outstanding")}
                    {headCell(L.colGpa, "gpa")}
                    {headCell(L.colAttendance, "attendance")}
                    {headCell(L.colStanding)}
                    {headCell(L.colRisk)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} sx={{ textAlign: "center", py: 4, color: ST.colors.textSecondary }}>
                        {L.noMatch}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStudents.map((s) => (
                      <TableRow
                        key={s.student_id}
                        hover
                        sx={{ cursor: "pointer", "&:last-child td": { border: 0 } }}
                        onClick={() => router.push(`/staff/nsfas?search=${encodeURIComponent(s.student_id || s.full_name || "")}`)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary, fontSize: 13 }}>
                            {s.full_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{s.student_id}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: 13, color: ST.colors.textPrimary }}>
                          {s.programme || "N/A"}{s.year_of_study ? ` · ${s.year_of_study}` : ""}
                        </TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{s.award_status || "—"}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{Number(s["total_support_(kes)"] || 0).toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{Number(s["disbursed_(kes)"] || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ color: (s["outstanding_balance_(kes)"] || 0) > 0 ? ST.colors.error : ST.colors.success, fontSize: 13 }}>
                            {Number(s["outstanding_balance_(kes)"] || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: 13, fontWeight: 700 }}>{s.gpa ?? "N/A"}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{s.attendance_pct != null ? `${s.attendance_pct}%` : "N/A"}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{s.academic_standing || "—"}</TableCell>
                        <TableCell><RiskChip risk={s.continuation_risk} /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredStudents.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Paper>
        </>
      )}
    </Box>
  );
}

export default function NsfasReportsDashboard() {
  return (
    <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>}>
      <NsfasReportsContent />
    </Suspense>
  );
}
