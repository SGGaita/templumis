"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Line,
} from "recharts";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { useDashboardLayout } from "@/lib/dashboardLayout";
import DashboardScreenOptions from "@/components/staff/DashboardScreenOptions";
import MultiFilterSelect from "@/components/staff/MultiFilterSelect";
import {
  EMPTY_FILTERS,
  parseFiltersFromParams,
  filtersToSearchParams,
  countActiveFilters,
  toggleFilter,
  setMultiFilter,
  computeNsfasAnalytics,
  filterOptions,
  flattenFilterChips,
  hasFilter,
  isSelected,
} from "@/lib/nsfasAnalytics";

const CHART_COLORS = [ST.chart.blue, ST.chart.teal, ST.chart.purple, ST.chart.orange, ST.chart.indigo, ST.chart.green];
const RISK_COLORS = {
  "low risk": ST.chart.green,
  "medium risk": ST.chart.yellow,
  "high risk": ST.chart.red,
  "critical — funding discontinued": ST.chart.red,
};
const WIDGET_GRID = {
  kpis: { xs: 12 },
  region: { xs: 12, md: 4 },
  gender: { xs: 12, md: 4 },
  disability: { xs: 12, md: 4 },
  award: { xs: 12, md: 4 },
  risk: { xs: 12, md: 4 },
  standing: { xs: 12, md: 4 },
  allowance: { xs: 12, lg: 7 },
  disbursement: { xs: 12, lg: 5 },
  dept: { xs: 12, md: 6 },
  performance: { xs: 12, md: 6 },
  drillTable: { xs: 12 },
};

