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
        <LinearProgress />
      </InstitutionAdminLayout>
    );
  }

  const roleChartData = stats?.users_by_role
    ? Object.entries(stats.users_by_role)
        .filter(([_, count]) => count > 0)
        .map(([role, count]) => ({
          name: role.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          value: count,
        }))
    : [];

  const statusData = [
    { name: "Active", value: stats?.active_users || 0 },
    { name: "Inactive", value: (stats?.total_users || 0) - (stats?.active_users || 0) },
  ];

  const activationRate = stats?.total_users > 0 
    ? ((stats.active_users / stats.total_users) * 100).toFixed(1) 
    : 0;

  return (
    <InstitutionAdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Insights and metrics for {stats?.institution}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "primary.50", border: "1px solid", borderColor: "primary.200" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                    Total Users
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats?.total_users || 0}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: "primary.main", opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "success.50", border: "1px solid", borderColor: "success.200" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                    Active Users
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats?.active_users || 0}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: "success.main", opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "secondary.50", border: "1px solid", borderColor: "secondary.200" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                    Domains
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats?.domains?.length || 0}
                  </Typography>
                </Box>
                <DomainIcon sx={{ fontSize: 40, color: "secondary.main", opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "info.50", border: "1px solid", borderColor: "info.200" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                    Activation Rate
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {activationRate}%
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: "info.main", opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Users by Role Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
              Users by Role
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roleChartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* User Status Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
              User Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Role Distribution Breakdown */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
              Detailed Role Breakdown
            </Typography>
            <Grid container spacing={2}>
              {roleChartData.map((role, index) => (
                <Grid item xs={12} sm={6} md={4} key={role.name}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "grey.50",
                      border: "1px solid",
                      borderColor: "grey.200",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        {role.name}
                      </Typography>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: COLORS[index % COLORS.length],
                        }}
                      />
                    </Box>
                    <Typography variant="h5" fontWeight={700}>
                      {role.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stats?.total_users > 0 ? ((role.value / stats.total_users) * 100).toFixed(1) : 0}% of total
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* User Activity Metrics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
              User Activity Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: "center", p: 2 }}>
                  <Typography variant="h3" fontWeight={700} color="primary.main">
                    {stats?.active_users || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={activationRate}
                    sx={{ mt: 1, height: 6, borderRadius: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: "center", p: 2 }}>
                  <Typography variant="h3" fontWeight={700} color="error.main">
                    {(stats?.total_users || 0) - (stats?.active_users || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Inactive Users
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={100 - activationRate}
                    sx={{ mt: 1, height: 6, borderRadius: 1 }}
                    color="error"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: "center", p: 2 }}>
                  <Typography variant="h3" fontWeight={700} color="secondary.main">
                    {stats?.domains?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email Domains
                  </Typography>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: "center", p: 2 }}>
                  <Typography variant="h3" fontWeight={700} color="success.main">
                    {activationRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Activation Rate
                  </Typography>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </InstitutionAdminLayout>
  );
}
