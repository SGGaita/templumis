"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import LinearProgress from "@mui/material/LinearProgress";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import DomainIcon from "@mui/icons-material/Domain";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import GlobalAdminLayout from "@/components/GlobalAdminLayout";

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f'];

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [statsData, institutionsData] = await Promise.all([
        apiFetch("/global-admin/stats", { token }),
        apiFetch("/global-admin/institutions", { token }),
      ]);
      setStats(statsData);
      setInstitutions(institutionsData);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "global_admin") {
      router.push("/global-admin/login");
      return;
    }
    fetchData();
  }, [user, authLoading, router, fetchData]);

  if (authLoading || loading) {
    return (
      <GlobalAdminLayout>
        <LinearProgress />
      </GlobalAdminLayout>
    );
  }

  return (
    <GlobalAdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Platform insights and metrics
        </Typography>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "primary.50", border: "1px solid", borderColor: "primary.200" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                    Total Institutions
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats?.total_institutions || 0}
                  </Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 40, color: "primary.main", opacity: 0.3 }} />
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
                    Active Institutions
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats?.active_institutions || 0}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: "success.main", opacity: 0.3 }} />
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
                    Total Admins
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats?.users_by_role?.institution_admin || 0}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: "info.main", opacity: 0.3 }} />
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
                    Total Domains
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats?.total_domains || 0}
                  </Typography>
                </Box>
                <DomainIcon sx={{ fontSize: 40, color: "secondary.main", opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Platform Overview */}
      <Grid container spacing={2}>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 1.5 }}>
              Platform Metrics
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="body2" color="text.secondary">Activation Rate</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body1" fontWeight={600}>
                    {stats?.total_institutions > 0
                      ? Math.round((stats.active_institutions / stats.total_institutions) * 100)
                      : 0}%
                  </Typography>
                  <Chip label="Healthy" color="success" size="small" />
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="body2" color="text.secondary">Avg Admins per Institution</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {stats?.total_institutions > 0 && stats?.users_by_role?.institution_admin
                    ? (stats.users_by_role.institution_admin / stats.total_institutions).toFixed(1)
                    : 0}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="body2" color="text.secondary">Avg Domains per Institution</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {stats?.total_institutions > 0 && stats?.total_domains
                    ? (stats.total_domains / stats.total_institutions).toFixed(1)
                    : 0}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Total Platform Users</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {stats?.total_users || 0}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 1.5 }}>
              Institution Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">Active</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {stats?.active_institutions || 0} ({stats?.total_institutions > 0
                      ? Math.round((stats.active_institutions / stats.total_institutions) * 100)
                      : 0}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats?.total_institutions > 0 ? (stats.active_institutions / stats.total_institutions) * 100 : 0}
                  sx={{ height: 10, borderRadius: 1 }}
                  color="success"
                />
              </Box>
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">Inactive</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {(stats?.total_institutions || 0) - (stats?.active_institutions || 0)} ({stats?.total_institutions > 0
                      ? Math.round(((stats.total_institutions - stats.active_institutions) / stats.total_institutions) * 100)
                      : 0}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats?.total_institutions > 0 ? ((stats.total_institutions - stats.active_institutions) / stats.total_institutions) * 100 : 0}
                  sx={{ height: 10, borderRadius: 1 }}
                  color="error"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Institutions by Domain Count Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
              Top Institutions by Domain Count
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={institutions
                  .sort((a, b) => (b.domains?.length || 0) - (a.domains?.length || 0))
                  .slice(0, 5)
                  .map(inst => ({
                    name: inst.name.length > 20 ? inst.name.substring(0, 20) + '...' : inst.name,
                    domains: inst.domains?.length || 0,
                  }))}
                margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="domains" fill="#1976d2" name="Domains" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Platform Growth Comparison Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
              Platform Resources Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { category: 'Institutions', total: stats?.total_institutions || 0, active: stats?.active_institutions || 0 },
                  { category: 'Admins', total: stats?.users_by_role?.institution_admin || 0, active: stats?.users_by_role?.institution_admin || 0 },
                  { category: 'Domains', total: stats?.total_domains || 0, active: stats?.total_domains || 0 },
                  { category: 'All Users', total: stats?.total_users || 0, active: stats?.total_users || 0 },
                ]}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#1976d2" name="Total" radius={[8, 8, 0, 0]} />
                <Bar dataKey="active" fill="#2e7d32" name="Active" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Institutions Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 1.5 }}>
              Top Institutions by Size
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Institution</TableCell>
                    <TableCell>Domains</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {institutions.slice(0, 5).map((inst) => (
                    <TableRow key={inst.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{inst.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{inst.domains?.length || 0}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={inst.is_active ? "Active" : "Inactive"}
                          color={inst.is_active ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {new Date(inst.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {institutions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No institutions yet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </GlobalAdminLayout>
  );
}