const fmtKes = (n) => {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${Math.round(n || 0).toLocaleString()}`;
};

const Panel = ({ title, subtitle, children, sx = {} }) => (
  <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%", ...sx }}>
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
      {subtitle && <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{subtitle}</Typography>}
    </Box>
    {children}
  </Paper>
);

const KpiCard = ({ label, value, color, dimmed }) => (
  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%", opacity: dimmed ? 0.85 : 1 }}>
    <Typography variant="h5" fontWeight={800} sx={{ color: color || ST.colors.textPrimary }}>{value}</Typography>
    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>{label}</Typography>
  </Paper>
);

const ChartTooltip = ({ active, payload, label, valueLabel }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1.5, border: `1px solid ${ST.colors.border}`, borderRadius: 1.5 }}>
      <Typography variant="caption" fontWeight={700}>{label || payload[0]?.payload?.name}</Typography>
      <Typography variant="body2" sx={{ color: ST.colors.primary }}>
        {typeof payload[0].value === "number" && payload[0].value > 999
          ? fmtKes(payload[0].value)
          : `${payload[0].value}${valueLabel || ""}`}
      </Typography>
    </Paper>
  );
};

const cellOpacity = (active, hasAny) => {
  if (!hasAny) return 1;
  return active ? 1 : 0.35;
};

function NsfasVisualAnalyticsContent({ embedded = false, layoutStorageKey = "nsfas-analytics-layout-v1" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const L = t.staff.nsfas.analytics;
  const R = t.staff.nsfas.reports;
  const screenLabels = {
    screenOptions: L.screenOptions,
    screenOptionsSub: L.screenOptionsSub,
    resetLayout: L.resetLayout,
    dragToReorder: L.dragToReorder,
    moveUp: L.moveUp,
    moveDown: L.moveDown,
    alwaysVisible: L.alwaysVisible,
  };

  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(() => parseFiltersFromParams(searchParams));
  const [screenOpen, setScreenOpen] = useState(false);

  const widgetDefaults = useMemo(() => [
    { id: "kpis", label: L.widgetKpis },
    { id: "region", label: L.widgetRegion },
    { id: "gender", label: L.widgetGender },
    { id: "disability", label: L.widgetDisability },
    { id: "award", label: L.widgetAward },
    { id: "risk", label: L.widgetRisk },
    { id: "standing", label: L.widgetStanding },
    { id: "allowance", label: L.widgetAllowance },
    { id: "disbursement", label: L.widgetDisbursement },
    { id: "dept", label: L.widgetDept },
    { id: "performance", label: L.widgetPerformance },
    { id: "drillTable", label: L.widgetDrillTable },
  ], [L]);

  const {
    layout,
    visibleWidgets,
    toggleVisible,
    moveWidget,
    reorderWidget,
    resetLayout,
  } = useDashboardLayout(layoutStorageKey, widgetDefaults);

  useEffect(() => {
    apiFetch("/sis-lms/nsfas/tracking")
      .then(setRawData)
      .catch((err) => setError(err.message || L.loadError))
      .finally(() => setLoading(false));
  }, [L.loadError]);

  useEffect(() => {
    setFilters(parseFiltersFromParams(searchParams));
  }, [searchParams]);

  const syncUrl = useCallback((next) => {
    if (embedded) return;
    const params = filtersToSearchParams(next);
    const qs = params.toString();
    router.replace(qs ? `/staff/nsfas/reports/analytics?${qs}` : "/staff/nsfas/reports/analytics", { scroll: false });
  }, [router, embedded]);

  const applyFilters = useCallback((next) => {
    setFilters(next);
    syncUrl(next);
  }, [syncUrl]);

  const onToggle = useCallback((key, value) => {
    applyFilters(toggleFilter(filters, key, value));
  }, [filters, applyFilters]);

  const clearFilters = useCallback(() => applyFilters({ ...EMPTY_FILTERS }), [applyFilters]);

  const allStudents = rawData?.students || [];
  const options = useMemo(() => filterOptions(allStudents), [allStudents]);
  const computed = useMemo(() => computeNsfasAnalytics(allStudents, filters), [allStudents, filters]);
  const isFiltered = countActiveFilters(filters) > 0;
  const kpis = computed.kpis;

  const awardChart = useMemo(() => Object.entries(computed.breakdowns?.by_award_status || {}).map(([name, value], i) => ({
    name, value, fill: CHART_COLORS[i % CHART_COLORS.length],
  })), [computed]);
  const riskChart = useMemo(() => Object.entries(computed.breakdowns?.by_continuation_risk || {}).map(([name, value]) => ({
    name, value, fill: RISK_COLORS[name.toLowerCase()] || ST.chart.indigo,
  })), [computed]);
  const standingChart = useMemo(() => {
    const colors = { "Good Standing": ST.chart.green, Probation: ST.chart.yellow, Suspended: ST.chart.red };
    return Object.entries(computed.breakdowns?.by_academic_standing || {}).map(([name, value]) => ({
      name, value, fill: colors[name] || ST.chart.blue,
    }));
  }, [computed]);
  const allowanceChart = useMemo(() => Object.entries(computed.breakdowns?.["allowance_category_totals_(kes)"] || {}).map(([name, amount]) => ({ name, amount })), [computed]);
  const deptChart = useMemo(() => Object.entries(computed.breakdowns?.by_department || {}).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8), [computed]);
  const performanceChart = useMemo(() => [...computed.students].filter((s) => s.gpa != null && s.gpa !== "").sort((a, b) => Number(b["total_support_(kes)"]) - Number(a["total_support_(kes)"])).slice(0, 12).map((s) => ({
    name: (s.full_name || s.student_id || "").split(" ")[0],
    support: Number(s["total_support_(kes)"] || 0) / 1000,
    gpa: Number(s.gpa),
  })), [computed.students]);
  const disbursementChart = useMemo(() => {
    const disbursed = kpis["total_disbursed_(kes)"] || 0;
    const outstanding = kpis["total_outstanding_balance_(kes)"] || 0;
    return [
      { name: L.disbursed, value: disbursed, fill: ST.chart.green },
      { name: L.outstanding, value: outstanding, fill: ST.chart.red },
    ].filter((d) => d.value > 0);
  }, [kpis, L.disbursed, L.outstanding]);
  const regionChart = useMemo(() => Object.entries(computed.breakdowns?.by_home_province || {}).map(([name, value], i) => ({ name, value, fill: CHART_COLORS[i % CHART_COLORS.length] })).sort((a, b) => b.value - a.value), [computed]);
  const genderChart = useMemo(() => {
    const colors = { Male: ST.chart.blue, Female: ST.chart.purple, Other: ST.chart.teal };
    return Object.entries(computed.breakdowns?.by_gender || {}).map(([name, value]) => ({ name, value, fill: colors[name] || ST.chart.indigo }));
  }, [computed]);
  const disabilityChart = useMemo(() => {
    const withD = computed.breakdowns?.disability?.with_disability?.count || 0;
    const withoutD = computed.breakdowns?.disability?.without_disability?.count || 0;
    return [
      { name: L.withDisability, value: withD, fill: ST.chart.orange, key: "yes" },
      { name: L.withoutDisability, value: withoutD, fill: ST.chart.green, key: "no" },
    ].filter((d) => d.value > 0);
  }, [computed, L.withDisability, L.withoutDisability]);

  const filterChips = useMemo(() => flattenFilterChips(filters, {
    region: L.filterRegion,
    gender: L.filterGender,
    disability: L.filterDisability,
    department: L.filterDepartment,
    award: R.awardStatus,
    risk: R.continuationRisk,
    standing: R.academicStanding,
    withDisability: L.filterWithDisability,
    withoutDisability: L.filterWithoutDisability,
  }), [filters, L, R]);

  const goDetailedReport = () => {
    const params = filtersToSearchParams(filters);
    router.push(params.toString() ? `/staff/nsfas/reports?${params}` : "/staff/nsfas/reports");
  };

  const removeChip = (chip) => {
    if (chip.key === "disability") {
      applyFilters({ ...filters, disability: filters.disability.filter((d) => d !== chip.value) });
    } else {
      applyFilters({ ...filters, [chip.key]: filters[chip.key].filter((v) => v !== chip.value) });
    }
  };

  const showDemographicsHeader = visibleWidgets.some((w) => ["region", "gender", "disability"].includes(w.id));

  const widgets = useMemo(() => ({
    kpis: () => (
      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}><KpiCard label={L.kpiBeneficiaries} value={kpis.total_beneficiaries} dimmed={isFiltered} /></Grid>
        <Grid item xs={6} sm={3}><KpiCard label={L.kpiSupport} value={fmtKes(kpis["total_support_awarded_(kes)"])} color={ST.colors.secondary} dimmed={isFiltered} /></Grid>
        <Grid item xs={6} sm={3}><KpiCard label={L.kpiDisbursed} value={fmtKes(kpis["total_disbursed_(kes)"])} color={ST.colors.success} dimmed={isFiltered} /></Grid>
        <Grid item xs={6} sm={3}><KpiCard label={L.kpiAtRisk} value={kpis.high_risk_or_critical} color={kpis.high_risk_or_critical > 0 ? ST.colors.error : ST.colors.success} dimmed={isFiltered} /></Grid>
      </Grid>
    ),
    region: () => (
      <Panel title={L.regionChart} subtitle={L.clickToToggle}>
        <Box sx={{ height: 260 }}>
          {regionChart.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>{L.noRegionData}</Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                <Tooltip content={<ChartTooltip valueLabel={` ${L.students}`} />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(s) => s?.payload && onToggle("region", s.payload.name)}>
                  {regionChart.map((e, i) => (
                    <Cell key={i} fill={e.fill} stroke={isSelected(filters, "region", e.name) ? ST.colors.primary : "none"} strokeWidth={isSelected(filters, "region", e.name) ? 2 : 0} fillOpacity={cellOpacity(isSelected(filters, "region", e.name), hasFilter(filters, "region"))} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>
      </Panel>
    ),
    gender: () => (
      <Panel title={L.genderChart} subtitle={L.clickToToggle}>
        <Box sx={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={genderChart} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" cursor="pointer" onClick={(_, idx) => genderChart[idx] && onToggle("gender", genderChart[idx].name)}>
                {genderChart.map((e, i) => (
                  <Cell key={i} fill={e.fill} stroke={isSelected(filters, "gender", e.name) ? ST.colors.primary : "#fff"} strokeWidth={isSelected(filters, "gender", e.name) ? 3 : 1} fillOpacity={cellOpacity(isSelected(filters, "gender", e.name), hasFilter(filters, "gender"))} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip valueLabel={` ${L.students}`} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Panel>
    ),
    disability: () => (
      <Panel title={L.disabilityChart} subtitle={L.disabilityChartSub}>
        <Box sx={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={disabilityChart} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" cursor="pointer" onClick={(_, idx) => disabilityChart[idx] && onToggle("disability", disabilityChart[idx].key)}>
                {disabilityChart.map((e, i) => (
                  <Cell key={i} fill={e.fill} stroke={isSelected(filters, "disability", e.key) ? ST.colors.primary : "#fff"} strokeWidth={isSelected(filters, "disability", e.key) ? 3 : 1} fillOpacity={cellOpacity(isSelected(filters, "disability", e.key), hasFilter(filters, "disability"))} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip valueLabel={` ${L.students}`} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Panel>
    ),
    award: () => (
      <Panel title={L.awardStatusChart} subtitle={L.clickToToggle}>
        <Box sx={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={awardChart} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" cursor="pointer" onClick={(_, idx) => awardChart[idx] && onToggle("award", awardChart[idx].name)}>
                {awardChart.map((e, i) => (
                  <Cell key={i} fill={e.fill} stroke={isSelected(filters, "award", e.name) ? ST.colors.primary : "#fff"} strokeWidth={isSelected(filters, "award", e.name) ? 3 : 1} fillOpacity={cellOpacity(isSelected(filters, "award", e.name), hasFilter(filters, "award"))} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip valueLabel={` ${L.students}`} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Panel>
    ),
    risk: () => (
      <Panel title={L.riskChart} subtitle={L.clickToToggle}>
        <Box sx={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={riskChart} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" cursor="pointer" onClick={(_, idx) => riskChart[idx] && onToggle("risk", riskChart[idx].name)}>
                {riskChart.map((e, i) => (
                  <Cell key={i} fill={e.fill} stroke={isSelected(filters, "risk", e.name) ? ST.colors.primary : "#fff"} strokeWidth={isSelected(filters, "risk", e.name) ? 3 : 1} fillOpacity={cellOpacity(isSelected(filters, "risk", e.name), hasFilter(filters, "risk"))} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip valueLabel={` ${L.students}`} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Panel>
    ),
    standing: () => (
      <Panel title={L.standingChart} subtitle={L.clickToToggle}>
        <Box sx={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={standingChart} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<ChartTooltip valueLabel={` ${L.students}`} />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} cursor="pointer" onClick={(s) => s?.payload && onToggle("standing", s.payload.name)}>
                {standingChart.map((e, i) => (
                  <Cell key={i} fill={e.fill} stroke={isSelected(filters, "standing", e.name) ? ST.colors.primary : "none"} strokeWidth={isSelected(filters, "standing", e.name) ? 2 : 0} fillOpacity={cellOpacity(isSelected(filters, "standing", e.name), hasFilter(filters, "standing"))} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Panel>
    ),
    allowance: () => (
      <Panel title={L.allowanceChart} subtitle={L.allowanceChartSub}>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={allowanceChart} margin={{ top: 4, right: 16, left: 8, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtKes(v)} />
              <Tooltip formatter={(v) => fmtKes(v)} />
              <Bar dataKey="amount" fill={ST.chart.teal} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Panel>
    ),
    disbursement: () => (
      <Panel title={L.disbursementChart} subtitle={L.disbursementChartSub}>
        <Box sx={{ height: 300, position: "relative" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={disbursementChart} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value">
                {disbursementChart.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip formatter={(v) => fmtKes(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <Box sx={{ position: "absolute", top: "38%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
            <Typography variant="h6" fontWeight={800}>
              {kpis["total_disbursed_(kes)"] && kpis["total_support_awarded_(kes)"]
                ? Math.round((kpis["total_disbursed_(kes)"] / kpis["total_support_awarded_(kes)"]) * 100)
                : 0}%
            </Typography>
            <Typography variant="caption" color="text.secondary">{L.disbursedPct}</Typography>
          </Box>
        </Box>
      </Panel>
    ),
    dept: () => (
      <Panel title={L.deptChart} subtitle={L.deptChartSub}>
        <Box sx={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptChart} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
              <Tooltip content={<ChartTooltip valueLabel={` ${L.students}`} />} />
              <Bar dataKey="count" fill={ST.chart.indigo} radius={[0, 4, 4, 0]} cursor="pointer" onClick={(s) => s?.payload && onToggle("department", s.payload.name)}>
                {deptChart.map((e, i) => (
                  <Cell key={i} fill={ST.chart.indigo} stroke={isSelected(filters, "department", e.name) ? ST.colors.primary : "none"} strokeWidth={isSelected(filters, "department", e.name) ? 2 : 0} fillOpacity={cellOpacity(isSelected(filters, "department", e.name), hasFilter(filters, "department"))} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Panel>
    ),
    performance: () => (
      <Panel title={L.performanceChart} subtitle={L.performanceChartSub}>
        <Box sx={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={performanceChart} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={[0, 4]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="right" dataKey="support" name={L.supportK} fill={ST.chart.teal} radius={[3, 3, 0, 0]} barSize={18} />
              <Line yAxisId="left" type="monotone" dataKey="gpa" name="GPA" stroke={ST.chart.orange} strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </Panel>
    ),
    drillTable: () => (
      isFiltered && computed.students.length > 0 ? (
        <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>{L.drillDownTable}</Typography>
            <Button size="small" endIcon={<OpenInNewIcon />} onClick={goDetailedReport} sx={{ textTransform: "none" }}>{L.viewDetailedReport}</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[R.colStudent, R.colProgramme, L.filterRegion, L.filterGender, R.colGpa, R.colRisk].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, bgcolor: ST.colors.bg }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {computed.students.slice(0, 15).map((s) => (
                  <TableRow key={s.student_id} hover sx={{ cursor: "pointer" }} onClick={() => router.push(`/staff/enrollment/${s.student_id}`)}>
                    <TableCell><Typography variant="body2" fontWeight={600} sx={{ fontSize: 13 }}>{s.full_name}</Typography><Typography variant="caption" color="text.secondary">{s.student_id}</Typography></TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{s.programme || "—"}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{s.home_province || "—"}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{s.gender || "—"}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 700 }}>{s.gpa ?? "—"}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{s.continuation_risk || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {computed.students.length > 15 && (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Button onClick={goDetailedReport} sx={{ textTransform: "none" }}>
                {(L.viewAllMatching || "View all {count} in detailed report").replace("{count}", String(computed.students.length))}
              </Button>
            </Box>
          )}
        </Paper>
      ) : null
    ),
  }), [L, R, kpis, isFiltered, filters, regionChart, genderChart, disabilityChart, awardChart, riskChart, standingChart, allowanceChart, disbursementChart, deptChart, performanceChart, computed.students, onToggle, router, goDetailedReport]);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!rawData || rawData.kpis.total_beneficiaries === 0) {
    return <Paper elevation={0} sx={{ p: 6, textAlign: "center", border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}><Typography sx={{ color: ST.colors.textSecondary }}>{L.noData}</Typography></Paper>;
  }

  const firstDemoWidgetId = visibleWidgets.find((w) => ["region", "gender", "disability"].includes(w.id))?.id;

  return (
    <Box>
      {!embedded && (
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, background: `linear-gradient(135deg, ${ST.sidebar.bg} 0%, #1e3a5f 100%)`, color: "white" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 2 }}>
            <Box>
              <Chip label={L.badge} size="small" sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 600, mb: 1 }} />
              <Typography variant="h5" fontWeight={800}>{L.title}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5, maxWidth: 640 }}>{L.subtitle}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goDetailedReport} sx={{ color: "white", borderColor: "rgba(255,255,255,0.4)", textTransform: "none" }}>{L.backToReports}</Button>
              <Button variant="outlined" startIcon={<AssessmentIcon />} onClick={() => router.push(filtersToSearchParams(filters).toString() ? `/staff/nsfas?${filtersToSearchParams(filters)}` : "/staff/nsfas")} sx={{ color: "white", borderColor: "rgba(255,255,255,0.4)", textTransform: "none" }}>{L.viewStudents}</Button>
            </Box>
          </Box>
        </Paper>
      )}

      <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <FilterListIcon sx={{ color: ST.colors.primary, fontSize: 20 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>{L.filterPanel}</Typography>
            <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{L.filterPanelSub}</Typography>
            <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block" }}>{L.filterMultiHint}</Typography>
          </Box>
          <Chip size="small" label={isFiltered ? L.filteredView : L.summaryView} sx={{ fontWeight: 600, ...(isFiltered ? { bgcolor: ST.colors.secondary, color: "white" } : {}) }} />
          <Button size="small" onClick={() => setScreenOpen((v) => !v)} sx={{ textTransform: "none", fontWeight: 600, color: ST.colors.primary }}>
            {L.screenOptions}
          </Button>
        </Box>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MultiFilterSelect label={L.filterRegion} value={filters.region} options={options.regions} onChange={(v) => applyFilters(setMultiFilter(filters, "region", v))} anyLabel={L.filterAny} multiHint={L.filterSelected} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MultiFilterSelect label={L.filterGender} value={filters.gender} options={options.genders} onChange={(v) => applyFilters(setMultiFilter(filters, "gender", v))} anyLabel={L.filterAny} multiHint={L.filterSelected} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{L.filterDisability}</InputLabel>
              <Select multiple label={L.filterDisability} value={filters.disability} onChange={(e) => applyFilters(setMultiFilter(filters, "disability", e.target.value))} renderValue={(s) => s.length ? s.map((d) => (d === "yes" ? L.filterWithDisability : L.filterWithoutDisability)).join(", ") : L.filterAny}>
                <MenuItem value="yes">{L.filterWithDisability}</MenuItem>
                <MenuItem value="no">{L.filterWithoutDisability}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MultiFilterSelect label={L.filterDepartment} value={filters.department} options={options.departments} onChange={(v) => applyFilters(setMultiFilter(filters, "department", v))} anyLabel={L.filterAny} multiHint={L.filterSelected} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MultiFilterSelect label={R.awardStatus} value={filters.award} options={options.awards} onChange={(v) => applyFilters(setMultiFilter(filters, "award", v))} anyLabel={L.filterAny} multiHint={L.filterSelected} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MultiFilterSelect label={R.continuationRisk} value={filters.risk} options={options.risks} onChange={(v) => applyFilters(setMultiFilter(filters, "risk", v))} anyLabel={L.filterAny} multiHint={L.filterSelected} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MultiFilterSelect label={R.academicStanding} value={filters.standing} options={options.standings} onChange={(v) => applyFilters(setMultiFilter(filters, "standing", v))} anyLabel={L.filterAny} multiHint={L.filterSelected} />
          </Grid>
        </Grid>
        {filterChips.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center", mb: 1 }}>
            <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{R.activeFilters}</Typography>
            {filterChips.map((chip) => (
              <Chip key={`${chip.key}-${chip.value}`} size="small" label={chip.label} onDelete={() => removeChip(chip)} />
            ))}
            <IconButton size="small" onClick={clearFilters} aria-label={R.clearFilters}><CloseIcon fontSize="small" /></IconButton>
            <Button size="small" endIcon={<OpenInNewIcon />} onClick={goDetailedReport} sx={{ ml: "auto", textTransform: "none" }}>{L.viewDetailedReport}</Button>
          </Box>
        )}
        <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
          {(L.showingFiltered || "Showing {count} of {total} beneficiaries").replace("{count}", String(computed.students.length)).replace("{total}", String(allStudents.length))}
        </Typography>
      </Paper>

      <DashboardScreenOptions
        open={screenOpen}
        onToggle={() => setScreenOpen((v) => !v)}
        layout={layout}
        onToggleVisible={toggleVisible}
        onMoveWidget={moveWidget}
        onReorderWidget={reorderWidget}
        onReset={resetLayout}
        labels={screenLabels}
      />

      {isFiltered && computed.students.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={clearFilters}>{R.clearFilters}</Button>}>{L.noMatchFilter}</Alert>
      )}

      <Grid container spacing={2.5}>
        {visibleWidgets.map((w) => {
          const render = widgets[w.id];
          if (!render) return null;
          const showHeader = w.id === firstDemoWidgetId && showDemographicsHeader;

          return (
            <Grid item key={w.id} {...(WIDGET_GRID[w.id] || { xs: 12 })}>
              {showHeader && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={700}>{L.demographicsTitle}</Typography>
                  <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{L.clickToToggle}</Typography>
                </Box>
              )}
              {render()}
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default function NsfasVisualAnalytics(props) {
  return (
    <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>}>
      <NsfasVisualAnalyticsContent {...props} />
    </Suspense>
  );
}
