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
        <LinearProgress />
      </InstitutionAdminLayout>
    );
  }

  return (
    <InstitutionAdminLayout>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            Institution Profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage your institution information
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => {
            setEditForm({
              name: profile?.name || "",
              contact_email: profile?.contact_email || "",
              address: profile?.address || "",
            });
            setEditDialogOpen(true);
          }}
        >
          Edit Profile
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Profile Overview Card */}
      <Card 
        sx={{ 
          mb: 3, 
          background: "linear-gradient(135deg, #2563eb 0%, #0891b2 100%)",
          color: "white",
          boxShadow: 3,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: 3,
                bgcolor: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 3,
                border: "2px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              <BusinessIcon sx={{ fontSize: 50, color: "white" }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                {profile?.name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1.5, opacity: 0.9 }}>
                <code style={{ background: "rgba(255,255,255,0.2)", padding: "4px 8px", borderRadius: "4px" }}>
                  {profile?.slug}
                </code>
              </Typography>
              <Chip
                label={profile?.is_active ? "Active Institution" : "Inactive"}
                sx={{
                  bgcolor: profile?.is_active ? "rgba(76, 175, 80, 0.9)" : "rgba(158, 158, 158, 0.9)",
                  color: "white",
                  fontWeight: 600,
                }}
                icon={<CheckCircleIcon sx={{ color: "white !important" }} />}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3, borderColor: "rgba(255, 255, 255, 0.2)" }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box 
                sx={{ 
                  display: "flex", 
                  alignItems: "flex-start", 
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <EmailIcon sx={{ mt: 0.5, opacity: 0.9 }} />
                <Box>
                  <Typography variant="caption" display="block" sx={{ opacity: 0.8, mb: 0.5 }}>
                    Contact Email
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {profile?.contact_email || "Not set"}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box 
                sx={{ 
                  display: "flex", 
                  alignItems: "flex-start", 
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <CalendarTodayIcon sx={{ mt: 0.5, opacity: 0.9 }} />
                <Box>
                  <Typography variant="caption" display="block" sx={{ opacity: 0.8, mb: 0.5 }}>
                    Created On
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : "—"}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box 
                sx={{ 
                  display: "flex", 
                  alignItems: "flex-start", 
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <LocationOnIcon sx={{ mt: 0.5, opacity: 0.9 }} />
                <Box>
                  <Typography variant="caption" display="block" sx={{ opacity: 0.8, mb: 0.5 }}>
                    Address
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {profile?.address || "Not set"}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Domains Section */}
      <Paper sx={{ p: 3, boxShadow: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <EmailIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Authorized Email Domains
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Users with these email domains can sign up or be added to your institution.
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          {profile?.domains && profile.domains.length > 0 ? (
            profile.domains.map((d) => (
              <Chip
                key={d.id}
                label={`@${d.domain}`}
                color={d.is_primary ? "primary" : "default"}
                variant={d.is_primary ? "filled" : "outlined"}
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  py: 2.5,
                  px: 1,
                }}
              />
            ))
          ) : (
            <Box
              sx={{
                p: 3,
                bgcolor: "grey.50",
                borderRadius: 2,
                width: "100%",
                textAlign: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No domains configured. Add domains to control user access.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditForm({ name: "", contact_email: "", address: "" });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Institution Profile</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Institution Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Contact Email"
            type="email"
            value={editForm.contact_email}
            onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
            helperText="Primary contact email for the institution"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Address"
            multiline
            rows={3}
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            helperText="Physical address of the institution"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setEditForm({ name: "", contact_email: "", address: "" });
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdateProfile}>
            Update Profile
          </Button>
        </DialogActions>
      </Dialog>
    </InstitutionAdminLayout>
  );
}
