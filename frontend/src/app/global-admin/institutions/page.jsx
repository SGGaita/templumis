"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
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
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import Menu from "@mui/material/Menu";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import TablePagination from "@mui/material/TablePagination";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DomainAddIcon from "@mui/icons-material/DomainAdd";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Autocomplete from "@mui/material/Autocomplete";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import GlobalAdminLayout from "@/components/GlobalAdminLayout";
import InstitutionModulesPanel from "@/components/InstitutionModulesPanel";
import { useLanguage } from "@/lib/language-context";

export default function InstitutionsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const L = t.globalAdmin.institutions;
  const { user, token, loading: authLoading } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [domainDialogOpen, setDomainDialogOpen] = useState(false);
  const [selectedInst, setSelectedInst] = useState(null);
  const [formData, setFormData] = useState({ name: "", slug: "", contact_email: "" });
  const [adminForm, setAdminForm] = useState({ email: "", full_name: "", password: "" });
  const [domainForm, setDomainForm] = useState({ domain: "", is_primary: false });
  const [expandedRow, setExpandedRow] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuInst, setMenuInst] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, institution: null });

  const fetchInstitutions = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch("/global-admin/institutions", { token });
      setInstitutions(data);
    } catch (err) {
      setError(L.fetchError);
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
    fetchInstitutions();
  }, [user, authLoading, router, fetchInstitutions]);

  const handleCreateInstitution = async () => {
    try {
      await apiFetch("/global-admin/institutions", {
        method: "POST",
        body: formData,
        token,
      });
      setDialogOpen(false);
      setFormData({ name: "", slug: "", contact_email: "" });
      fetchInstitutions();
    } catch (err) {
      setError(err instanceof Error ? err.message : L.createError);
    }
  };

  const handleUpdateInstitution = async () => {
    if (!selectedInst) return;
    try {
      await apiFetch(`/global-admin/institutions/${selectedInst.id}`, {
        method: "PATCH",
        body: formData,
        token,
      });
      setEditDialogOpen(false);
      setFormData({ name: "", slug: "", contact_email: "" });
      setSelectedInst(null);
      fetchInstitutions();
    } catch (err) {
      setError(err instanceof Error ? err.message : L.updateError);
    }
  };

  const handleCreateAdmin = async () => {
    if (!selectedInst) return;
    try {
      await apiFetch(`/global-admin/institutions/${selectedInst.id}/admins`, {
        method: "POST",
        body: adminForm,
        token,
      });
      setAdminDialogOpen(false);
      setAdminForm({ email: "", full_name: "", password: "" });
      setSelectedInst(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : L.createAdminError);
    }
  };

  const handleAddDomain = async () => {
    if (!selectedInst) return;
    try {
      await apiFetch(`/global-admin/institutions/${selectedInst.id}/domains`, {
        method: "POST",
        body: domainForm,
        token,
      });
      setDomainDialogOpen(false);
      setDomainForm({ domain: "", is_primary: false });
      setSelectedInst(null);
      fetchInstitutions();
    } catch (err) {
      setError(err instanceof Error ? err.message : L.addDomainError);
    }
  };

  const handleExpandRow = (institutionId) => {
    setExpandedRow((current) => (current === institutionId ? null : institutionId));
  };

  const handleMenuOpen = (event, inst) => {
    setAnchorEl(event.currentTarget);
    setMenuInst(inst);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuInst(null);
  };

  const handleDeactivate = async () => {
    if (!confirmDialog.institution) return;
    try {
      await apiFetch(`/global-admin/institutions/${confirmDialog.institution.id}/deactivate`, {
        method: "POST",
        token,
      });
      setConfirmDialog({ open: false, type: null, institution: null });
      fetchInstitutions();
    } catch (err) {
      setError(err instanceof Error ? err.message : L.deactivateError);
    }
  };

  const handleActivate = async (inst) => {
    try {
      await apiFetch(`/global-admin/institutions/${inst.id}/activate`, {
        method: "POST",
        token,
      });
      fetchInstitutions();
    } catch (err) {
      setError(err instanceof Error ? err.message : L.activateError);
    }
  };

  const handleDelete = async () => {
    if (!confirmDialog.institution) return;
    try {
      await apiFetch(`/global-admin/institutions/${confirmDialog.institution.id}`, {
        method: "DELETE",
        token,
      });
      setConfirmDialog({ open: false, type: null, institution: null });
      fetchInstitutions();
    } catch (err) {
      setError(err instanceof Error ? err.message : L.deleteError);
    }
  };

  const filteredInstitutions = institutions.filter((inst) => {
    const matchesSearch = inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inst.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && inst.is_active) ||
                         (filterStatus === "inactive" && !inst.is_active);
    return matchesSearch && matchesStatus;
  });

  const paginatedInstitutions = filteredInstitutions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (authLoading || loading) {
    return (
      <GlobalAdminLayout>
        <LinearProgress />
      </GlobalAdminLayout>
    );
  }

  return (
    <GlobalAdminLayout>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            {L.pageTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {L.subtitle}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          size="small"
        >
          {L.createBtn}
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            placeholder={L.searchPlaceholder}
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
            label={t.common.status}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">{L.allStatus}</MenuItem>
            <MenuItem value="active">{t.common.active}</MenuItem>
            <MenuItem value="inactive">{t.common.inactive}</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 50 }} />
              <TableCell>{L.table.name}</TableCell>
              <TableCell>{L.table.slug}</TableCell>
              <TableCell>{L.table.domains}</TableCell>
              <TableCell>{L.table.contact}</TableCell>
              <TableCell>{t.common.status}</TableCell>
              <TableCell align="right">{t.common.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedInstitutions.map((inst) => (
              <Fragment key={inst.id}>
              <TableRow hover sx={{ "& > *": { borderBottom: "unset" } }}>
                <TableCell>
                  <IconButton size="small" onClick={() => handleExpandRow(inst.id)}>
                    {expandedRow === inst.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                  </IconButton>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>{inst.name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                    {inst.slug}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {inst.domains?.map((d) => (
                      <Chip
                        key={d.id}
                        label={d.domain}
                        size="small"
                        color={d.is_primary ? "primary" : "default"}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>{inst.contact_email || "—"}</TableCell>
                <TableCell>
                  <Chip
                    label={inst.is_active ? t.common.active : t.common.inactive}
                    color={inst.is_active ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedInst(inst);
                      setDomainDialogOpen(true);
                    }}
                    title={L.actionMenu.addDomain}
                  >
                    <DomainAddIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedInst(inst);
                      setAdminDialogOpen(true);
                    }}
                    title={L.actionMenu.addAdmin}
                  >
                    <PersonAddIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, inst)}
                    title={L.actionMenu.more}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                  <Collapse in={expandedRow === inst.id} timeout="auto" unmountOnExit>
                    <InstitutionModulesPanel
                      institution={inst}
                      token={token}
                      onUpdated={(updated) => {
                        setInstitutions((prev) =>
                          prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row))
                        );
                      }}
                      onError={setError}
                    />
                  </Collapse>
                </TableCell>
              </TableRow>
              </Fragment>
            ))}
            {paginatedInstitutions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {institutions.length === 0 ? L.empty : L.noMatch}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredInstitutions.length}
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
            setSelectedInst(menuInst);
            setFormData({
              name: menuInst.name,
              slug: menuInst.slug,
              contact_email: menuInst.contact_email || "",
            });
            setEditDialogOpen(true);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          {t.common.edit}
        </MenuItem>
        {menuInst?.is_active ? (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              setConfirmDialog({ open: true, type: "deactivate", institution: menuInst });
            }}
          >
            <BlockIcon fontSize="small" sx={{ mr: 1 }} />
            {L.actionMenu.deactivate}
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              handleActivate(menuInst);
            }}
          >
            <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
            {L.actionMenu.activate}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setConfirmDialog({ open: true, type: "delete", institution: menuInst });
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t.common.delete}
        </MenuItem>
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: null, institution: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {confirmDialog.type === "delete" ? L.confirmDeleteTitle : L.confirmDeactivateTitle}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {confirmDialog.type === "delete"
              ? L.confirmDelete.replace("{name}", confirmDialog.institution?.name || "")
              : L.confirmDeactivate.replace("{name}", confirmDialog.institution?.name || "")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, type: null, institution: null })}>
            {t.common.cancel}
          </Button>
          <Button
            variant="contained"
            color={confirmDialog.type === "delete" ? "error" : "warning"}
            onClick={confirmDialog.type === "delete" ? handleDelete : handleDeactivate}
          >
            {confirmDialog.type === "delete" ? t.common.delete : L.actionMenu.deactivate}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Institution Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setFormData({ name: "", slug: "", contact_email: "" });
          setSelectedInst(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{L.editTitle}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={L.fields.name}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label={L.fields.slug}
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            helperText={L.fields.slugHelper}
            sx={{ mb: 2 }}
            disabled
          />
          <TextField
            fullWidth
            label={L.fields.contactEmail}
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setFormData({ name: "", slug: "", contact_email: "" });
              setSelectedInst(null);
            }}
          >
            {t.common.cancel}
          </Button>
          <Button variant="contained" onClick={handleUpdateInstitution}>
            {t.common.update}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Institution Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{L.createTitle}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={L.fields.name}
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
              setFormData({ ...formData, name, slug });
            }}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label={L.fields.slugCreateLabel}
            value={formData.slug}
            onChange={(e) =>
              setFormData({
                ...formData,
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
              })
            }
            helperText={L.fields.slugCreateHelper}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={L.fields.contactEmail}
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t.common.cancel}</Button>
          <Button variant="contained" onClick={handleCreateInstitution}>
            {t.common.create}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Admin Dialog */}
      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{L.createAdminTitle.replace("{name}", selectedInst?.name || "")}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={L.fields.fullName}
            value={adminForm.full_name}
            onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <Autocomplete
            freeSolo
            options={
              selectedInst?.domains?.map((d) => {
                const emailPrefix = adminForm.email.includes('@') 
                  ? adminForm.email.split('@')[0] 
                  : adminForm.email;
                return emailPrefix ? `${emailPrefix}@${d.domain}` : `@${d.domain}`;
              }) || []
            }
            value={adminForm.email}
            onInputChange={(event, newValue) => {
              setAdminForm({ ...adminForm, email: newValue });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                label={t.common.email}
                type="email"
                helperText={selectedInst?.domains?.length > 0 
                  ? L.availableDomains.replace("{domains}", selectedInst.domains.map(d => d.domain).join(', ')) 
                  : L.noDomains}
                sx={{ mb: 2 }}
              />
            )}
          />
          <TextField
            fullWidth
            label={L.fields.password}
            type="password"
            value={adminForm.password}
            onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminDialogOpen(false)}>{t.common.cancel}</Button>
          <Button variant="contained" onClick={handleCreateAdmin}>
            {L.createAdminBtn}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Domain Dialog */}
      <Dialog open={domainDialogOpen} onClose={() => setDomainDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{L.addDomainTitle.replace("{name}", selectedInst?.name || "")}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={L.fields.domain}
            placeholder={L.fields.domainPlaceholder}
            value={domainForm.domain}
            onChange={(e) => setDomainForm({ ...domainForm, domain: e.target.value })}
            helperText={L.fields.domainHelper}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDomainDialogOpen(false)}>{t.common.cancel}</Button>
          <Button variant="contained" onClick={handleAddDomain}>
            {L.addDomainBtn}
          </Button>
        </DialogActions>
      </Dialog>
    </GlobalAdminLayout>
  );
}
