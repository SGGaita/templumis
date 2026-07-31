"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import AddIcon from "@mui/icons-material/Add";
import PeopleIcon from "@mui/icons-material/People";
import DnsIcon from "@mui/icons-material/Dns";
import BusinessIcon from "@mui/icons-material/Business";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import InstitutionAdminLayout from "@/components/InstitutionAdminLayout";
import { ST } from "@/lib/staffTheme";

const INSTITUTION_ROLES = [
  { value: "vice_chancellor", label: "Vice Chancellor" },
  { value: "registrar", label: "Registrar" },
  { value: "scholarship_office", label: "Financial Aid Officer" },
  { value: "student", label: "Student" },
  { value: "student_services", label: "Student Services" },
  { value: "research_office", label: "Research Office" },
];

export default function InstitutionAdminDashboard() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [domains, setDomains] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState({ email: "", full_name: "", password: "", role: "student" });

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [profileData, usersData, domainsData, statsData] = await Promise.all([
        apiFetch("/institution/profile", { token }),
        apiFetch("/institution/users", { token }),
        apiFetch("/institution/domains", { token }),
        apiFetch("/institution/stats", { token }),
      ]);
      setProfile(profileData);
      setUsers(usersData);
      setDomains(domainsData);
      setStats(statsData);
    } catch {
      setError("Failed to fetch data");
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

  const handleCreateUser = async () => {
    try {
      await apiFetch("/institution/users", {
        method: "POST",
        body: userForm,
        token,
      });
      setUserDialogOpen(false);
      setUserForm({ email: "", full_name: "", password: "", role: "student" });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    }
  };

  if (authLoading || loading) {
    return (
      <InstitutionAdminLayout>
        <LinearProgress sx={{ borderRadius: 1 }} />
      </InstitutionAdminLayout>
    );
  }

  if (!user || user.role !== "institution_admin") return null;

  const usersByRole = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const roleChartData = Object.entries(usersByRole).map(([role, count]) => ({
    role: role.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    count,
  }));

  const barColors = [ST.chart.blue, ST.chart.teal, ST.chart.purple, ST.chart.orange, ST.chart.green, ST.chart.indigo];

  const headSx = { fontWeight: 600, fontSize: 12, color: ST.colors.textSecondary, bgcolor: ST.colors.bg, borderBottom: `1px solid ${ST.colors.border}`, py: 1.5 };

  const statCards = [
    { label: "Total Users", value: stats?.total_users ?? 0, icon: <PeopleIcon sx={{ fontSize: 22 }} />, color: ST.colors.primary, bg: ST.colors.primaryLight },
    { label: "Active Users", value: stats?.active_users ?? 0, icon: <CheckCircleIcon sx={{ fontSize: 22 }} />, color: ST.colors.success, bg: ST.colors.successLight },
    { label: "Email Domains", value: domains.length, icon: <DnsIcon sx={{ fontSize: 22 }} />, color: ST.colors.info, bg: ST.colors.infoLight },
    { label: "Status", value: profile?.is_active ? "Active" : "Inactive", icon: <BusinessIcon sx={{ fontSize: 22 }} />, color: profile?.is_active ? ST.colors.success : ST.colors.error, bg: profile?.is_active ? ST.colors.successLight : ST.colors.errorLight },
  ];

  return (
    <InstitutionAdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
          Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>
          Welcome back, {user?.full_name} · {profile?.name || "Institution"}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError("")}>{error}</Alert>}

      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCards.map((c, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Box sx={{ bgcolor: c.bg, color: c.color, p: 1.25, borderRadius: 1.5, display: "flex" }}>{c.icon}</Box>
              </Box>
              <Typography variant="h4" fontWeight={800} sx={{ color: ST.colors.textPrimary, mb: 0.25 }}>{c.value}</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary }}>{c.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {/* Users by Role Chart */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={700} sx={{ mb: 2, color: ST.colors.textPrimary }}>Users by Role</Typography>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={roleChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={ST.colors.border} />
                <XAxis dataKey="role" tick={{ fontSize: 11, fill: ST.colors.textSecondary }} />
                <YAxis tick={{ fontSize: 11, fill: ST.colors.textSecondary }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${ST.colors.border}`, fontSize: 13 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {roleChartData.map((_, index) => (
                    <Cell key={index} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Users */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${ST.colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body1" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>Recent Users</Typography>
              <Button size="small" onClick={() => router.push("/institution/admin/users")} sx={{ textTransform: "none", color: ST.colors.primary, fontSize: 12 }}>View All</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headSx}>User</TableCell>
                    <TableCell sx={headSx}>Role</TableCell>
                    <TableCell sx={headSx}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.slice(0, 5).map((u, i) => (
                    <TableRow key={u.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: barColors[i % barColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white", fontWeight: 700, flexShrink: 0 }}>
                            {u.full_name?.charAt(0)}
                          </Box>
                          <Typography variant="body2" fontWeight={500} sx={{ fontSize: 13 }}>{u.full_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={u.role.replace(/_/g, " ")} size="small" sx={{ fontSize: 10, height: 20, bgcolor: ST.colors.primaryLight, color: ST.colors.primary, fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={u.is_active ? "Active" : "Inactive"} size="small" sx={{ fontSize: 10, height: 20, bgcolor: u.is_active ? ST.colors.successLight : ST.colors.bg, color: u.is_active ? ST.colors.success : ST.colors.textSecondary, fontWeight: 600 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4, color: ST.colors.textSecondary }}>No users yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Institution Info + Quick Actions */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={700} sx={{ mb: 2, color: ST.colors.textPrimary }}>Institution Details</Typography>
            <Grid container spacing={2}>
              {[
                { label: "Institution Name", value: profile?.name || "—" },
                { label: "Slug", value: profile?.slug ? <code style={{ background: ST.colors.bg, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>{profile.slug}</code> : "—" },
                { label: "Contact Email", value: profile?.contact_email || "—" },
                { label: "Domains Configured", value: domains.length },
              ].map((row) => (
                <Grid item xs={12} sm={6} key={row.label}>
                  <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block" }}>{row.label}</Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ color: ST.colors.textPrimary, mt: 0.25 }}>{row.value}</Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%" }}>
            <Typography variant="body1" fontWeight={700} sx={{ mb: 2, color: ST.colors.textPrimary }}>Quick Actions</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[
                { label: "Add New User", icon: <AddIcon sx={{ fontSize: 18 }} />, action: () => setUserDialogOpen(true), primary: true },
                { label: "Manage Users", icon: <PeopleIcon sx={{ fontSize: 18 }} />, action: () => router.push("/institution/admin/users") },
                { label: "Manage Domains", icon: <DnsIcon sx={{ fontSize: 18 }} />, action: () => router.push("/institution/admin/domains") },
                { label: "Institution Profile", icon: <BusinessIcon sx={{ fontSize: 18 }} />, action: () => router.push("/institution/admin/profile") },
              ].map((btn) => (
                <Button key={btn.label} onClick={btn.action} variant={btn.primary ? "contained" : "outlined"} startIcon={btn.icon} disableElevation
                  sx={{ textTransform: "none", fontWeight: 500, borderRadius: 1.5, justifyContent: "flex-start", px: 2,
                    ...(btn.primary ? { bgcolor: ST.colors.primary, "&:hover": { bgcolor: "#1e3a8a" } } : { borderColor: ST.colors.border, color: ST.colors.textPrimary }) }}>
                  {btn.label}
                </Button>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Create User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New User</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Full Name" value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} sx={{ mt: 1, mb: 2 }} />
          <TextField fullWidth label="Email" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            helperText={domains.length > 0 ? `Must match: ${domains.map((d) => `@${d.domain}`).join(", ")}` : ""} sx={{ mb: 2 }} />
          <TextField fullWidth label="Password" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth select label="Role" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
            {INSTITUTION_ROLES.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setUserDialogOpen(false)} sx={{ textTransform: "none", color: ST.colors.textSecondary }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateUser} disableElevation sx={{ textTransform: "none", bgcolor: ST.colors.primary, borderRadius: 1.5 }}>Create User</Button>
        </DialogActions>
      </Dialog>
    </InstitutionAdminLayout>
  );
}
