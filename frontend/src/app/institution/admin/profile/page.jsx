"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import EditIcon from "@mui/icons-material/Edit";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, uploadInstitutionLogo, deleteInstitutionLogo } from "@/lib/api";
import InstitutionAdminLayout from "@/components/InstitutionAdminLayout";
import { ST } from "@/lib/staffTheme";
import { useLanguage } from "@/lib/language-context";

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, loading: authLoading, refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const L = t.institutionAdmin.profile;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", contact_email: "", address: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoVersion, setLogoVersion] = useState(0);
  const fileInputRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch("/institution/profile", { token });
      setProfile(data);
    } catch {
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
    fetchProfile();
  }, [user, authLoading, router, fetchProfile]);

  const closeEdit = () => {
    setEditDialogOpen(false);
    setEditForm({ name: "", contact_email: "", address: "" });
  };

  const handleUpdateProfile = async () => {
    try {
      const data = await apiFetch("/institution/profile", {
        method: "PATCH",
        body: editForm,
        token,
      });
      setProfile(data);
      closeEdit();
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : L.updateError);
    }
  };

  const validateLogoFile = (file) => {
    const mime = (file.type || "").toLowerCase();
    if (!LOGO_TYPES.has(mime)) {
      setError(L.logoTypeError);
      return false;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError(L.logoSizeError);
      return false;
    }
    return true;
  };

  const handleLogoFile = async (file) => {
    if (!file || !validateLogoFile(file)) return;
    setError("");
    setLogoBusy(true);
    try {
      const data = await uploadInstitutionLogo(file, token);
      setProfile(data);
      setLogoVersion((v) => v + 1);
      setSuccess(L.logoUpdated);
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : L.logoError);
    } finally {
      setLogoBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    setError("");
    setLogoBusy(true);
    try {
      const data = await deleteInstitutionLogo(token);
      setProfile(data);
      setLogoVersion((v) => v + 1);
      setSuccess(L.logoRemoved);
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : L.logoError);
    } finally {
      setLogoBusy(false);
    }
  };

  const logoSrc = profile?.logo_url
    ? `${profile.logo_url}${profile.logo_url.includes("?") ? "&" : "?"}v=${logoVersion}`
    : null;

  if (authLoading || loading) {
    return (
      <InstitutionAdminLayout>
        <LinearProgress sx={{ borderRadius: 1 }} />
      </InstitutionAdminLayout>
    );
  }

  return (
    <InstitutionAdminLayout>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleLogoFile(file);
        }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>{L.title}</Typography>
          <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>{L.subtitle}</Typography>
        </Box>
        <Button variant="contained" startIcon={<EditIcon />} disableElevation
          onClick={() => { setEditForm({ name: profile?.name || "", contact_email: profile?.contact_email || "", address: profile?.address || "" }); setEditDialogOpen(true); }}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5, bgcolor: ST.colors.primary, "&:hover": { bgcolor: "#1e3a8a" } }}>
          {L.editProfile}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setSuccess("")}>{success}</Alert>}

      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, overflow: "hidden", border: `1px solid ${ST.colors.border}` }}>
        <Box sx={{ background: `linear-gradient(135deg, ${ST.colors.primary} 0%, #0891b2 100%)`, p: 3.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap" }}>
            <Box sx={{ position: "relative" }}>
              <Box
                sx={{
                  width: 88,
                  height: 88,
                  borderRadius: 2.5,
                  bgcolor: "rgba(255,255,255,0.95)",
                  border: "2px solid rgba(255,255,255,0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {logoSrc ? (
                  <Box component="img" src={logoSrc} alt={profile?.name || L.fallbackName}
                    sx={{ width: "100%", height: "100%", objectFit: "contain", p: 1 }} />
                ) : (
                  <BusinessIcon sx={{ fontSize: 38, color: ST.colors.primary }} />
                )}
              </Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: "white", mb: 0.5 }}>{profile?.name || "—"}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <code style={{ background: "rgba(255,255,255,0.15)", color: "white", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>{profile?.slug}</code>
                <Chip label={profile?.is_active ? t.common.active : t.common.inactive}
                  icon={<CheckCircleIcon sx={{ color: "white !important", fontSize: "14px !important" }} />}
                  sx={{ bgcolor: profile?.is_active ? "rgba(16,185,129,0.85)" : "rgba(100,116,139,0.85)", color: "white", fontWeight: 600, fontSize: 12, height: 24 }} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  disabled={logoBusy}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ textTransform: "none", fontWeight: 600, bgcolor: "white", color: ST.colors.primary, "&:hover": { bgcolor: "rgba(255,255,255,0.9)" } }}
                >
                  {logoSrc ? L.logoChange : L.logoUpload}
                </Button>
                {logoSrc ? (
                  <Tooltip title={L.logoRemove}>
                    <span>
                      <IconButton size="small" disabled={logoBusy} onClick={handleRemoveLogo}
                        sx={{ color: "white", bgcolor: "rgba(0,0,0,0.2)", "&:hover": { bgcolor: "rgba(0,0,0,0.35)" } }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                ) : null}
              </Box>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", display: "block", mt: 1 }}>
                {L.logoHint}
              </Typography>
            </Box>
          </Box>
          {logoBusy ? <LinearProgress sx={{ mt: 2, borderRadius: 1, bgcolor: "rgba(255,255,255,0.3)", "& .MuiLinearProgress-bar": { bgcolor: "white" } }} /> : null}
        </Box>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {[
              { icon: <EmailIcon sx={{ fontSize: 20, color: ST.colors.primary }} />, label: L.contactEmail, value: profile?.contact_email || L.notSet },
              { icon: <CalendarTodayIcon sx={{ fontSize: 20, color: ST.colors.info }} />, label: L.createdOn, value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString(language, { year: "numeric", month: "long", day: "numeric" }) : "—" },
              { icon: <LocationOnIcon sx={{ fontSize: 20, color: ST.colors.warning }} />, label: L.address, value: profile?.address || L.notSet },
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

      <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <EmailIcon sx={{ color: ST.colors.primary, fontSize: 20 }} />
          <Typography variant="body1" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>{L.authorizedDomains}</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mb: 2 }}>{L.authorizedDomainsHint}</Typography>
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
              <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>{L.noDomains}</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <Dialog open={editDialogOpen} onClose={closeEdit}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{L.editTitle}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label={L.name} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} sx={{ mt: 1, mb: 2 }} />
          <TextField fullWidth label={L.contactEmail} type="email" value={editForm.contact_email}
            onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
            helperText={L.contactEmailHelper} sx={{ mb: 2 }} />
          <TextField fullWidth label={L.address} multiline rows={3} value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} helperText={L.addressHelper} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={closeEdit} sx={{ textTransform: "none", color: ST.colors.textSecondary }}>{t.common.cancel}</Button>
          <Button variant="contained" onClick={handleUpdateProfile} disableElevation sx={{ textTransform: "none", bgcolor: ST.colors.primary, borderRadius: 1.5 }}>{L.updateProfile}</Button>
        </DialogActions>
      </Dialog>
    </InstitutionAdminLayout>
  );
}
