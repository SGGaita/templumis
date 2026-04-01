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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import InstitutionAdminLayout from "@/components/InstitutionAdminLayout";

const INSTITUTION_ROLES = [
  { value: "vice_chancellor", label: "Vice Chancellor" },
  { value: "registrar", label: "Registrar" },
  { value: "scholarship_office", label: "Scholarship Office" },
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
        <LinearProgress />
      </InstitutionAdminLayout>
    );
  }

  if (!user || user.role !== "institution_admin") {
    return null;
  }

  const usersByRole = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const roleChartData = Object.entries(usersByRole).map(([role, count]) => ({
    role: role.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    count,
  }));

  return (
    <InstitutionAdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back, {user?.full_name}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
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
                    {stats?.total_users ?? 0}
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
                    {stats?.active_users ?? 0}
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
                    Domains
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {domains.length}
                  </Typography>
                </Box>
                <DnsIcon sx={{ fontSize: 40, color: "info.main", opacity: 0.3 }} />
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
                    Institution
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {profile?.is_active ? "Active" : "Inactive"}
                  </Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 40, color: "secondary.main", opacity: 0.3 }} />
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
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={roleChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1976d2" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Users */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 1.5 }}>
              Recent Users
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.slice(0, 5).map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{u.full_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.role.replace(/_/g, " ")}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.is_active ? "Active" : "Inactive"}
                          color={u.is_active ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          No users yet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setUserDialogOpen(true)}>
                Add User
              </Button>
              <Button variant="outlined" startIcon={<PeopleIcon />} onClick={() => router.push("/institution/admin/users")}>
                Manage Users
              </Button>
              <Button variant="outlined" startIcon={<DnsIcon />} onClick={() => router.push("/institution/admin/domains")}>
                Manage Domains
              </Button>
              <Button variant="outlined" startIcon={<BusinessIcon />} onClick={() => router.push("/institution/admin/profile")}>
                View Profile
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Institution Info */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
              Institution Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography variant="body1" fontWeight={500}>{profile?.name}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Slug</Typography>
                  <Typography variant="body1" fontWeight={500}><code>{profile?.slug}</code></Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Contact Email</Typography>
                  <Typography variant="body1" fontWeight={500}>{profile?.contact_email || "—"}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Domains Configured</Typography>
                  <Typography variant="body1" fontWeight={500}>{domains.length}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Create User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add User</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Full Name"
            value={userForm.full_name}
            onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            helperText={domains.length > 0 ? `Must match: ${domains.map((d) => `@${d.domain}`).join(", ")}` : ""}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Role"
            value={userForm.role}
            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
          >
            {INSTITUTION_ROLES.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateUser}>
            Create User
          </Button>
        </DialogActions>
      </Dialog>
    </InstitutionAdminLayout>
  );
}
