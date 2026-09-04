"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import PrintIcon from "@mui/icons-material/Print";
import DescriptionIcon from "@mui/icons-material/Description";
import TabIcon from "@mui/icons-material/Tab";
import ArticleIcon from "@mui/icons-material/Article";
import CloseIcon from "@mui/icons-material/Close";
import "./analytics-print.css";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import ScienceIcon from "@mui/icons-material/Science";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import InsightsIcon from "@mui/icons-material/Insights";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";

const CHART_COLORS = [ST.chart.blue, ST.chart.teal, ST.chart.purple, ST.chart.orange, ST.chart.indigo, ST.chart.green];

const DOMESTIC_NATIONALITIES = new Set(["kenyan", "kenya", "local"]);

const isDomesticNationality = (name) => DOMESTIC_NATIONALITIES.has(String(name || "").toLowerCase().trim());

const pctOf = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);

const formatKes = (n) => {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${Math.round(n).toLocaleString()}`;
};

const KpiCard = ({ label, value, sub, icon, color, bg, onClick }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2.5,
      border: `1px solid ${ST.colors.border}`,
      borderRadius: 2,
      height: "100%",
      cursor: onClick ? "pointer" : "default",
      transition: "box-shadow 0.2s",
      "&:hover": onClick ? { boxShadow: 4 } : {},
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
      <Box sx={{ bgcolor: bg, color, p: 1, borderRadius: 1.5, display: "flex" }}>{icon}</Box>
    </Box>
    <Typography variant="h4" fontWeight={800} sx={{ color: ST.colors.textPrimary, lineHeight: 1.1 }}>
      {value}
    </Typography>
    <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary, mt: 0.5 }}>
      {label}
    </Typography>
    {sub && (
      <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
        {sub}
      </Typography>
    )}
  </Paper>
);

const Panel = ({ title, subtitle, action, children, sx = {} }) => (
  <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%", ...sx }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, gap: 2 }}>
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
    {children}
  </Paper>
);

const BENCHMARK_STATUS = {
  good: { color: ST.colors.success, bg: ST.colors.successLight, label: "On target" },
  watch: { color: ST.colors.warning, bg: ST.colors.warningLight, label: "Watch" },
  critical: { color: ST.colors.error, bg: ST.colors.errorLight, label: "Action needed" },
};

const BENCHMARK_ACTIONS = {
  "Fee collection": { tab: 3 },
  "Students on track": { tab: 2 },
  "At-risk share": { path: "/staff/at-risk" },
  "Institution GPA": { tab: 0 },
  "International students": { tab: 0 },
  "Ranking readiness": { tab: 4 },
  "1-year retention": { tab: 5 },
};

const BenchmarkCard = ({ item, active, onClick }) => {
  const st = BENCHMARK_STATUS[item.status] || BENCHMARK_STATUS.watch;
  const met = item.lower_is_better ? item.value <= item.target : item.value >= item.target;
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2,
        border: `2px solid ${active ? st.color : ST.colors.border}`,
        borderRadius: 2,
        borderTop: `3px solid ${st.color}`,
        cursor: "pointer",
        transition: "all 0.15s",
        "&:hover": { boxShadow: 3 },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary }}>
          {item.label}
        </Typography>
        <Chip label={st.label} size="small" sx={{ height: 20, fontSize: 10, bgcolor: st.bg, color: st.color, fontWeight: 700 }} />
      </Box>
      <Typography variant="h5" fontWeight={800} sx={{ color: ST.colors.textPrimary }}>
        {item.value}{item.unit}
      </Typography>
      <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
        Target: {item.lower_is_better ? "≤" : "≥"}{item.target}{item.unit}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={Math.min(item.lower_is_better ? (item.target / Math.max(item.value, 0.1)) * 100 : (item.value / item.target) * 100, 100)}
        sx={{ mt: 1.5, height: 6, borderRadius: 1, bgcolor: ST.colors.bg, "& .MuiLinearProgress-bar": { bgcolor: met ? ST.colors.success : st.color } }}
      />
    </Paper>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1.5, border: `1px solid ${ST.colors.border}`, borderRadius: 1.5 }}>
      <Typography variant="caption" fontWeight={700}>{label || payload[0]?.payload?.name}</Typography>
      <Typography variant="body2" sx={{ color: ST.colors.primary }}>
        {payload[0].value} students
        {payload[0]?.payload?.share_pct != null && ` (${payload[0].payload.share_pct}%)`}
      </Typography>
    </Paper>
  );
};

const TAB_LABELS = ["Overview", "Enrollment mix", "Student success", "Financial", "Strategy & rankings", "Retention"];

const PRINT_BODY_CLASSES = ["print-analytics-summary", "print-analytics-tab", "print-analytics-full"];

export default function ExecutiveAnalyticsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const R = t.staff.analytics.retention;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);
  const [majorMode, setMajorMode] = useState("top");
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [selectedNationality, setSelectedNationality] = useState(null);
  const [nationalityView, setNationalityView] = useState("top6");
  const [nationalityFilter, setNationalityFilter] = useState("all");
  const [selectedGender, setSelectedGender] = useState(null);
  const [genderView, setGenderView] = useState("chart");
  const [selectedCompliance, setSelectedCompliance] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [activeBenchmarkIdx, setActiveBenchmarkIdx] = useState(0);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [printMenuAnchor, setPrintMenuAnchor] = useState(null);

  useEffect(() => {
    apiFetch("/sis-lms/analytics/executive")
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  const triggerPrint = useCallback((scope) => {
    setPrintMenuAnchor(null);
    PRINT_BODY_CLASSES.forEach((c) => document.body.classList.remove(c));
    document.body.classList.add(`print-analytics-${scope}`);
    const cleanup = () => {
      PRINT_BODY_CLASSES.forEach((c) => document.body.classList.remove(c));
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }, []);

  const goBenchmark = useCallback((item) => {
    const action = BENCHMARK_ACTIONS[item?.label];
    if (!action) return;
    if (action.path) router.push(action.path);
    else if (action.tab != null) setTab(action.tab);
  }, [router]);

  const goInsight = useCallback((insight) => {
    const t = (insight.title || "").toLowerCase();
    if (t.includes("retention")) setTab(5);
    else if (t.includes("risk") || t.includes("standing")) setTab(2);
    else if (t.includes("revenue") || t.includes("collection")) setTab(3);
    else if (t.includes("ranking")) setTab(4);
    else if (t.includes("aid") || t.includes("scholarship")) setTab(3);
    else if (t.includes("program") || t.includes("enrollment")) setTab(1);
    else setTab(0);
  }, []);

  const majorChartData = useMemo(() => {
    if (!data?.majors) return [];
    if (majorMode === "top") return data.majors.top.map((m) => ({ ...m, fill: ST.chart.blue }));
    if (majorMode === "bottom") return [...data.majors.bottom].reverse().map((m) => ({ ...m, fill: ST.chart.orange }));
    return data.majors.ranked.slice(0, 8).map((m, i) => ({ ...m, fill: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [data, majorMode]);

  const cohortChartData = useMemo(() => {
    if (!data?.students_by_cohort) return [];
    return Object.entries(data.students_by_cohort)
      .map(([name, count]) => ({ name: name.replace("Cohort ", ""), count }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-6);
  }, [data]);

  const complianceChart = useMemo(() => {
    const c = data?.compliance || {};
    return [
      { name: "On track", value: c.green || 0, color: ST.chart.green },
      { name: "At risk", value: c.yellow || 0, color: ST.chart.yellow },
      { name: "Critical", value: c.red || 0, color: ST.chart.red },
    ].filter((d) => d.value > 0);
  }, [data]);

  const paymentChart = useMemo(() => {
    const ps = data?.financial_summary?.payment_status || {};
    const colors = { Paid: ST.chart.green, Partial: ST.chart.yellow, Overdue: ST.chart.red, Unpaid: ST.chart.red };
    return Object.entries(ps).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || ST.chart.blue,
    }));
  }, [data]);

  const genderChart = useMemo(() => {
    const g = data?.students_by_gender || {};
    const total = data?.kpis?.total_students || Object.values(g).reduce((a, b) => a + (b || 0), 0);
    return [
      { name: "Male", value: g.Male || 0, color: ST.chart.blue },
      { name: "Female", value: g.Female || 0, color: ST.chart.purple },
      { name: "Other", value: g.Other || 0, color: ST.chart.teal },
    ]
      .filter((d) => d.value > 0)
      .map((d) => ({ ...d, share_pct: pctOf(d.value, total) }));
  }, [data]);

  const nationalitySource = useMemo(() => {
    const ranked = data?.nationalities_ranked || data?.nationalities_top || [];
    return ranked.map((n, i) => ({
      ...n,
      rank: i + 1,
      is_domestic: n.is_domestic ?? isDomesticNationality(n.name),
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [data]);

  const nationalityChartData = useMemo(() => {
    let list = nationalityView === "top6" ? nationalitySource.slice(0, 6) : nationalitySource;
    if (nationalityFilter === "domestic") list = list.filter((n) => n.is_domestic);
    if (nationalityFilter === "international") list = list.filter((n) => !n.is_domestic);
    return list;
  }, [nationalitySource, nationalityView, nationalityFilter]);

  const nationalityTotals = useMemo(() => {
    const domestic = nationalitySource.filter((n) => n.is_domestic).reduce((s, n) => s + n.count, 0);
    const total = nationalitySource.reduce((s, n) => s + n.count, 0);
    const international = total - domestic;
    return { domestic, international, total };
  }, [nationalitySource]);

  const riskChart = useMemo(() => {
    const r = data?.risk_by_category || {};
    return [
      { name: "Finances", value: r.finances || 0, color: ST.chart.yellow },
      { name: "Attendance", value: r.attendance || 0, color: ST.chart.blue },
      { name: "Academic", value: r.academic || 0, color: ST.chart.red },
    ].filter((d) => d.value > 0);
  }, [data]);

  const collectionRadial = useMemo(() => {
    const rate = data?.kpis?.collection_rate_pct || 0;
    return [{ name: "Collection", value: rate, fill: rate >= 85 ? ST.chart.green : ST.chart.orange }];
  }, [data]);

  const standingChart = useMemo(() => {
    const s = data?.leadership?.academic_standing || {};
    const colors = { "Good Standing": ST.chart.green, Probation: ST.chart.yellow, Suspended: ST.chart.red, Cleared: ST.chart.blue };
    return Object.entries(s).map(([name, value]) => ({ name, value, color: colors[name] || ST.chart.indigo }));
  }, [data]);

  const gpaBandChart = useMemo(() => {
    const bands = data?.leadership?.gpa?.bands || [];
    const colors = { green: ST.chart.green, blue: ST.chart.blue, red: ST.chart.red };
    return bands.map((b) => ({ name: b.name, count: b.count, fill: colors[b.color] || ST.chart.blue }));
  }, [data]);

  const deptChart = useMemo(() => data?.leadership?.departments_top || [], [data]);

  const feesStatusChart = useMemo(() => {
    const f = data?.leadership?.fees_status || {};
    return Object.entries(f).map(([name, value]) => ({ name, value }));
  }, [data]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">Preparing executive briefing...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const kpis = data.kpis;
  const fin = data.financial_summary;
  const visibleInsights = showAllInsights ? data.insights : (data.insights || []).slice(0, 3);
  const benchmarks = data.benchmarks || [];
  const activeBenchmark = benchmarks[activeBenchmarkIdx] || benchmarks[0];

  const fiveKpis = [
    { label: "Total enrollment", value: kpis.total_students, sub: `${kpis.active_students} active`, icon: <PeopleIcon />, color: ST.colors.primary, bg: ST.colors.primaryLight, onClick: () => router.push("/staff/students") },
    { label: "At-risk students", value: kpis.at_risk, sub: "Click to review list", icon: <WarningAmberIcon />, color: ST.colors.error, bg: ST.colors.errorLight, onClick: () => router.push("/staff/at-risk") },
    { label: "On track", value: `${kpis.on_track_pct}%`, sub: "Attendance compliance", icon: <TrendingUpIcon />, color: ST.colors.success, bg: ST.colors.successLight, onClick: () => setTab(2) },
    { label: "Fee collection", value: `${kpis.collection_rate_pct}%`, sub: "Of billed fees", icon: <AttachMoneyIcon />, color: ST.colors.warning, bg: ST.colors.warningLight, onClick: () => setTab(3) },
    { label: "Institution GPA", value: kpis.avg_gpa?.toFixed(2) ?? "—", sub: "Mean student GPA", icon: <MenuBookIcon />, color: ST.colors.secondary, bg: "#CCFBF1", onClick: () => { setTab(0); setSelectedMajor(null); } },
  ];

  const DetailStrip = ({ title, children, onClose }) => (
    <Box sx={{ mt: 2, p: 2, bgcolor: ST.colors.primaryLight, borderRadius: 1.5, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: ST.colors.primary }}>{title}</Typography>
        {children}
      </Box>
      {onClose && (
        <IconButton size="small" onClick={onClose} aria-label="Clear selection">
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );

  return (
    <Box id="executive-analytics-report" sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Executive header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${ST.sidebar.bg} 0%, #1e3a5f 100%)`,
          color: "white",
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
          <Box>
            <Chip
              label="Executive briefing"
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 600, mb: 1 }}
            />
            <Typography variant="h5" fontWeight={800}>
              Institutional Analytics
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5, maxWidth: 520 }}>
              Decision-ready snapshot for leadership — interactive views, no exhaustive lists
            </Typography>
          </Box>
          <Box sx={{ textAlign: { xs: "left", sm: "right" } }} className="analytics-no-print">
            <Typography variant="caption" sx={{ opacity: 0.7, display: "block" }}>
              Data as of
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {data.generated_at}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap", justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PrintIcon />}
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.4)", textTransform: "none" }}
                onClick={(e) => setPrintMenuAnchor(e.currentTarget)}
              >
                Print
              </Button>
              <Button
                size="small"
                variant="outlined"
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.4)", textTransform: "none" }}
                onClick={() => router.push("/staff/at-risk")}
              >
                At-risk list
              </Button>
            </Box>
            <Menu anchorEl={printMenuAnchor} open={Boolean(printMenuAnchor)} onClose={() => setPrintMenuAnchor(null)}>
              <MenuItem onClick={() => triggerPrint("summary")}>
                <ListItemIcon><DescriptionIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Executive summary" secondary="KPIs, targets & key decisions (1 page)" />
              </MenuItem>
              <MenuItem onClick={() => triggerPrint("tab")}>
                <ListItemIcon><TabIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Current tab" secondary={`Print: ${TAB_LABELS[tab]}`} />
              </MenuItem>
              <MenuItem onClick={() => triggerPrint("full")}>
                <ListItemIcon><ArticleIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Full report" secondary="All sections for board pack" />
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Paper>

      <Box className="analytics-summary-block" sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" },
            gap: 2,
          }}
        >
          {fiveKpis.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </Box>

        {benchmarks.length > 0 && (
          <Box sx={{ mt: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Performance vs targets
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }} className="analytics-no-print">
              {benchmarks.map((b, i) => (
                <Chip
                  key={b.label}
                  label={b.label}
                  size="small"
                  onClick={() => setActiveBenchmarkIdx(i)}
                  color={activeBenchmarkIdx === i ? "primary" : "default"}
                  variant={activeBenchmarkIdx === i ? "filled" : "outlined"}
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Box>
            {activeBenchmark && (
              <BenchmarkCard
                item={activeBenchmark}
                active
                onClick={() => goBenchmark(activeBenchmark)}
              />
            )}
            <Typography variant="caption" sx={{ color: ST.colors.textSecondary, mt: 0.75, display: "block" }} className="analytics-no-print">
              Click the card to open the related dashboard section
            </Typography>
          </Box>
        )}

        {data.insights?.length > 0 && (
          <Box sx={{ mt: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <InsightsIcon sx={{ color: ST.colors.primary, fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700}>Key decisions</Typography>
              </Box>
              {data.insights.length > 3 && (
                <Button size="small" className="analytics-no-print" sx={{ textTransform: "none" }} onClick={() => setShowAllInsights((v) => !v)}>
                  {showAllInsights ? "Show less" : `Show all (${data.insights.length})`}
                </Button>
              )}
            </Box>
            <Grid container spacing={1.5}>
              {visibleInsights.map((insight, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Paper
                    elevation={0}
                    onClick={() => goInsight(insight)}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      cursor: "pointer",
                      borderLeft: `4px solid ${insight.priority === "high" ? ST.colors.error : insight.priority === "medium" ? ST.colors.warning : ST.colors.success}`,
                      border: `1px solid ${ST.colors.border}`,
                      "&:hover": { boxShadow: 3 },
                    }}
                  >
                    <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase" }}>
                      {insight.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: ST.colors.textPrimary, mt: 0.5 }}>{insight.message}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        className="analytics-no-print"
        sx={{ mb: 2, minHeight: 40, "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 40 } }}
      >
        <Tab label="Overview" />
        <Tab label="Enrollment mix" />
        <Tab label="Student success" />
        <Tab label="Financial" />
        <Tab label="Strategy & rankings" />
        <Tab label={t.staff.analytics.retentionTab} />
      </Tabs>

      <Box
        className={`analytics-tab-panel analytics-print-break ${tab === 0 ? "is-active-tab" : ""}`}
        sx={{ display: tab === 0 ? "block" : "none" }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: "none", "@media print": { display: "block" } }}>
          {TAB_LABELS[0]}
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={8}>
            <Panel
              title="Students by major"
              subtitle="Toggle top, bottom, or leading programmes — click a bar for detail"
              action={
                <ToggleButtonGroup size="small" value={majorMode} exclusive onChange={(_, v) => v && setMajorMode(v)}>
                  <ToggleButton value="top" sx={{ textTransform: "none", px: 1.5 }}>
                    <ArrowUpwardIcon sx={{ fontSize: 16, mr: 0.5 }} /> Top 5
                  </ToggleButton>
                  <ToggleButton value="bottom" sx={{ textTransform: "none", px: 1.5 }}>
                    <ArrowDownwardIcon sx={{ fontSize: 16, mr: 0.5 }} /> Bottom 5
                  </ToggleButton>
                  <ToggleButton value="leading" sx={{ textTransform: "none", px: 1.5 }}>
                    <CompareArrowsIcon sx={{ fontSize: 16, mr: 0.5 }} /> Top 8
                  </ToggleButton>
                </ToggleButtonGroup>
              }
            >
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={majorChartData}
                    layout="vertical"
                    margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                    barSize={majorMode === "bottom" ? 22 : 26}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: ST.chart.text }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: ST.chart.text }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      radius={[0, 6, 6, 0]}
                      cursor="pointer"
                      onClick={(state) => state?.payload && setSelectedMajor(state.payload)}
                    >
                      {majorChartData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={selectedMajor?.name === entry.name ? ST.colors.primary : entry.fill || CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              {selectedMajor && (
                <Box sx={{ mt: 2, p: 2, bgcolor: ST.colors.primaryLight, borderRadius: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: ST.colors.primary }}>
                    {selectedMajor.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: ST.colors.textPrimary }}>
                    {selectedMajor.count} students · {selectedMajor.share_pct}% of total enrollment
                  </Typography>
                  <Button size="small" sx={{ mt: 1, textTransform: "none" }} onClick={() => router.push("/staff/students")}>
                    Open enrollment records
                  </Button>
                </Box>
              )}
            </Panel>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Panel
              title="International mix"
              subtitle="Click bars or legend — filter domestic vs international"
              action={
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, alignItems: "flex-end" }}>
                  <ToggleButtonGroup size="small" value={nationalityView} exclusive onChange={(_, v) => v && setNationalityView(v)}>
                    <ToggleButton value="top6" sx={{ textTransform: "none", py: 0.25, px: 1 }}>Top 6</ToggleButton>
                    <ToggleButton value="all" sx={{ textTransform: "none", py: 0.25, px: 1 }}>All</ToggleButton>
                  </ToggleButtonGroup>
                  <ToggleButtonGroup size="small" value={nationalityFilter} exclusive onChange={(_, v) => v && setNationalityFilter(v)}>
                    <ToggleButton value="all" sx={{ textTransform: "none", py: 0.25, px: 1 }}>All</ToggleButton>
                    <ToggleButton value="domestic" sx={{ textTransform: "none", py: 0.25, px: 1 }}>Domestic</ToggleButton>
                    <ToggleButton value="international" sx={{ textTransform: "none", py: 0.25, px: 1 }}>Intl</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              }
            >
              <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                <Chip size="small" label={`Domestic ${nationalityTotals.domestic}`} onClick={() => setNationalityFilter("domestic")} color={nationalityFilter === "domestic" ? "primary" : "default"} sx={{ cursor: "pointer" }} />
                <Chip size="small" label={`International ${nationalityTotals.international}`} onClick={() => setNationalityFilter("international")} color={nationalityFilter === "international" ? "primary" : "default"} sx={{ cursor: "pointer" }} />
              </Box>
              <Box sx={{ height: 220 }}>
                {nationalityChartData.length === 0 ? (
                  <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="body2" color="text.secondary">No nationalities match this filter</Typography>
                  </Box>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nationalityChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: ST.chart.text }} tickLine={false} interval={0} angle={-25} textAnchor="end" height={56} />
                    <YAxis tick={{ fontSize: 11, fill: ST.chart.text }} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                      onClick={(state) => state?.payload && setSelectedNationality(state.payload)}
                    >
                      {nationalityChartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={selectedNationality?.name === entry.name ? ST.colors.primary : entry.fill || ST.chart.teal}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                )}
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, maxHeight: 72, overflowY: "auto", mt: 1 }}>
                {nationalityChartData.map((n) => (
                  <Box
                    key={n.name}
                    onClick={() => setSelectedNationality(n)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      cursor: "pointer",
                      bgcolor: selectedNationality?.name === n.name ? ST.colors.primaryLight : "transparent",
                      "&:hover": { bgcolor: ST.colors.bg },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <FiberManualRecordIcon sx={{ fontSize: 8, color: n.fill }} />
                      <Typography variant="caption" fontWeight={selectedNationality?.name === n.name ? 700 : 400}>{n.name}</Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={600}>{n.count} ({n.share_pct}%)</Typography>
                  </Box>
                ))}
              </Box>
              {selectedNationality && (
                <DetailStrip title={selectedNationality.name} onClose={() => setSelectedNationality(null)}>
                  <Typography variant="body2">
                    #{selectedNationality.rank || "—"} · {selectedNationality.count} students ({selectedNationality.share_pct}% of enrollment)
                  </Typography>
                  <Chip
                    size="small"
                    label={selectedNationality.is_domestic ? "Domestic" : "International"}
                    sx={{ mt: 0.75, fontWeight: 600, bgcolor: selectedNationality.is_domestic ? ST.colors.primaryLight : "#CCFBF1" }}
                  />
                  <Button size="small" sx={{ mt: 1, textTransform: "none" }} onClick={() => router.push("/staff/students")}>
                    Browse student records
                  </Button>
                </DetailStrip>
              )}
            </Panel>
          </Grid>

          <Grid item xs={12} md={6}>
            <Panel
              title="Gender balance"
              subtitle="Click chart, legend, or bars — compare to parity"
              action={
                <ToggleButtonGroup size="small" value={genderView} exclusive onChange={(_, v) => v && setGenderView(v)}>
                  <ToggleButton value="chart" sx={{ textTransform: "none", px: 1.25 }}>Chart</ToggleButton>
                  <ToggleButton value="bars" sx={{ textTransform: "none", px: 1.25 }}>Compare</ToggleButton>
                </ToggleButtonGroup>
              }
            >
              {genderView === "chart" ? (
                <Box sx={{ height: 200, display: "flex", alignItems: "center" }}>
                  <ResponsiveContainer width="55%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={4}
                        dataKey="value"
                        cursor="pointer"
                        onClick={(_, idx) => genderChart[idx] && setSelectedGender(genderChart[idx])}
                      >
                        {genderChart.map((e, i) => (
                          <Cell
                            key={i}
                            fill={selectedGender?.name === e.name ? ST.colors.primary : e.color}
                            stroke={selectedGender?.name === e.name ? ST.colors.primary : "#fff"}
                            strokeWidth={selectedGender?.name === e.name ? 2 : 1}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) =>
                          active && payload?.[0] ? (
                            <Paper sx={{ p: 1.5, border: `1px solid ${ST.colors.border}`, borderRadius: 1 }}>
                              <Typography variant="caption" fontWeight={700}>{payload[0].name}</Typography>
                              <Typography variant="body2">{payload[0].value} students ({payload[0].payload?.share_pct}%)</Typography>
                            </Paper>
                          ) : null
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ flex: 1, pl: 1 }}>
                    {genderChart.map((g) => (
                      <Box
                        key={g.name}
                        onClick={() => setSelectedGender(g)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 0.75,
                          p: 0.75,
                          borderRadius: 1,
                          cursor: "pointer",
                          border: selectedGender?.name === g.name ? `2px solid ${ST.colors.primary}` : "2px solid transparent",
                          bgcolor: selectedGender?.name === g.name ? ST.colors.primaryLight : "transparent",
                          "&:hover": { bgcolor: ST.colors.bg },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <FiberManualRecordIcon sx={{ fontSize: 10, color: g.color }} />
                          <Typography variant="caption" fontWeight={600}>{g.name}</Typography>
                        </Box>
                        <Typography variant="caption" fontWeight={700}>{g.share_pct}%</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ py: 1 }}>
                  {genderChart.map((g) => (
                    <Box
                      key={g.name}
                      onClick={() => setSelectedGender(g)}
                      sx={{ mb: 1.5, cursor: "pointer", p: 0.75, borderRadius: 1, border: selectedGender?.name === g.name ? `2px solid ${g.color}` : "2px solid transparent" }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>{g.name}</Typography>
                        <Typography variant="body2" fontWeight={700}>{g.value} ({g.share_pct}%)</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={g.share_pct}
                        sx={{ height: 10, borderRadius: 1, bgcolor: ST.colors.bg, "& .MuiLinearProgress-bar": { bgcolor: g.color } }}
                      />
                    </Box>
                  ))}
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    Female share: {data.kpis?.female_pct ?? "—"}% · Institutional diversity indicator
                  </Typography>
                </Box>
              )}
              {selectedGender && (
                <DetailStrip title={selectedGender.name} onClose={() => setSelectedGender(null)}>
                  <Typography variant="body2">
                    {selectedGender.value} students · {selectedGender.share_pct}% of {data.kpis?.total_students ?? 0} enrolled
                  </Typography>
                  {selectedGender.name === "Female" && (
                    <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", mt: 0.5 }}>
                      {data.kpis?.female_pct >= 45 && data.kpis?.female_pct <= 55 ? "Near gender parity (45–55% band)." : data.kpis?.female_pct < 45 ? "Below parity — consider targeted outreach." : "Above 55% female enrollment."}
                    </Typography>
                  )}
                  <Button size="small" sx={{ mt: 1, textTransform: "none" }} onClick={() => router.push("/staff/students")}>
                    View enrollment by gender
                  </Button>
                </DetailStrip>
              )}
            </Panel>
          </Grid>

          <Grid item xs={12} md={6}>
            <Panel title="Enrollment cohorts" subtitle="Last 6 entry years">
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cohortChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: ST.chart.text }} />
                    <YAxis tick={{ fontSize: 11, fill: ST.chart.text }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill={ST.chart.indigo} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Panel>
          </Grid>

          <Grid item xs={12} md={6}>
            <Panel title="Schools & faculties" subtitle="Click a department">
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptChart} layout="vertical" margin={{ left: 4 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(s) => s?.payload && setSelectedDept(s.payload)}>
                      {deptChart.map((entry, i) => (
                        <Cell key={entry.name} fill={selectedDept?.name === entry.name ? ST.colors.primary : ST.chart.teal} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              {selectedDept && (
                <DetailStrip title={selectedDept.name} onClose={() => setSelectedDept(null)}>
                  <Typography variant="body2">{selectedDept.count} students · {selectedDept.share_pct}% of headcount</Typography>
                </DetailStrip>
              )}
            </Panel>
          </Grid>

          <Grid item xs={12} md={6}>
            <Panel title="GPA distribution" subtitle="Academic performance bands">
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gpaBandChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: ST.chart.text }} interval={0} angle={-12} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} cursor="pointer" onClick={() => setTab(2)}>
                      {gpaBandChart.map((e, i) => (
                        <Cell key={i} fill={e.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Panel>
          </Grid>
        </Grid>
      </Box>

      <Box
        className={`analytics-tab-panel analytics-print-break ${tab === 1 ? "is-active-tab" : ""}`}
        sx={{ display: tab === 1 ? "block" : "none" }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: "none", "@media print": { display: "block" } }}>
          {TAB_LABELS[1]}
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={5}>
            <Panel title="Undergrad vs postgrad" subtitle="Share of total headcount">
              <Box sx={{ py: 2 }}>
                {[
                  { label: "Undergraduate", count: kpis.undergraduate, color: ST.chart.blue, pct: kpis.total_students ? (kpis.undergraduate / kpis.total_students) * 100 : 0 },
                  { label: "Postgraduate", count: kpis.postgraduate, color: ST.chart.purple, pct: kpis.total_students ? (kpis.postgraduate / kpis.total_students) * 100 : 0 },
                ].map((row) => (
                  <Box
                    key={row.label}
                    onClick={() => router.push(row.label === "Undergraduate" ? "/staff/students?cohort=undergraduate" : "/staff/students?cohort=postgraduate")}
                    sx={{ mb: 2.5, cursor: "pointer", p: 1, borderRadius: 1, "&:hover": { bgcolor: ST.colors.bg } }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600}>{row.label}</Typography>
                      <Typography variant="body2" fontWeight={700}>{row.count} ({row.pct.toFixed(0)}%)</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={row.pct}
                      sx={{ height: 10, borderRadius: 1, bgcolor: ST.colors.bg, "& .MuiLinearProgress-bar": { bgcolor: row.color, borderRadius: 1 } }}
                    />
                  </Box>
                ))}
              </Box>
            </Panel>
          </Grid>

          <Grid item xs={12} md={7}>
            <Panel
              title="Major ranking"
              subtitle="Side-by-side: strongest vs smallest programmes"
            >
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.success, display: "block", mb: 1 }}>
                    TOP 5
                  </Typography>
                  {data.majors.top.map((m, i) => (
                    <Box
                      key={m.name}
                      onClick={() => setSelectedMajor(m)}
                      sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, cursor: "pointer", borderRadius: 1, p: 0.5, bgcolor: selectedMajor?.name === m.name ? ST.colors.primaryLight : "transparent" }}
                    >
                      <Chip label={i + 1} size="small" sx={{ width: 28, height: 22, fontSize: 11, fontWeight: 700 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{m.name}</Typography>
                        <LinearProgress variant="determinate" value={m.share_pct} sx={{ mt: 0.25, height: 4, borderRadius: 1, "& .MuiLinearProgress-bar": { bgcolor: ST.chart.green } }} />
                      </Box>
                      <Typography variant="caption" fontWeight={700}>{m.count}</Typography>
                    </Box>
                  ))}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.warning, display: "block", mb: 1 }}>
                    BOTTOM 5
                  </Typography>
                  {data.majors.bottom.map((m, i) => (
                    <Box
                      key={m.name}
                      onClick={() => setSelectedMajor(m)}
                      sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, cursor: "pointer", borderRadius: 1, p: 0.5, bgcolor: selectedMajor?.name === m.name ? ST.colors.warningLight : "transparent" }}
                    >
                      <Chip label={i + 1} size="small" sx={{ width: 28, height: 22, fontSize: 11, fontWeight: 700, bgcolor: ST.colors.warningLight }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{m.name}</Typography>
                        <LinearProgress variant="determinate" value={Math.max(m.share_pct, 2)} sx={{ mt: 0.25, height: 4, borderRadius: 1, "& .MuiLinearProgress-bar": { bgcolor: ST.chart.orange } }} />
                      </Box>
                      <Typography variant="caption" fontWeight={700}>{m.count}</Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>
              {selectedMajor && (
                <DetailStrip title={selectedMajor.name} onClose={() => setSelectedMajor(null)}>
                  <Typography variant="body2">{selectedMajor.count} students · {selectedMajor.share_pct}% of enrollment</Typography>
                  <Button size="small" sx={{ mt: 0.5, textTransform: "none" }} onClick={() => router.push("/staff/students")}>View enrollment</Button>
                </DetailStrip>
              )}
            </Panel>
          </Grid>

          <Grid item xs={12}>
            <Panel title="Year of study" subtitle="Current distribution">
              <Box sx={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(data.students_by_year || {}).map(([name, count]) => ({ name, count }))}
                    margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: ST.chart.text }} />
                    <YAxis tick={{ fontSize: 11, fill: ST.chart.text }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill={ST.chart.blue} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Panel>
          </Grid>
        </Grid>
      </Box>

      <Box
        className={`analytics-tab-panel analytics-print-break ${tab === 2 ? "is-active-tab" : ""}`}
        sx={{ display: tab === 2 ? "block" : "none" }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: "none", "@media print": { display: "block" } }}>
          {TAB_LABELS[2]}
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <Panel title="Academic standing" subtitle="Registry standing — board visibility">
              <Box sx={{ height: 200, display: "flex", alignItems: "center" }}>
                <ResponsiveContainer width="55%" height="100%">
                  <PieChart>
                    <Pie
                      data={standingChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      cursor="pointer"
                      onClick={(_, idx) => standingChart[idx] && setSelectedCompliance({ name: standingChart[idx].name, value: standingChart[idx].value })}
                    >
                      {standingChart.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ flex: 1 }}>
                  {standingChart.map((s) => (
                    <Box key={s.name} sx={{ mb: 0.75 }}>
                      <Typography variant="caption" fontWeight={600}>{s.name}</Typography>
                      <Typography variant="body2" fontWeight={700}>{s.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Panel>
          </Grid>

          <Grid item xs={12} md={4}>
            <Panel title="Compliance health" subtitle="Attendance-based snapshot">
              <Box sx={{ height: 240, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={complianceChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      cursor="pointer"
                      onClick={(_, idx) => complianceChart[idx] && setSelectedCompliance({ name: complianceChart[idx].name, value: complianceChart[idx].value })}
                    >
                      {complianceChart.map((e, i) => (
                        <Cell key={i} fill={selectedCompliance?.name === e.name ? ST.colors.primary : e.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <Typography variant="h5" fontWeight={800}>{kpis.on_track_pct}%</Typography>
                  <Typography variant="caption" color="text.secondary">on track</Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 1 }}>
                {complianceChart.map((c) => (
                  <Box key={c.name} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <FiberManualRecordIcon sx={{ fontSize: 8, color: c.color }} />
                    <Typography variant="caption">{c.name}: {c.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Panel>
          </Grid>

          <Grid item xs={12} md={4}>
            <Panel title="At-risk drivers" subtitle="Why students are flagged">
              <Box sx={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskChart} layout="vertical" margin={{ left: 8 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(s) => s?.payload && setSelectedRisk(s.payload)}>
                      {riskChart.map((e, i) => (
                        <Cell key={i} fill={selectedRisk?.name === e.name ? ST.colors.primary : e.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              {selectedRisk && (
                <DetailStrip title={`${selectedRisk.name} risk`} onClose={() => setSelectedRisk(null)}>
                  <Typography variant="body2">{selectedRisk.value} students flagged · </Typography>
                  <Button size="small" sx={{ textTransform: "none", mt: 0.5 }} onClick={() => router.push(`/staff/at-risk?category=${selectedRisk.name.toLowerCase()}`)}>
                    Filter at-risk list
                  </Button>
                </DetailStrip>
              )}
              <Button fullWidth variant="contained" sx={{ mt: 1, textTransform: "none", bgcolor: ST.colors.primary }} onClick={() => router.push("/staff/at-risk")}>
                Open at-risk register ({kpis.at_risk})
              </Button>
            </Panel>
          </Grid>

          <Grid item xs={12} md={4}>
            <Panel title="Graduation pipeline" subtitle="Progress toward completion">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <CheckCircleIcon sx={{ color: ST.colors.success }} />
                  <Box>
                    <Typography variant="h5" fontWeight={800}>{data.leadership?.student_success?.graduation_cleared ?? 0}</Typography>
                    <Typography variant="caption" color="text.secondary">Graduation cleared</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <SchoolIcon sx={{ color: ST.colors.primary }} />
                  <Box>
                    <Typography variant="h5" fontWeight={800}>{data.leadership?.student_success?.near_graduation ?? 0}</Typography>
                    <Typography variant="caption" color="text.secondary">Near graduation / final year</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <WarningAmberIcon sx={{ color: ST.colors.warning }} />
                  <Box>
                    <Typography variant="h5" fontWeight={800}>{data.leadership?.student_success?.probation_or_suspended ?? 0}</Typography>
                    <Typography variant="caption" color="text.secondary">Probation or suspended</Typography>
                  </Box>
                </Box>
              </Box>
            </Panel>
          </Grid>

          <Grid item xs={12}>
            <Panel title="Fee compliance (student-level)" subtitle="How students are classified on fees — distinct from institutional collection rate">
              <Box sx={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={feesStatusChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill={ST.chart.indigo} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Panel>
          </Grid>
        </Grid>
      </Box>

      <Box
        className={`analytics-tab-panel analytics-print-break ${tab === 3 ? "is-active-tab" : ""}`}
        sx={{ display: tab === 3 ? "block" : "none" }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: "none", "@media print": { display: "block" } }}>
          {TAB_LABELS[3]}
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard label="Billed" value={formatKes(fin.total_fees_due)} icon={<AttachMoneyIcon />} color={ST.colors.textPrimary} bg={ST.colors.bg} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard label="Collected" value={formatKes(fin.total_fees_paid)} icon={<TrendingUpIcon />} color={ST.colors.success} bg={ST.colors.successLight} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard label="Outstanding" value={formatKes(fin.total_balance_due)} icon={<WarningAmberIcon />} color={ST.colors.error} bg={ST.colors.errorLight} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard label="Scholarships" value={formatKes(fin.total_scholarships_awarded)} icon={<AttachMoneyIcon />} color={ST.colors.info} bg={ST.colors.infoLight} />
          </Grid>

          <Grid item xs={12} md={4}>
            <Panel title="Collection rate" subtitle="Paid vs billed — target 90%+">
              <Box sx={{ height: 220, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={collectionRadial} startAngle={180} endAngle={0}>
                    <RadialBar background dataKey="value" cornerRadius={8} fill={collectionRadial[0]?.fill} />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Box sx={{ position: "absolute", textAlign: "center", pointerEvents: "none" }}>
                  <Typography variant="h3" fontWeight={800} sx={{ color: kpis.collection_rate_pct >= 85 ? ST.colors.success : ST.colors.warning }}>
                    {kpis.collection_rate_pct}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">collected</Typography>
                </Box>
              </Box>
            </Panel>
          </Grid>

          <Grid item xs={12} md={4}>
            <Panel title="Payment status" subtitle="Fee records by status">
              <Box sx={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      cursor="pointer"
                      onClick={(_, idx) => paymentChart[idx] && setSelectedCompliance({ name: `Payment: ${paymentChart[idx].name}`, value: paymentChart[idx].value })}
                    >
                      {paymentChart.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                {paymentChart.map((p) => (
                  <Chip key={p.name} size="small" label={`${p.name}: ${p.value}`} sx={{ fontSize: 11 }} />
                ))}
              </Box>
            </Panel>
          </Grid>

          <Grid item xs={12} md={4}>
            <Panel title="Scholarship pipeline" subtitle="Application outcomes">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, py: 1 }}>
                {Object.entries(fin.scholarship_application_status || {}).map(([status, count]) => {
                  const total = Object.values(fin.scholarship_application_status || {}).reduce((a, b) => a + b, 0) || 1;
                  const pct = (count / total) * 100;
                  const color = status === "Approved" ? ST.chart.green : status === "Rejected" ? ST.chart.red : ST.chart.yellow;
                  return (
                    <Box key={status}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                        <Typography variant="body2" fontWeight={600}>{status}</Typography>
                        <Typography variant="caption" fontWeight={700}>{count}</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 1, "& .MuiLinearProgress-bar": { bgcolor: color } }} />
                    </Box>
                  );
                })}
                {Object.keys(fin.scholarship_application_status || {}).length === 0 && (
                  <Typography variant="body2" color="text.secondary">No scholarship applications on record</Typography>
                )}
              </Box>
            </Panel>
          </Grid>
        </Grid>
      </Box>

      <Box
        className={`analytics-tab-panel analytics-print-break ${tab === 4 ? "is-active-tab" : ""}`}
        sx={{ display: tab === 4 ? "block" : "none" }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: "none", "@media print": { display: "block" } }}>
          {TAB_LABELS[4]}
        </Typography>
        <Grid container spacing={2.5}>
          {data.rankings_snapshot ? (
            <>
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${ST.colors.border}`,
                    bgcolor: ST.colors.primaryLight,
                  }}
                >
                  <Grid container spacing={2}>
                    {[
                      { label: "Student : faculty", value: data.rankings_snapshot.institutional_profile?.student_faculty_ratio },
                      { label: "Avg attendance", value: data.rankings_snapshot.institutional_profile?.avg_attendance },
                      { label: "International (profile)", value: data.rankings_snapshot.institutional_profile?.international_students },
                      { label: "Female ratio", value: data.rankings_snapshot.institutional_profile?.female_ratio },
                      { label: "Faculties / schools", value: data.rankings_snapshot.institutional_profile?.schools_faculties },
                      { label: "Faculty headcount", value: data.rankings_snapshot.institutional_profile?.faculty_count },
                    ].map((item) => (
                      <Grid item xs={6} sm={4} md={2} key={item.label}>
                        <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>{item.value ?? "—"}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} md={8}>
                <Panel title="Global rankings readiness" subtitle="Composite preparedness across major ranking systems">
                  <Grid container spacing={2}>
                    {data.rankings_snapshot.ranking_systems?.map((sys) => (
                      <Grid item xs={12} sm={4} key={sys.id}>
                        <Paper
                          variant="outlined"
                          onClick={() => router.push("/staff/rankings")}
                          sx={{ p: 2, borderRadius: 2, textAlign: "center", cursor: "pointer", "&:hover": { boxShadow: 3, borderColor: ST.colors.primary } }}
                        >
                          <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>{sys.name}</Typography>
                          <Typography variant="h4" fontWeight={800} sx={{ color: sys.readiness_pct >= 70 ? ST.colors.success : sys.readiness_pct >= 50 ? ST.colors.warning : ST.colors.error }}>
                            {sys.readiness_pct}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={sys.readiness_pct}
                            sx={{ mt: 1.5, height: 8, borderRadius: 1, "& .MuiLinearProgress-bar": { bgcolor: sys.readiness_pct >= 70 ? ST.colors.success : ST.colors.warning } }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                  <Button sx={{ mt: 2, textTransform: "none" }} variant="outlined" onClick={() => router.push("/staff/rankings")}>
                    Open full rankings dashboard
                  </Button>
                </Panel>
              </Grid>

              <Grid item xs={12} md={4}>
                <Panel title="Program concentration" subtitle="Higher index = enrollment concentrated in fewer majors">
                  <Box sx={{ textAlign: "center", py: 3 }}>
                    <Typography variant="h2" fontWeight={800} sx={{ color: data.leadership?.program_concentration_index >= 25 ? ST.colors.warning : ST.colors.success }}>
                      {data.leadership?.program_concentration_index ?? 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Concentration index (HHI-style)
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 2, color: ST.colors.textSecondary }}>
                      {data.leadership?.program_concentration_index >= 25
                        ? "Consider diversifying recruitment across under-represented programmes."
                        : "Enrollment is reasonably diversified across programmes."}
                    </Typography>
                  </Box>
                </Panel>
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Alert severity="info">Rankings dashboard data is not available. Upload rankings data in the institutional workbook.</Alert>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <Panel title="Operational capacity" subtitle="Teaching load and course delivery">
              <Grid container spacing={2}>
                {[
                  { label: "Course sections (active)", value: data.leadership?.operational?.active_courses },
                  { label: "Total course catalogue", value: data.leadership?.operational?.total_courses },
                  { label: "Course enrollments", value: data.leadership?.operational?.total_enrollments },
                  { label: "Avg class size", value: data.leadership?.operational?.avg_class_size },
                ].map((m) => (
                  <Grid item xs={6} key={m.label}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">{m.label}</Typography>
                      <Typography variant="h6" fontWeight={800}>{m.value ?? "—"}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Panel>
          </Grid>

          <Grid item xs={12} md={6}>
            <Panel title="Strategic enrollment mix" subtitle="Portfolio balance indicators for council reporting">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2">Postgraduate share</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {kpis.total_students ? Math.round((kpis.postgraduate / kpis.total_students) * 100) : 0}%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={kpis.total_students ? (kpis.postgraduate / kpis.total_students) * 100 : 0} sx={{ height: 8, borderRadius: 1, "& .MuiLinearProgress-bar": { bgcolor: "#7C3AED" } }} />
                </Box>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2">International share</Typography>
                    <Typography variant="body2" fontWeight={700}>{kpis.international_pct}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={kpis.international_pct || 0} sx={{ height: 8, borderRadius: 1, "& .MuiLinearProgress-bar": { bgcolor: ST.chart.teal } }} />
                </Box>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2">Female share</Typography>
                    <Typography variant="body2" fontWeight={700}>{kpis.female_pct}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={kpis.female_pct || 0} sx={{ height: 8, borderRadius: 1, "& .MuiLinearProgress-bar": { bgcolor: ST.chart.purple } }} />
                </Box>
              </Box>
            </Panel>
          </Grid>
        </Grid>
      </Box>

      <Box
        className={`analytics-tab-panel analytics-print-break ${tab === 5 ? "is-active-tab" : ""}`}
        sx={{ display: tab === 5 ? "block" : "none" }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: "none", "@media print": { display: "block" } }}>
          {TAB_LABELS[5]}
        </Typography>
        {data.retention?.has_data ? (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label={R.oneYear}
                value={data.retention.avg_retention_1yr != null ? `${data.retention.avg_retention_1yr}%` : "—"}
                sub={R.cohortsTracked.replace("{count}", String(data.retention.cohort_count || 0))}
                icon={<TrendingUpIcon />}
                color={ST.colors.success}
                bg={ST.colors.successLight}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label={R.fourYear}
                value={data.retention.avg_graduation_4yr != null ? `${data.retention.avg_graduation_4yr}%` : "—"}
                sub={
                  data.retention.latest_snapshot_date
                    ? R.snapshot.replace("{date}", data.retention.latest_snapshot_date)
                    : R.cohortAverage
                }
                icon={<SchoolIcon />}
                color={ST.colors.primary}
                bg={ST.colors.primaryLight}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label={R.initialSize}
                value={(data.retention.total_initial || 0).toLocaleString()}
                sub={R.acrossSnapshots}
                icon={<PeopleIcon />}
                color={ST.colors.info}
                bg={ST.colors.infoLight}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label={R.graduated}
                value={(data.retention.total_graduated || 0).toLocaleString()}
                sub={R.fromTracked}
                icon={<CheckCircleIcon />}
                color={ST.colors.success}
                bg={ST.colors.successLight}
              />
            </Grid>
            <Grid item xs={12}>
              <Panel title={R.byCohort} subtitle={R.byCohortSub}>
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(data.retention.cohorts || []).map((c) => ({
                        name: c.cohort_name,
                        retention: c.retention_rate_1yr ?? 0,
                        graduation: c.graduation_rate_4yr ?? 0,
                      }))}
                      margin={{ top: 8, right: 8, left: -10, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: ST.chart.text }} tickLine={false} axisLine={false} angle={-25} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 11, fill: ST.chart.text }} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip />
                      <Bar dataKey="retention" name={R.retentionSeries} fill={ST.chart.blue} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="graduation" name={R.graduationSeries} fill={ST.chart.teal} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Panel>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info">{R.unavailable}</Alert>
        )}
      </Box>

      <Divider sx={{ my: 3 }} className="analytics-no-print" />
      <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", textAlign: "center" }}>
        Figures sourced from institutional SIS/LMS and rankings data · Designed for executive review and board-ready discussions
      </Typography>
    </Box>
  );
}
