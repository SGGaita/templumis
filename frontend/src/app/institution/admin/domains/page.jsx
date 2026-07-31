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
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import DomainIcon from "@mui/icons-material/Domain";
import InfoIcon from "@mui/icons-material/Info";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import InstitutionAdminLayout from "@/components/InstitutionAdminLayout";
import { ST } from "@/lib/staffTheme";

export default function DomainsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [domainForm, setDomainForm] = useState({ domain: "", is_primary: false });
  const [editForm, setEditForm] = useState({ domain: "", is_primary: false });
  const [error, setError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({ open: false, domain: null });

  const fetchDomains = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch("/institution/domains", { token });
      setDomains(data);
    } catch (err) {
      setError("Failed to fetch domains");
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
    fetchDomains();
  }, [user, authLoading, router, fetchDomains]);

  const handleAddDomain = async () => {
    try {
      await apiFetch("/institution/domains", {
        method: "POST",
        body: domainForm,
        token,
      });
      setDialogOpen(false);
      setDomainForm({ domain: "", is_primary: false });
      fetchDomains();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add domain");
    }
  };

  const handleUpdateDomain = async () => {
    if (!selectedDomain) return;
    try {
      await apiFetch(`/institution/domains/${selectedDomain.id}`, {
        method: "PATCH",
        body: editForm,
        token,
      });
      setEditDialogOpen(false);
      setEditForm({ domain: "", is_primary: false });
      setSelectedDomain(null);
      fetchDomains();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update domain");
    }
  };

  const handleDeleteDomain = async () => {
    if (!confirmDialog.domain) return;
    try {
      await apiFetch(`/institution/domains/${confirmDialog.domain.id}`, {
        method: "DELETE",
        token,
      });
      setConfirmDialog({ open: false, domain: null });
      fetchDomains();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete domain");
      setConfirmDialog({ open: false, domain: null });
    }
  };

  if (authLoading || loading) {
    return (
      <InstitutionAdminLayout>
        <LinearProgress sx={{ borderRadius: 1 }} />
      </InstitutionAdminLayout>
    );
  }

  const headSx = { fontWeight: 600, fontSize: 12, color: ST.colors.textSecondary, bgcolor: ST.colors.bg, borderBottom: `1px solid ${ST.colors.border}`, py: 1.5 };

  return (
    <InstitutionAdminLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>Email Domains</Typography>
          <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>Manage authorized email domains for your institution</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} disableElevation
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5, bgcolor: ST.colors.primary, "&:hover": { bgcolor: "#1e3a8a" } }}>
          Add Domain
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError("")}>{error}</Alert>}

      {/* Info banner */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: ST.colors.infoLight, border: `1px solid #BAE6FD`, borderRadius: 2, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
        <InfoIcon sx={{ color: ST.colors.info, fontSize: 20, mt: 0.25 }} />
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.info }}>About Email Domains</Typography>
          <Typography variant="body2" sx={{ color: "#0369A1", mt: 0.25 }}>
            Only users with email addresses matching these domains can sign up or be added to your institution.
          </Typography>
        </Box>
      </Paper>

      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Box sx={{ bgcolor: ST.colors.primaryLight, color: ST.colors.primary, p: 1.25, borderRadius: 1.5, display: "inline-flex", mb: 1.5 }}>
              <DomainIcon sx={{ fontSize: 22 }} />
            </Box>
            <Typography variant="h4" fontWeight={800} sx={{ color: ST.colors.textPrimary }}>{domains.length}</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary }}>Total Domains</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Box sx={{ bgcolor: ST.colors.successLight, color: ST.colors.success, p: 1.25, borderRadius: 1.5, display: "inline-flex", mb: 1.5 }}>
              <DomainIcon sx={{ fontSize: 22 }} />
            </Box>
            <Typography variant="body1" fontWeight={800} sx={{ color: ST.colors.textPrimary }}>
              {domains.find(d => d.is_primary)?.domain ? `@${domains.find(d => d.is_primary).domain}` : "Not set"}
            </Typography>
            <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary }}>Primary Domain</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Domains Table */}
      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={headSx}>Domain</TableCell>
                <TableCell sx={headSx}>Type</TableCell>
                <TableCell sx={headSx}>Added</TableCell>
                <TableCell sx={{ ...headSx, width: 100 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {domains.map((d) => (
                <TableRow key={d.id} hover sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "#F8FAFF" } }}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ bgcolor: ST.colors.primaryLight, color: ST.colors.primary, p: 0.75, borderRadius: 1, display: "flex" }}>
                        <DomainIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13, color: ST.colors.textPrimary }}>@{d.domain}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={d.is_primary ? "Primary" : "Secondary"} size="small"
                      sx={{ fontSize: 11, fontWeight: 600, height: 22,
                        bgcolor: d.is_primary ? ST.colors.primaryLight : ST.colors.bg,
                        color: d.is_primary ? ST.colors.primary : ST.colors.textSecondary }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: ST.colors.textSecondary }}>
                    {new Date(d.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" sx={{ color: ST.colors.textSecondary }} onClick={() => { setSelectedDomain(d); setEditForm({ domain: d.domain, is_primary: d.is_primary }); setEditDialogOpen(true); }}>
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" sx={{ color: ST.colors.error }} onClick={() => setConfirmDialog({ open: true, domain: d })}>
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {domains.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: ST.colors.textSecondary }}>
                    No domains configured. Click 'Add Domain' to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, domain: null })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Domain?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Are you sure you want to delete <strong>@{confirmDialog.domain?.domain}</strong>? Users with this email domain will no longer be able to sign up.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setConfirmDialog({ open: false, domain: null })} sx={{ textTransform: "none", color: ST.colors.textSecondary }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteDomain} disableElevation sx={{ textTransform: "none", borderRadius: 1.5 }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {[{ open: editDialogOpen, title: "Edit Domain", form: editForm, setForm: setEditForm, onSave: handleUpdateDomain, onClose: () => { setEditDialogOpen(false); setEditForm({ domain: "", is_primary: false }); setSelectedDomain(null); } },
        { open: dialogOpen, title: "Add Email Domain", form: domainForm, setForm: setDomainForm, onSave: handleAddDomain, onClose: () => setDialogOpen(false) }]
        .map(({ open, title, form, setForm, onSave, onClose }) => (
          <Dialog key={title} open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
            <DialogContent>
              <TextField fullWidth label="Domain" placeholder="university.edu" value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                helperText="Enter without the @ symbol. Users with this domain can sign up." sx={{ mt: 1, mb: 2 }} />
              <FormControlLabel label={<Typography variant="body2">Set as primary domain</Typography>}
                control={<Switch checked={form.is_primary} onChange={(e) => setForm({ ...form, is_primary: e.target.checked })} size="small" />} />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button onClick={onClose} sx={{ textTransform: "none", color: ST.colors.textSecondary }}>Cancel</Button>
              <Button variant="contained" onClick={onSave} disableElevation sx={{ textTransform: "none", bgcolor: ST.colors.primary, borderRadius: 1.5 }}>Save</Button>
            </DialogActions>
          </Dialog>
        ))}
    </InstitutionAdminLayout>
  );
}
