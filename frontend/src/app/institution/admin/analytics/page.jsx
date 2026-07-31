"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DomainIcon from "@mui/icons-material/Domain";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import InstitutionAdminLayout from "@/components/InstitutionAdminLayout";
import { ST } from "@/lib/staffTheme";

const COLORS = ['#2563eb', '#0891b2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [statsData, usersData] = await Promise.all([
        apiFetch("/institution/stats", { token }),
        apiFetch("/institution/users", { token }),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      setError("Failed to fetch analytics data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "institution_admin") {
      router.push("/institution/login");
      return;
    }
    fetchData();
  }, [user, authLoading, router, fetchData]);

  if (authLoading || loading) {
    return (
      <InstitutionAdminLayout>
        <LinearProgress sx={{ borderRadius: 1 }} />
      </InstitutionAdminLayout>
    );
  }

  const roleChartData = stats?.users_by_role
    ? Object.entries(stats.users_by_role).filter(([_, count]) => count > 0)
        .map(([role, count]) => ({ name: role.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), value: count }))
    : [];

  const statusData = [
    { name: "Active", value: stats?.active_users || 0 },
    { name: "Inactive", value: (stats?.total_users || 0) - (stats?.active_users || 0) },
  ];

  const activationRate = stats?.total_users > 0 ? ((stats.active_users / stats.total_users) * 100).toFixed(1) : 0;
  const barColors = [ST.chart.blue, ST.chart.teal, ST.chart.purple, ST.chart.orange, ST.chart.green, ST.chart.indigo];

  const statCards = [
    { label: "Total Users", value: stats?.total_users || 0, icon: <PeopleIcon sx={{ fontSize: 22 }} />, color: ST.colors.primary, bg: ST.colors.primaryLight },
    { label: "Active Users", value: stats?.active_users || 0, icon: <CheckCircleIcon sx={{ fontSize: 22 }} />, color: ST.colors.success, bg: ST.colors.successLight },
    { label: "Email Domains", value: stats?.domains?.length || 0, icon: <DomainIcon sx={{ fontSize: 22 }} />, color: ST.colors.info, bg: ST.colors.infoLight },
    { label: "Activation Rate", value: `${activationRate}%`, icon: <TrendingUpIcon sx={{ fontSize: 22 }} />, color: ST.chart.teal, bg: "#CCFBF1" },
  ];

  return (
    <InstitutionAdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>Analytics</Typography>
        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>Insights and metrics for {stats?.institution}</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError("")}>{error}</Alert>}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCards.map((c, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
              <Box sx={{ bgcolor: c.bg, color: c.color, p: 1.25, borderRadius: 1.5, display: "inline-flex", mb: 1.5 }}>{c.icon}</Box>
              <Typography variant="h4" fontWeight={800} sx={{ color: ST.colors.textPrimary, mb: 0.25 }}>{c.value}</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary }}>{c.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={700} sx={{ mb: 2, color: ST.colors.textPrimary }}>Users by Role</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={roleChartData} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={ST.colors.border} />
                <XAxis dataKey="name" angle={-35} textAnchor="end" height={80} tick={{ fontSize: 11, fill: ST.colors.textSecondary }} />
                <YAxis tick={{ fontSize: 11, fill: ST.colors.textSecondary }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${ST.colors.border}`, fontSize: 13 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {roleChartData.map((_, index) => <Cell key={index} fill={barColors[index % barColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={700} sx={{ mb: 2, color: ST.colors.textPrimary }}>Active vs Inactive</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  <Cell fill={ST.chart.green} />
                  <Cell fill={ST.chart.red} />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${ST.colors.border}`, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Role breakdown + Activity metrics */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={700} sx={{ mb: 2, color: ST.colors.textPrimary }}>Role Breakdown</Typography>
            <Grid container spacing={1.5}>
              {roleChartData.map((role, index) => (
                <Grid item xs={12} sm={6} key={role.name}>
                  <Box sx={{ p: 2, borderRadius: 1.5, border: `1px solid ${ST.colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: barColors[index % barColors.length], flexShrink: 0 }} />
                      <Typography variant="body2" fontWeight={500} sx={{ color: ST.colors.textSecondary, fontSize: 12 }}>{role.name}</Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="body1" fontWeight={800} sx={{ color: ST.colors.textPrimary }}>{role.value}</Typography>
                      <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
                        {stats?.total_users > 0 ? ((role.value / stats.total_users) * 100).toFixed(0) : 0}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={700} sx={{ mb: 2, color: ST.colors.textPrimary }}>Activity Metrics</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { label: "Active Users", value: stats?.active_users || 0, rate: Number(activationRate), color: ST.colors.success },
                { label: "Inactive Users", value: (stats?.total_users || 0) - (stats?.active_users || 0), rate: 100 - Number(activationRate), color: ST.colors.error },
              ].map((row) => (
                <Box key={row.label}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                    <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>{row.label}</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: row.color }}>{row.value}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={row.rate} sx={{ height: 6, borderRadius: 3,
                    bgcolor: ST.colors.bg, "& .MuiLinearProgress-bar": { bgcolor: row.color, borderRadius: 3 } }} />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </InstitutionAdminLayout>
  );
}
