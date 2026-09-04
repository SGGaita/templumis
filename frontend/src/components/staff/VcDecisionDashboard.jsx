"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import PeopleIcon from "@mui/icons-material/People";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SchoolIcon from "@mui/icons-material/School";
import InsightsIcon from "@mui/icons-material/Insights";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { isModuleEnabled } from "@/lib/institutionModules";

const CHART_COLORS = [ST.chart.blue, ST.chart.teal, ST.chart.purple, ST.chart.orange, ST.chart.indigo, ST.chart.green];

const BENCHMARK_STATUS = {
  good: { color: ST.colors.success, bg: ST.colors.successLight, labelKey: "onTarget" },
  watch: { color: ST.colors.warning, bg: ST.colors.warningLight, labelKey: "watch" },
  critical: { color: ST.colors.error, bg: ST.colors.errorLight, labelKey: "actionNeeded" },
};

const insightHref = (insight) => {
  if (insight?.href) return insight.href;
  const t = (insight?.title || "").toLowerCase();
  if (t.includes("risk") || t.includes("standing") || t.includes("retention")) return "/staff/at-risk";
  if (t.includes("ranking")) return "/staff/rankings";
  if (t.includes("aid") || t.includes("scholarship")) return "/staff/scholarships/decisions";
  if (t.includes("revenue") || t.includes("collection")) return "/staff/analytics";
  return "/staff/analytics";
};

const KpiCard = ({ label, value, sub, icon, color, bg, onClick, statusMeta }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2.25,
      border: `1px solid ${ST.colors.border}`,
      borderRadius: 2,
      height: "100%",
      cursor: onClick ? "pointer" : "default",
      borderTop: statusMeta ? `3px solid ${statusMeta.color}` : undefined,
      transition: "box-shadow 0.2s",
      "&:hover": onClick ? { boxShadow: 4 } : {},
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.25 }}>
      <Box sx={{ bgcolor: bg, color, p: 1, borderRadius: 1.5, display: "flex" }}>{icon}</Box>
      {statusMeta && (
        <Chip
          size="small"
          label={statusMeta.label}
          sx={{ height: 22, fontSize: 10, fontWeight: 700, bgcolor: statusMeta.bg, color: statusMeta.color }}
        />
      )}
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

