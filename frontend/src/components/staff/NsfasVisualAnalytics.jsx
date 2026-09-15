"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssessmentIcon from "@mui/icons-material/Assessment";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Line,
} from "recharts";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";

const CHART_COLORS = [ST.chart.blue, ST.chart.teal, ST.chart.purple, ST.chart.orange, ST.chart.indigo, ST.chart.green];

const RISK_COLORS = {
  "low risk": ST.chart.green,
  "medium risk": ST.chart.yellow,
  "high risk": ST.chart.red,
  "critical — funding discontinued": ST.chart.red,
};

const fmtKes = (n) => {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${Math.round(n || 0).toLocaleString()}`;
};

const Panel = ({ title, subtitle, action, children, sx = {} }) => (
  <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%", ...sx }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, gap: 2 }}>
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>{title}</Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{subtitle}</Typography>
        )}
      </Box>
      {action}
    </Box>
    {children}
  </Paper>
);

const KpiCard = ({ label, value, color }) => (
  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%" }}>
    <Typography variant="h5" fontWeight={800} sx={{ color: color || ST.colors.textPrimary }}>{value}</Typography>
    <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary, mt: 0.5 }}>{label}</Typography>
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

export default function NsfasVisualAnalytics() {
  const router = useRouter();
  const { t } = useLanguage();
  const L = t.staff.nsfas.analytics;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSlice, setSelectedSlice] = useState(null);

  useEffect(() => {
    apiFetch("/sis-lms/nsfas/tracking")
      .then(setData)
      .catch((err) => setError(err.message || L.loadError))
      .finally(() => setLoading(false));
  }, [L.loadError]);

  const awardChart = useMemo(() => {
    const counts = data?.breakdowns?.by_award_status || {};
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [data]);

  const riskChart = useMemo(() => {
    const counts = data?.breakdowns?.by_continuation_risk || {};
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: RISK_COLORS[name.toLowerCase()] || ST.chart.indigo,
    }));
  }, [data]);

  const standingChart = useMemo(() => {
    const counts = data?.breakdowns?.by_academic_standing || {};
    const colors = { "Good Standing": ST.chart.green, Probation: ST.chart.yellow, Suspended: ST.chart.red };
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: colors[name] || ST.chart.blue,
    }));
  }, [data]);

  const allowanceChart = useMemo(() => {
    const totals = data?.breakdowns?.["allowance_category_totals_(kes)"] || {};
    return Object.entries(totals).map(([name, amount]) => ({ name, amount }));
  }, [data]);

  const deptChart = useMemo(() => {
    const counts = data?.breakdowns?.by_department || {};
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [data]);

  const performanceChart = useMemo(() => {
    if (!data?.students) return [];
    return [...data.students]
      .filter((s) => s.gpa != null && s.gpa !== "")
      .sort((a, b) => Number(b["total_support_(kes)"]) - Number(a["total_support_(kes)"]))
      .slice(0, 12)
      .map((s) => ({
        name: (s.full_name || s.student_id || "").split(" ")[0],
        support: Number(s["total_support_(kes)"] || 0) / 1000,
        gpa: Number(s.gpa),
        attendance: Number(s.attendance_pct || 0),
      }));
  }, [data]);

  const disbursementChart = useMemo(() => {
    if (!data?.kpis) return [];
    const disbursed = data.kpis["total_disbursed_(kes)"] || 0;
    const outstanding = data.kpis["total_outstanding_balance_(kes)"] || 0;
    return [
      { name: L.disbursed, value: disbursed, fill: ST.chart.green },
      { name: L.outstanding, value: outstanding, fill: ST.chart.red },
    ].filter((d) => d.value > 0);
  }, [data, L.disbursed, L.outstanding]);

  const goFilteredReports = (type, value) => {
    const params = new URLSearchParams();
    if (type === "award") params.set("award", value);
    if (type === "risk") params.set("risk", value);
    if (type === "standing") params.set("standing", value);
    router.push(`/staff/nsfas/reports?${params.toString()}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!data || data.kpis.total_beneficiaries === 0) {
    return (
      <Paper elevation={0} sx={{ p: 6, textAlign: "center", border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Typography sx={{ color: ST.colors.textSecondary }}>{L.noData}</Typography>
      </Paper>
    );
  }

  const kpis = data.kpis;

  return (
    <Box>
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
            <Chip label={L.badge} size="small" sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 600, mb: 1 }} />
            <Typography variant="h5" fontWeight={800}>{L.title}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5, maxWidth: 560 }}>{L.subtitle}</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/staff/nsfas/reports")}
              sx={{ color: "white", borderColor: "rgba(255,255,255,0.4)", textTransform: "none" }}
            >
              {L.backToReports}
            </Button>
            <Button
              variant="outlined"
              startIcon={<AssessmentIcon />}
              onClick={() => router.push("/staff/nsfas")}
              sx={{ color: "white", borderColor: "rgba(255,255,255,0.4)", textTransform: "none" }}
            >
              {L.viewStudents}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <KpiCard label={L.kpiBeneficiaries} value={kpis.total_beneficiaries} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label={L.kpiSupport} value={fmtKes(kpis["total_support_awarded_(kes)"])} color={ST.colors.secondary} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label={L.kpiDisbursed} value={fmtKes(kpis["total_disbursed_(kes)"])} color={ST.colors.success} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard
            label={L.kpiAtRisk}
            value={kpis.high_risk_or_critical}
            color={kpis.high_risk_or_critical > 0 ? ST.colors.error : ST.colors.success}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Panel title={L.awardStatusChart} subtitle={L.clickToFilter}>
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={awardChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    cursor="pointer"
                    onClick={(_, idx) => {
                      const item = awardChart[idx];
                      if (item) {
                        setSelectedSlice({ type: "award", ...item });
                        goFilteredReports("award", item.name);
                      }
                    }}
                  >
                    {awardChart.map((e, i) => (
                      <Cell key={i} fill={e.fill} stroke="#fff" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip valueLabel={` ${L.students}`} />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Panel>
        </Grid>

        <Grid item xs={12} md={4}>
          <Panel title={L.riskChart} subtitle={L.clickToFilter}>
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    cursor="pointer"
                    onClick={(_, idx) => {
                      const item = riskChart[idx];
                      if (item) goFilteredReports("risk", item.name);
                    }}
                  >
                    {riskChart.map((e, i) => (
                      <Cell key={i} fill={e.fill} stroke="#fff" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip valueLabel={` ${L.students}`} />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Panel>
        </Grid>

        <Grid item xs={12} md={4}>
          <Panel title={L.standingChart} subtitle={L.clickToFilter}>
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={standingChart} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: ST.chart.text }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11, fill: ST.chart.text }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip valueLabel={` ${L.students}`} />} />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(state) => state?.payload && goFilteredReports("standing", state.payload.name)}
                  >
                    {standingChart.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Panel>
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={7}>
          <Panel title={L.allowanceChart} subtitle={L.allowanceChartSub}>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allowanceChart} margin={{ top: 4, right: 16, left: 8, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: ST.chart.text }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11, fill: ST.chart.text }} tickFormatter={(v) => fmtKes(v)} />
                  <Tooltip formatter={(v) => fmtKes(v)} />
                  <Bar dataKey="amount" fill={ST.chart.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Panel>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Panel title={L.disbursementChart} subtitle={L.disbursementChartSub}>
            <Box sx={{ height: 300, position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={disbursementChart}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {disbursementChart.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
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
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Panel title={L.deptChart} subtitle={L.deptChartSub}>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: ST.chart.text }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: ST.chart.text }} />
                  <Tooltip content={<ChartTooltip valueLabel={` ${L.students}`} />} />
                  <Bar dataKey="count" fill={ST.chart.indigo} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Panel>
        </Grid>

        <Grid item xs={12} md={6}>
          <Panel title={L.performanceChart} subtitle={L.performanceChartSub}>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={performanceChart} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: ST.chart.text }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: ST.chart.text }} label={{ value: "GPA", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} domain={[0, 4]} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: ST.chart.text }} label={{ value: L.supportK, angle: 90, position: "insideRight", style: { fontSize: 10 } }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="right" dataKey="support" name={L.supportK} fill={ST.chart.teal} radius={[3, 3, 0, 0]} barSize={18} />
                  <Line yAxisId="left" type="monotone" dataKey="gpa" name="GPA" stroke={ST.chart.orange} strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          </Panel>
        </Grid>
      </Grid>

      {selectedSlice && (
        <Alert severity="info" sx={{ mt: 2 }} onClose={() => setSelectedSlice(null)}>
          {L.filterHint.replace("{label}", selectedSlice.name)}
        </Alert>
      )}
    </Box>
  );
}
