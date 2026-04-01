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
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DomainIcon from "@mui/icons-material/Domain";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import GlobalAdminLayout from "@/components/GlobalAdminLayout";

function StatCard({ title, value, icon, trend, color = "primary" }) {
  return (
    <Card>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                <TrendingUpIcon sx={{ fontSize: 14, color: "success.main", mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.main`,
              color: "white",
              p: 1,
              borderRadius: 1.5,
              display: "flex",
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function GlobalAdminDashboard() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentInstitutions, setRecentInstitutions] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [statsData, institutionsData] = await Promise.all([
        apiFetch("/global-admin/stats", { token }),
        apiFetch("/global-admin/institutions", { token }),
      ]);
      setStats(statsData);
      setInstitutions(institutionsData);
      setRecentInstitutions(institutionsData.slice(0, 5));
    } catch (err) {
      console.error("Failed to fetch data:", err);
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
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back, {user?.full_name}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Institutions"
            value={stats?.total_institutions || 0}
            icon={<BusinessIcon />}
            trend="+12% from last month"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Institutions"
            value={stats?.active_institutions || 0}
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats?.total_users || 0}
            icon={<PeopleIcon />}
            trend="+8% from last month"
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Domains"
            value={stats?.total_domains || 0}
            icon={<DomainIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Institutions Overview Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
              Institutions by Domain Count
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={institutions.slice(0, 5).map(inst => ({
                  name: inst.name.length > 15 ? inst.name.substring(0, 15) + '...' : inst.name,
                  domains: inst.domains?.length || 0,
                  status: inst.is_active ? 'Active' : 'Inactive'
                }))}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="domains" fill="#1976d2" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Platform Statistics Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
              Platform Overview
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  { name: 'Institutions', total: stats?.total_institutions || 0, active: stats?.active_institutions || 0 },
                  { name: 'Admins', total: stats?.users_by_role?.institution_admin || 0, active: stats?.users_by_role?.institution_admin || 0 },
                  { name: 'Domains', total: stats?.total_domains || 0, active: stats?.total_domains || 0 },
                ]}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#1976d2" name="Total" radius={[8, 8, 0, 0]} />
                <Bar dataKey="active" fill="#2e7d32" name="Active" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Institutions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 1.5 }}>
              Recent Institutions
            </Typography>
            <List>
              {recentInstitutions.map((inst) => (
                <ListItem
                  key={inst.id}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <ListItemText
                    primary={inst.name}
                    secondary={`${inst.domains?.length || 0} domains`}
                  />
                  <Chip
                    label={inst.is_active ? "Active" : "Inactive"}
                    color={inst.is_active ? "success" : "default"}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </GlobalAdminLayout>
  );
}