const Panel = ({ title, subtitle, action, children }) => (
  <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%" }}>
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

export default function VcDecisionDashboard({ user }) {
  const router = useRouter();
  const { t } = useLanguage();
  const L = t.staff.vcDashboard;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rankingsEnabled = isModuleEnabled(user?.enabled_modules, "staff", "rankings");
  const scholarshipsEnabled = isModuleEnabled(user?.enabled_modules, "staff", "scholarships");
  const grantsEnabled = isModuleEnabled(user?.enabled_modules, "staff", "grants");
  const enrollmentEnabled = isModuleEnabled(user?.enabled_modules, "staff", "enrollment");

  useEffect(() => {
    apiFetch("/sis-lms/analytics/executive")
      .then(setData)
      .catch((err) => setError(err.message || L.loadError))
      .finally(() => setLoading(false));
  }, [L.loadError]);

  const statusLabel = (key) => {
    if (key === "onTarget") return L.status.onTarget;
    if (key === "watch") return L.status.watch;
    if (key === "actionNeeded") return L.status.actionNeeded;
    return key;
  };

  const benchmarkByLabel = useMemo(() => {
    const map = {};
    (data?.benchmarks || []).forEach((b) => {
      map[b.label] = b;
    });
    return map;
  }, [data]);

  const attentionInsights = useMemo(
    () => (data?.insights || []).filter((i) => i.priority === "high" || i.priority === "medium").slice(0, 4),
    [data]
  );

  const complianceChart = useMemo(() => {
    const c = data?.compliance || {};
    return [
      { name: L.success.onTrack, value: c.green || 0, color: ST.chart.green },
      { name: L.success.atRisk, value: c.yellow || 0, color: ST.chart.yellow },
      { name: L.success.critical, value: c.red || 0, color: ST.chart.red },
    ].filter((d) => d.value > 0);
  }, [data, L]);

  const riskChart = useMemo(() => {
    const r = data?.risk_by_category || {};
    return [
      { name: L.success.finances, count: r.finances || 0, fill: ST.chart.orange },
      { name: L.success.attendance, count: r.attendance || 0, fill: ST.chart.teal },
      { name: L.success.academic, count: r.academic || 0, fill: ST.chart.purple },
    ];
  }, [data, L]);

  const majorChart = useMemo(
    () => (data?.majors?.top || []).map((m, i) => ({ ...m, fill: CHART_COLORS[i % CHART_COLORS.length] })),
    [data]
  );

  const trendChart = useMemo(() => data?.enrollment_trend || [], [data]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const kpis = data?.kpis || {};
  const aid = data?.aid_pipeline || {};
  const schol = aid.scholarships || {};
  const grants = aid.grants || {};
  const retention = data?.retention || {};
  const rankings = data?.rankings_snapshot;
  const readiness = kpis.ranking_readiness_pct;

  const statusMeta = (status) => {
    const st = BENCHMARK_STATUS[status];
    if (!st) return null;
    return { ...st, label: statusLabel(st.labelKey) };
  };

  const pulse = [
    {
      label: L.pulse.totalStudents,
      value: (kpis.total_students || 0).toLocaleString(),
      sub: L.pulse.activeStudents.replace("{count}", String(kpis.active_students || 0)),
      icon: <PeopleIcon />,
      color: ST.colors.primary,
      bg: ST.colors.primaryLight,
      onClick: enrollmentEnabled ? () => router.push("/staff/students") : undefined,
    },
    {
      label: L.pulse.onTrack,
      value: `${kpis.on_track_pct ?? 0}%`,
      sub: L.pulse.vsTarget.replace("{target}", "85%"),
      icon: <CheckCircleIcon />,
      color: ST.colors.success,
      bg: ST.colors.successLight,
      statusMeta: statusMeta(benchmarkByLabel["Students on track"]?.status),
      onClick: () => router.push("/staff/analytics"),
    },
    {
      label: L.pulse.atRisk,
      value: String(kpis.at_risk || 0),
      sub: L.pulse.atRiskShare.replace(
        "{pct}",
        String(
          kpis.total_students
            ? Math.round(((kpis.at_risk || 0) / kpis.total_students) * 1000) / 10
            : 0
        )
      ),
      icon: <WarningAmberIcon />,
      color: ST.colors.error,
      bg: ST.colors.errorLight,
      statusMeta: statusMeta(benchmarkByLabel["At-risk share"]?.status),
      onClick: enrollmentEnabled ? () => router.push("/staff/at-risk") : undefined,
    },
    {
      label: L.pulse.feeCollection,
      value: `${kpis.collection_rate_pct ?? 0}%`,
      sub: L.pulse.vsTarget.replace("{target}", "90%"),
      icon: <AttachMoneyIcon />,
      color: ST.colors.success,
      bg: ST.colors.successLight,
      statusMeta: statusMeta(benchmarkByLabel["Fee collection"]?.status),
      onClick: () => router.push("/staff/analytics"),
    },
    {
      label: L.pulse.avgGpa,
      value: String(kpis.avg_gpa ?? "—"),
      sub: L.pulse.vsTarget.replace("{target}", "3.0"),
      icon: <SchoolIcon />,
      color: ST.colors.info,
      bg: ST.colors.infoLight,
      statusMeta: statusMeta(benchmarkByLabel["Institution GPA"]?.status),
    },
    {
      label: L.pulse.rankingReadiness,
      value: readiness != null ? `${readiness}%` : "—",
      sub: L.pulse.vsTarget.replace("{target}", "70%"),
      icon: <EmojiEventsIcon />,
      color: "#B45309",
      bg: "#FEF3C7",
      statusMeta: statusMeta(benchmarkByLabel["Ranking readiness"]?.status),
      onClick: rankingsEnabled ? () => router.push("/staff/rankings") : undefined,
    },
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Chip
            label={L.badge}
            size="small"
            sx={{ bgcolor: ST.colors.primaryLight, color: ST.colors.primary, fontWeight: 700, mb: 1 }}
          />
          <Typography variant="h5" fontWeight={800} sx={{ color: ST.colors.textPrimary }}>
            {L.title}
          </Typography>
          <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5, maxWidth: 560 }}>
            {L.subtitle}
          </Typography>
          {data?.generated_at && (
            <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", mt: 0.75 }}>
              {L.dataAsOf.replace("{when}", data.generated_at)}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          endIcon={<KeyboardArrowRightIcon />}
          onClick={() => router.push("/staff/analytics")}
          sx={{ textTransform: "none", fontWeight: 700, alignSelf: "flex-start" }}
        >
          {L.openBriefing}
        </Button>
      </Box>

      {/* 1. Attention strip */}
      {attentionInsights.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <InsightsIcon sx={{ color: ST.colors.primary, fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight={700}>
              {L.attention.title}
            </Typography>
          </Box>
          <Grid container spacing={1.5}>
            {attentionInsights.map((insight, i) => (
              <Grid item xs={12} md={6} key={`${insight.title}-${i}`}>
                <Paper
                  elevation={0}
                  onClick={() => router.push(insightHref(insight))}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    cursor: "pointer",
                    border: `1px solid ${ST.colors.border}`,
                    borderLeft: `4px solid ${
                      insight.priority === "high" ? ST.colors.error : ST.colors.warning
                    }`,
                    "&:hover": { boxShadow: 3 },
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color: ST.colors.textSecondary, textTransform: "uppercase" }}
                  >
                    {insight.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: ST.colors.textPrimary, mt: 0.5 }}>
                    {insight.message}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* 2. Institution pulse */}
      <Typography variant="overline" sx={{ color: ST.colors.textSecondary, fontWeight: 700, letterSpacing: 1 }}>
        {L.pulse.title}
      </Typography>
      <Grid container spacing={2} sx={{ mt: 0.5, mb: 3 }}>
        {pulse.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.label}>
            <KpiCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* 3. Student success */}
        <Grid item xs={12} lg={6}>
          <Panel
            title={L.success.title}
            subtitle={L.success.subtitle}
            action={
              enrollmentEnabled ? (
                <Button size="small" sx={{ textTransform: "none" }} onClick={() => router.push("/staff/at-risk")}>
                  {L.success.cta}
                </Button>
              ) : null
            }
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={complianceChart} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value">
                        {complianceChart.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                  {complianceChart.map((c) => (
                    <Chip key={c.name} size="small" label={`${c.name}: ${c.value}`} sx={{ fontSize: 11 }} />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: ST.chart.text }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: ST.chart.text }} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {riskChart.map((e, i) => (
                          <Cell key={i} fill={e.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
                <Typography variant="body2" sx={{ mt: 1, color: ST.colors.textSecondary }}>
                  {L.success.probation.replace("{count}", String(kpis.probation_count || 0))}
                </Typography>
                {retention.has_data && retention.avg_retention_1yr != null && (
                  <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5, color: ST.colors.textPrimary }}>
                    {L.success.retention.replace("{pct}", String(retention.avg_retention_1yr))}
                    {retention.avg_graduation_4yr != null &&
                      ` · ${L.success.graduation.replace("{pct}", String(retention.avg_graduation_4yr))}`}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Panel>
        </Grid>

        {/* 4. Portfolio & access */}
        <Grid item xs={12} lg={6}>
          <Panel title={L.portfolio.title} subtitle={L.portfolio.subtitle}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}>
                <Box sx={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={majorChart} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }} barSize={14}>
                      <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: ST.chart.text }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: ST.chart.text }} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {majorChart.map((e, i) => (
                          <Cell key={i} fill={e.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid item xs={12} sm={5}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">{L.portfolio.ugPg}</Typography>
                    <Typography variant="subtitle1" fontWeight={800}>
                      {kpis.undergraduate || 0} / {kpis.postgraduate || 0}
                    </Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">{L.portfolio.international}</Typography>
                    <Typography variant="subtitle1" fontWeight={800}>{kpis.international_pct ?? 0}%</Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">{L.portfolio.female}</Typography>
                    <Typography variant="subtitle1" fontWeight={800}>{kpis.female_pct ?? 0}%</Typography>
                  </Paper>
                </Box>
              </Grid>
              {scholarshipsEnabled && (
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                    <Chip size="small" label={L.portfolio.aidPending.replace("{count}", String(schol.applications_pending || 0))} />
                    <Chip size="small" label={L.portfolio.aidCommittee.replace("{count}", String(schol.ready_for_committee || 0))} />
                    <Chip size="small" color="success" variant="outlined" label={L.portfolio.aidAwarded.replace("{count}", String(schol.applications_awarded || 0))} />
                    <Button size="small" sx={{ textTransform: "none", ml: "auto" }} onClick={() => router.push("/staff/scholarships/decisions")}>
                      {L.portfolio.aidCta}
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Panel>
        </Grid>
      </Grid>

      {/* Enrollment trend (live cohorts) */}
      {trendChart.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Panel title={L.trend.title} subtitle={L.trend.subtitle}>
            <Box sx={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vcEnrollGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ST.chart.blue} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={ST.chart.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: ST.chart.text }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: ST.chart.text }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="students" name={L.trend.students} stroke={ST.chart.blue} strokeWidth={2} fill="url(#vcEnrollGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Panel>
        </Box>
      )}

      {/* 5. University rankings & readiness */}
      {rankingsEnabled && (
        <Box sx={{ mb: 3 }}>
          <Panel
            title={L.rankings.title}
            subtitle={L.rankings.subtitle}
            action={
              <Button
                variant="outlined"
                size="small"
                endIcon={<KeyboardArrowRightIcon />}
                sx={{ textTransform: "none", fontWeight: 700 }}
                onClick={() => router.push("/staff/rankings")}
              >
                {L.rankings.cta}
              </Button>
            }
          >
            {rankings ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: "center", py: 2 }}>
                    <Typography variant="caption" color="text.secondary">{L.rankings.overall}</Typography>
                    <Typography
                      variant="h2"
                      fontWeight={800}
                      sx={{
                        color:
                          (readiness || 0) >= 70
                            ? ST.colors.success
                            : (readiness || 0) >= 50
                              ? ST.colors.warning
                              : ST.colors.error,
                      }}
                    >
                      {readiness != null ? `${readiness}%` : "—"}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(readiness || 0, 100)}
                      sx={{
                        mt: 1.5,
                        height: 8,
                        borderRadius: 1,
                        "& .MuiLinearProgress-bar": {
                          bgcolor: (readiness || 0) >= 70 ? ST.colors.success : ST.colors.warning,
                        },
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={9}>
                  <Grid container spacing={2}>
                    {(rankings.ranking_systems || []).map((sys) => (
                      <Grid item xs={12} sm={4} key={sys.id}>
                        <Paper
                          variant="outlined"
                          onClick={() => router.push("/staff/rankings")}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            textAlign: "center",
                            cursor: "pointer",
                            "&:hover": { boxShadow: 3, borderColor: ST.colors.primary },
                          }}
                        >
                          <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                            {sys.name}
                          </Typography>
                          <Typography
                            variant="h4"
                            fontWeight={800}
                            sx={{
                              color:
                                sys.readiness_pct >= 70
                                  ? ST.colors.success
                                  : sys.readiness_pct >= 50
                                    ? ST.colors.warning
                                    : ST.colors.error,
                            }}
                          >
                            {sys.readiness_pct}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={sys.readiness_pct}
                            sx={{
                              mt: 1.5,
                              height: 8,
                              borderRadius: 1,
                              "& .MuiLinearProgress-bar": {
                                bgcolor: sys.readiness_pct >= 70 ? ST.colors.success : ST.colors.warning,
                              },
                            }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
                {grantsEnabled && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
                      {L.rankings.grantsNote
                        .replace("{pending}", String(grants.applications_pending || 0))
                        .replace("{approved}", String(grants.applications_approved || 0))}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Alert severity="info">{L.rankings.unavailable}</Alert>
            )}
          </Panel>
        </Box>
      )}

      <Box sx={{ display: "flex", justifyContent: "center", pb: 2 }}>
        <Button
          variant="text"
          startIcon={<TrendingUpIcon />}
          onClick={() => router.push("/staff/analytics")}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {L.openBriefing}
        </Button>
      </Box>
    </Box>
  );
}
