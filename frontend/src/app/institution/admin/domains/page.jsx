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
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import InstitutionAdminLayout from "@/components/InstitutionAdminLayout";

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
        <LinearProgress />
      </InstitutionAdminLayout>
    );
  }

  return (
    <InstitutionAdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Email Domains
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage authorized email domains for your institution
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Info Card */}
      <Card sx={{ mb: 3, bgcolor: "info.50", border: "1px solid", borderColor: "info.200" }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2 }}>
            <InfoIcon color="info" />
            <Box>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                About Email Domains
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Only users with email addresses matching these domains can sign up or be added to your institution. 
                Add your institution's official email domains to control access.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                    Total Domains
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {domains.length}
                  </Typography>
                </Box>
                <DomainIcon sx={{ fontSize: 40, color: "primary.main", opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                    Primary Domain
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {domains.find(d => d.is_primary)?.domain || "Not set"}
                  </Typography>
                </Box>
                <DomainIcon sx={{ fontSize: 40, color: "success.main", opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Domain Button */}
      <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add Domain
        </Button>
      </Box>

      {/* Domains Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Domain</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Added</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {domains.map((d) => (
              <TableRow key={d.id} hover>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DomainIcon fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight={500}>
                      @{d.domain}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {d.is_primary ? (
                    <Chip label="Primary" color="primary" size="small" />
                  ) : (
                    <Chip label="Secondary" variant="outlined" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(d.created_at).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedDomain(d);
                      setEditForm({ domain: d.domain, is_primary: d.is_primary });
                      setEditDialogOpen(true);
                    }}
                    title="Edit Domain"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setConfirmDialog({ open: true, domain: d })}
                    title="Delete Domain"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {domains.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No domains configured. Click 'Add Domain' to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, domain: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Domain?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete <strong>@{confirmDialog.domain?.domain}</strong>? 
            Users with this email domain will no longer be able to sign up.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, domain: null })}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteDomain}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Domain Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditForm({ domain: "", is_primary: false });
          setSelectedDomain(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Domain</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
            Enter the domain without the @ symbol (e.g., university.edu)
          </Alert>
          <TextField
            fullWidth
            label="Domain"
            placeholder="university.edu"
            value={editForm.domain}
            onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
            helperText="Users with this email domain can sign up"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Set as primary domain
            </Typography>
            <input
              type="checkbox"
              checked={editForm.is_primary}
              onChange={(e) => setEditForm({ ...editForm, is_primary: e.target.checked })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setEditForm({ domain: "", is_primary: false });
              setSelectedDomain(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdateDomain}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Domain Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Email Domain</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
            Enter the domain without the @ symbol (e.g., university.edu)
          </Alert>
          <TextField
            fullWidth
            label="Domain"
            placeholder="university.edu"
            value={domainForm.domain}
            onChange={(e) => setDomainForm({ ...domainForm, domain: e.target.value })}
            helperText="Users with this email domain can sign up"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Set as primary domain
            </Typography>
            <input
              type="checkbox"
              checked={domainForm.is_primary}
              onChange={(e) => setDomainForm({ ...domainForm, is_primary: e.target.checked })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddDomain}>
            Add Domain
          </Button>
        </DialogActions>
      </Dialog>
    </InstitutionAdminLayout>
  );
}
