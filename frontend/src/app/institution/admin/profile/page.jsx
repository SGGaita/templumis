"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import EditIcon from "@mui/icons-material/Edit";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import InstitutionAdminLayout from "@/components/InstitutionAdminLayout";
import { ST } from "@/lib/staffTheme";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", contact_email: "", address: "" });
  const [error, setError] = useState("");

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch("/institution/profile", { token });
      setProfile(data);
    } catch (err) {
      setError("Failed to fetch profile");
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
    fetchProfile();
  }, [user, authLoading, router, fetchProfile]);

  const handleUpdateProfile = async () => {
    try {
      await apiFetch("/institution/profile", {
        method: "PATCH",
        body: editForm,
        token,
      });
      setEditDialogOpen(false);
      fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  if (authLoading || loading) {
    return (
      <InstitutionAdminLayout>
        <LinearProgress sx={{ borderRadius: 1 }} />
      </InstitutionAdminLayout>
    );
  }

  return (
    <InstitutionAdminLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>Institution Profile</Typography>
          <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>View and manage your institution information</Typography>
        </Box>
        <Button variant="contained" startIcon={<EditIcon />} disableElevation
          onClick={() => { setEditForm({ name: profile?.name || "", contact_email: profile?.contact_email || "", address: profile?.address || "" }); setEditDialogOpen(true); }}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5, bgcolor: ST.colors.primary, "&:hover": { bgcolor: "#1e3a8a" } }}>
          Edit Profile
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError("")}>{error}</Alert>}

      {/* Hero banner */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, overflow: "hidden", border: `1px solid ${ST.colors.border}` }}>
        <Box sx={{ background: `linear-gradient(135deg, ${ST.colors.primary} 0%, #0891b2 100%)`, p: 3.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
            <Box sx={{ width: 72, height: 72, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BusinessIcon sx={{ fontSize: 38, color: "white" }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: "white", mb: 0.5 }}>{profile?.name || "—"}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <code style={{ background: "rgba(255,255,255,0.15)", color: "white", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>{profile?.slug}</code>
                <Chip label={profile?.is_active ? "Active" : "Inactive"}
                  icon={<CheckCircleIcon sx={{ color: "white !important", fontSize: "14px !important" }} />}
                  sx={{ bgcolor: profile?.is_active ? "rgba(16,185,129,0.85)" : "rgba(100,116,139,0.85)", color: "white", fontWeight: 600, fontSize: 12, height: 24 }} />
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {[
              { icon: <EmailIcon sx={{ fontSize: 20, color: ST.colors.primary }} />, label: "Contact Email", value: profile?.contact_email || "Not set" },
              { icon: <CalendarTodayIcon sx={{ fontSize: 20, color: ST.colors.info }} />, label: "Created On", value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
              { icon: <LocationOnIcon sx={{ fontSize: 20, color: ST.colors.warning }} />, label: "Address", value: profile?.address || "Not set" },
            ].map((row) => (
              <Grid item xs={12} md={4} key={row.label}>
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <Box sx={{ mt: 0.25 }}>{row.icon}</Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block" }}>{row.label}</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary, mt: 0.25 }}>{row.value}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>

      {/* Domains */}
      <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <EmailIcon sx={{ color: ST.colors.primary, fontSize: 20 }} />
          <Typography variant="body1" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>Authorized Email Domains</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mb: 2 }}>Users with these domains can sign up or be added to your institution.</Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          {profile?.domains && profile.domains.length > 0 ? (
            profile.domains.map((d) => (
              <Chip key={d.id} label={`@${d.domain}`} size="small"
                sx={{ fontSize: 12, fontWeight: 600, py: 2.5, px: 0.5,
                  bgcolor: d.is_primary ? ST.colors.primaryLight : ST.colors.bg,
                  color: d.is_primary ? ST.colors.primary : ST.colors.textSecondary,
                  border: `1px solid ${d.is_primary ? "#BFDBFE" : ST.colors.border}` }} />
            ))
          ) : (
            <Box sx={{ p: 3, bgcolor: ST.colors.bg, borderRadius: 1.5, width: "100%", textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>No domains configured.</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <Dialog open={editDialogOpen} onClose={() => { setEditDialogOpen(false); setEditForm({ name: "", contact_email: "", address: "" }); }}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Institution Profile</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Institution Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} sx={{ mt: 1, mb: 2 }} />
          <TextField fullWidth label="Contact Email" type="email" value={editForm.contact_email}
            onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
            helperText="Primary contact email for the institution" sx={{ mb: 2 }} />
          <TextField fullWidth label="Address" multiline rows={3} value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} helperText="Physical address of the institution" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => { setEditDialogOpen(false); setEditForm({ name: "", contact_email: "", address: "" }); }} sx={{ textTransform: "none", color: ST.colors.textSecondary }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateProfile} disableElevation sx={{ textTransform: "none", bgcolor: ST.colors.primary, borderRadius: 1.5 }}>Update Profile</Button>
        </DialogActions>
      </Dialog>
    </InstitutionAdminLayout>
  );
}
