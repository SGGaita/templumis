"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import LinearProgress from "@mui/material/LinearProgress";
import TablePagination from "@mui/material/TablePagination";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import LockResetIcon from "@mui/icons-material/LockReset";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import InstitutionAdminLayout from "@/components/InstitutionAdminLayout";
import { ST } from "@/lib/staffTheme";
import { useLanguage } from "@/lib/language-context";

const ROLE_VALUES = [
  "vice_chancellor",
  "registrar",
  "scholarship_office",
  "student",
  "student_services",
  "research_office",
];

export default function UsersPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const L = t.institutionAdmin.users;
  const [users, setUsers] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUser, setMenuUser] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createForm, setCreateForm] = useState({ email: "", full_name: "", password: "", role: "student" });
  const [editForm, setEditForm] = useState({ full_name: "", role: "" });
  const [passwordForm, setPasswordForm] = useState({ password: "", confirm: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({ open: false, user: null });

  const roleLabel = (role) => L.roles?.[role] || role;

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [usersData, domainsData] = await Promise.all([
        apiFetch("/institution/users", { token }),
        apiFetch("/institution/domains", { token }),
      ]);
      setUsers(usersData);
      setDomains(domainsData);
    } catch (err) {
      setError(L.fetchError);
    } finally {
      setLoading(false);
    }
  }, [token, L.fetchError]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "institution_admin") {
      router.push("/institution/login");
      return;
    }
    fetchData();
  }, [user, authLoading, router, fetchData]);

  const handleMenuOpen = (event, u) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(u);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const handleCreateUser = async () => {
    try {
      await apiFetch("/institution/users", {
        method: "POST",
        body: createForm,
        token,
      });
      setCreateDialogOpen(false);
      setCreateForm({ email: "", full_name: "", password: "", role: "student" });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : L.createError);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await apiFetch(`/institution/users/${selectedUser.id}`, {
        method: "PATCH",
        body: editForm,
        token,
      });
      setEditDialogOpen(false);
      setEditForm({ full_name: "", role: "" });
      setSelectedUser(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : L.updateError);
    }
  };

  const closePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setPasswordForm({ password: "", confirm: "" });
    setSelectedUser(null);
    setPasswordSaving(false);
  };

  const passwordFormError = (() => {
    if (!passwordForm.password && !passwordForm.confirm) return "";
    if (passwordForm.password.length < 8) return L.passwordTooShort;
    if (passwordForm.confirm && passwordForm.password !== passwordForm.confirm) {
      return L.passwordsNoMatch;
    }
    return "";
  })();

  const handleChangePassword = async () => {
    if (!selectedUser) return;
    if (passwordForm.password.length < 8) {
      setError(L.passwordTooShort);
      return;
    }
    if (passwordForm.password !== passwordForm.confirm) {
      setError(L.passwordsNoMatch);
      return;
    }
    setPasswordSaving(true);
    setError("");
    try {
      await apiFetch(`/institution/users/${selectedUser.id}/password`, {
        method: "PATCH",
        body: { password: passwordForm.password },
        token,
      });
      closePasswordDialog();
      setSuccess(L.passwordUpdated);
    } catch (err) {
      setError(err instanceof Error ? err.message : L.passwordError);
      setPasswordSaving(false);
    }
  };

  const handleToggleActive = async (u) => {
    const action = u.is_active ? "deactivate" : "activate";
    try {
      await apiFetch(`/institution/users/${u.id}/${action}`, {
        method: "PATCH",
        token,
      });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : (u.is_active ? L.deactivateError : L.activateError));
    }
  };

  const handleDelete = async () => {
    if (!confirmDialog.user) return;
    try {
      await apiFetch(`/institution/users/${confirmDialog.user.id}`, {
        method: "DELETE",
        token,
      });
      setConfirmDialog({ open: false, user: null });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : L.deleteError);
      setConfirmDialog({ open: false, user: null });
    }
  };

  if (authLoading || loading) {
    return (
      <InstitutionAdminLayout>
        <LinearProgress sx={{ borderRadius: 1 }} />
      </InstitutionAdminLayout>
    );
  }

  const roleColors = {
    vice_chancellor: { bg: "#EDE9FE", color: "#7C3AED" },
    registrar: { bg: ST.colors.primaryLight, color: ST.colors.primary },
    scholarship_office: { bg: "#FEF3C7", color: "#D97706" },
    student: { bg: ST.colors.successLight, color: ST.colors.success },
    student_services: { bg: "#E0F2FE", color: "#0284C7" },
    research_office: { bg: "#CCFBF1", color: "#0F766E" },
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const headSx = { fontWeight: 600, fontSize: 12, color: ST.colors.textSecondary, bgcolor: ST.colors.bg, borderBottom: `1px solid ${ST.colors.border}`, py: 1.5 };

  return (
    <InstitutionAdminLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>{L.title}</Typography>
          <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>
            {L.subtitle.replace("{count}", String(users.length))}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)} disableElevation
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5, bgcolor: ST.colors.primary, "&:hover": { bgcolor: "#1e3a8a" } }}>
          {L.createBtn}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setSuccess("")}>{success}</Alert>}

      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${ST.colors.border}`, display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <TextField placeholder={L.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small"
            sx={{ width: 260, "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: 13 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: ST.colors.textSecondary }} /></InputAdornment> }} />
          <TextField select label={L.table.role} value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(0); }} size="small"
            sx={{ minWidth: 180, "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: 13 } }}>
            <MenuItem value="all">{L.allRoles}</MenuItem>
            {ROLE_VALUES.map((r) => <MenuItem key={r} value={r}>{roleLabel(r)}</MenuItem>)}
          </TextField>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={headSx}>{L.userColumn}</TableCell>
                <TableCell sx={headSx}>{L.table.email}</TableCell>
                <TableCell sx={headSx}>{L.table.role}</TableCell>
                <TableCell sx={headSx}>{L.table.status}</TableCell>
                <TableCell sx={{ ...headSx, width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((u) => {
                const rc = roleColors[u.role] || { bg: ST.colors.bg, color: ST.colors.textSecondary };
                return (
                  <TableRow key={u.id} hover sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "#F8FAFF" } }}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: rc.color }}>{u.full_name?.charAt(0)}</Avatar>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13, color: ST.colors.textPrimary }}>{u.full_name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: ST.colors.textSecondary }}>{u.email}</TableCell>
                    <TableCell>
                      <Chip label={roleLabel(u.role)} size="small"
                        sx={{ fontSize: 11, fontWeight: 600, height: 22, bgcolor: rc.bg, color: rc.color }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={u.is_active ? t.common.active : t.common.inactive} size="small"
                        sx={{ fontSize: 11, fontWeight: 600, height: 22, bgcolor: u.is_active ? ST.colors.successLight : ST.colors.bg, color: u.is_active ? ST.colors.success : ST.colors.textSecondary }} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={L.moreActions}>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, u)}>
                          <MoreVertIcon sx={{ fontSize: 18, color: ST.colors.textSecondary }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: ST.colors.textSecondary }}>
                    {users.length === 0 ? L.empty : L.noMatch}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filteredUsers.length} page={page} onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]} sx={{ borderTop: `1px solid ${ST.colors.border}` }} />
      </Paper>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}
        PaperProps={{ elevation: 2, sx: { borderRadius: 2, border: `1px solid ${ST.colors.border}`, minWidth: 180 } }}>
        <MenuItem sx={{ gap: 1.5, fontSize: 14 }} onClick={() => { handleMenuClose(); setSelectedUser(menuUser); setEditForm({ full_name: menuUser.full_name, role: menuUser.role }); setEditDialogOpen(true); }}>
          <EditIcon fontSize="small" sx={{ color: ST.colors.textSecondary }} /> {L.editUser}
        </MenuItem>
        <MenuItem sx={{ gap: 1.5, fontSize: 14 }} onClick={() => {
          handleMenuClose();
          setSelectedUser(menuUser);
          setPasswordForm({ password: "", confirm: "" });
          setPasswordDialogOpen(true);
        }}>
          <LockResetIcon fontSize="small" sx={{ color: ST.colors.textSecondary }} /> {L.changePassword}
        </MenuItem>
        <MenuItem sx={{ gap: 1.5, fontSize: 14 }} onClick={() => { handleMenuClose(); handleToggleActive(menuUser); }}>
          {menuUser?.is_active
            ? <><BlockIcon fontSize="small" sx={{ color: ST.colors.warning }} /> {L.deactivate}</>
            : <><CheckCircleIcon fontSize="small" sx={{ color: ST.colors.success }} /> {L.activate}</>}
        </MenuItem>
        <Divider />
        <MenuItem sx={{ gap: 1.5, fontSize: 14, color: ST.colors.error }} onClick={() => { handleMenuClose(); setConfirmDialog({ open: true, user: menuUser }); }}>
          <DeleteIcon fontSize="small" /> {t.common.delete}
        </MenuItem>
      </Menu>

      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, user: null })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{L.deleteTitle}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{L.deleteConfirm.replace("{name}", confirmDialog.user?.full_name || "")}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setConfirmDialog({ open: false, user: null })} sx={{ textTransform: "none", color: ST.colors.textSecondary }}>{t.common.cancel}</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disableElevation sx={{ textTransform: "none", borderRadius: 1.5 }}>{t.common.delete}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{L.createTitle}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label={L.fullName} value={createForm.full_name} onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} sx={{ mt: 1, mb: 2 }} />
          <TextField fullWidth label={t.common.email} type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            helperText={domains.length > 0 ? L.emailMustMatch.replace("{domains}", domains.map((d) => `@${d.domain}`).join(", ")) : ""} sx={{ mb: 2 }} />
          <TextField fullWidth label={L.password} type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            helperText={L.passwordHelper} sx={{ mb: 2 }} />
          <TextField fullWidth select label={L.table.role} value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}>
            {ROLE_VALUES.map((r) => <MenuItem key={r} value={r}>{roleLabel(r)}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ textTransform: "none", color: ST.colors.textSecondary }}>{t.common.cancel}</Button>
          <Button variant="contained" onClick={handleCreateUser} disableElevation sx={{ textTransform: "none", bgcolor: ST.colors.primary, borderRadius: 1.5 }}>{L.createUserBtn}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => { setEditDialogOpen(false); setEditForm({ full_name: "", role: "" }); setSelectedUser(null); }}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{L.editTitle}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label={L.fullName} value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} sx={{ mt: 1, mb: 2 }} />
          <TextField fullWidth select label={L.table.role} value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
            {ROLE_VALUES.map((r) => <MenuItem key={r} value={r}>{roleLabel(r)}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => { setEditDialogOpen(false); setEditForm({ full_name: "", role: "" }); setSelectedUser(null); }} sx={{ textTransform: "none", color: ST.colors.textSecondary }}>{t.common.cancel}</Button>
          <Button variant="contained" onClick={handleUpdateUser} disableElevation sx={{ textTransform: "none", bgcolor: ST.colors.primary, borderRadius: 1.5 }}>{t.common.update}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={passwordDialogOpen} onClose={closePasswordDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{L.changePasswordTitle}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mb: 2 }}>
            {L.changePasswordFor.replace("{name}", selectedUser?.full_name || "")}
          </Typography>
          <TextField
            fullWidth
            autoFocus
            label={L.newPassword}
            type="password"
            value={passwordForm.password}
            onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
            helperText={L.passwordHelper}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={L.confirmPassword}
            type="password"
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
            error={Boolean(passwordFormError)}
            helperText={passwordFormError || " "}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !passwordFormError && passwordForm.password && passwordForm.confirm) {
                handleChangePassword();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={closePasswordDialog} sx={{ textTransform: "none", color: ST.colors.textSecondary }}>{t.common.cancel}</Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={passwordSaving || !passwordForm.password || !passwordForm.confirm || Boolean(passwordFormError)}
            disableElevation
            sx={{ textTransform: "none", bgcolor: ST.colors.primary, borderRadius: 1.5 }}
          >
            {L.savePassword}
          </Button>
        </DialogActions>
      </Dialog>
    </InstitutionAdminLayout>
  );
}
