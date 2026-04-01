"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
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
import Button from "@mui/material/Button";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import Alert from "@mui/material/Alert";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import GlobalAdminLayout from "@/components/GlobalAdminLayout";

export default function UsersPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInstitution, setFilterInstitution] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUser, setMenuUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "" });
  const [error, setError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({ open: false, user: null });

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const institutionsData = await apiFetch("/global-admin/institutions", { token });
      setInstitutions(institutionsData);
      
      const allAdmins = [];
      for (const inst of institutionsData) {
        const instUsers = await apiFetch(`/global-admin/institutions/${inst.id}/users`, { token }).catch(() => []);
        const admins = instUsers.filter(u => u.role === "institution_admin");
        allAdmins.push(...admins.map(u => ({ ...u, institution_name: inst.name })));
      }
      setUsers(allAdmins);
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

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInstitution = filterInstitution === "all" || u.institution_id === parseInt(filterInstitution);
    return matchesSearch && matchesInstitution;
  });

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await apiFetch(`/institution-admin/users/${selectedUser.id}`, {
        method: "PATCH",
        body: editForm,
        token,
      });
      setEditDialogOpen(false);
      setEditForm({ full_name: "", email: "" });
      setSelectedUser(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await apiFetch(`/institution-admin/users/${user.id}/${user.is_active ? 'deactivate' : 'activate'}`, {
        method: "POST",
        token,
      });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${user.is_active ? 'deactivate' : 'activate'} user`);
    }
  };

  const handleDelete = async () => {
    if (!confirmDialog.user) return;
    try {
      await apiFetch(`/institution-admin/users/${confirmDialog.user.id}`, {
        method: "DELETE",
        token,
      });
      setConfirmDialog({ open: false, user: null });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
      setConfirmDialog({ open: false, user: null });
    }
  };

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
          Institution Admins
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage institution administrators
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            placeholder="Search admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 250 }}
          />
          <TextField
            select
            label="Institution"
            value={filterInstitution}
            onChange={(e) => setFilterInstitution(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">All Institutions</MenuItem>
            {institutions.map((inst) => (
              <MenuItem key={inst.id} value={inst.id}>
                {inst.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Institution</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>{u.full_name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{u.institution_name || "—"}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={u.is_active ? "Active" : "Inactive"}
                    color={u.is_active ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, u)}
                    title="More Actions"
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {paginatedUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {users.length === 0 ? "No institution admins found." : "No admins match your filters."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </TableContainer>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setSelectedUser(menuUser);
            setEditForm({
              full_name: menuUser.full_name,
              email: menuUser.email,
            });
            setEditDialogOpen(true);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleToggleActive(menuUser);
          }}
        >
          {menuUser?.is_active ? (
            <>
              <BlockIcon fontSize="small" sx={{ mr: 1 }} />
              Deactivate
            </>
          ) : (
            <>
              <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
              Activate
            </>
          )}
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setConfirmDialog({ open: true, user: menuUser });
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, user: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete User?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete <strong>{confirmDialog.user?.full_name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, user: null })}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditForm({ full_name: "", email: "" });
          setSelectedUser(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Institution Admin</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Full Name"
            value={editForm.full_name}
            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            disabled
            helperText="Email cannot be changed"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setEditForm({ full_name: "", email: "" });
              setSelectedUser(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdateUser}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </GlobalAdminLayout>
  );
}
