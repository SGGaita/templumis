"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import SaveIcon from "@mui/icons-material/Save";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import GlobalAdminLayout from "@/components/GlobalAdminLayout";

export default function SettingsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState({
    platformName: "TemplumIS",
    supportEmail: "support@templumis.com",
    allowRegistration: true,
    requireEmailVerification: true,
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch("/global-admin/settings", { token });
      setSettings({
        platformName: data.platform_name,
        supportEmail: data.support_email,
        allowRegistration: data.allow_registration,
        requireEmailVerification: data.require_email_verification,
        maintenanceMode: data.maintenance_mode,
      });
    } catch (err) {
      setError("Failed to load settings");
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
    fetchSettings();
  }, [user, authLoading, router, fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await apiFetch("/global-admin/settings", {
        method: "PUT",
        body: {
          platform_name: settings.platformName,
          support_email: settings.supportEmail,
          allow_registration: settings.allowRegistration,
          require_email_verification: settings.requireEmailVerification,
          maintenance_mode: settings.maintenanceMode,
        },
        token,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
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
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure platform settings
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Settings saved successfully!
        </Alert>
      </Snackbar>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 1.5 }}>
              General Settings
            </Typography>
            <Divider sx={{ my: 2 }} />

            <TextField
              fullWidth
              label="Platform Name"
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Support Email"
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              sx={{ mb: 3 }}
            />

            <Typography variant="body1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>
              Security & Access
            </Typography>
            <Divider sx={{ my: 2 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.allowRegistration}
                  onChange={(e) =>
                    setSettings({ ...settings, allowRegistration: e.target.checked })
                  }
                />
              }
              label="Allow new institution registration"
              sx={{ mb: 2, display: "block" }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.requireEmailVerification}
                  onChange={(e) =>
                    setSettings({ ...settings, requireEmailVerification: e.target.checked })
                  }
                />
              }
              label="Require email verification"
              sx={{ mb: 2, display: "block" }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    setSettings({ ...settings, maintenanceMode: e.target.checked })
                  }
                  color="warning"
                />
              }
              label="Maintenance mode"
              sx={{ mb: 3, display: "block" }}
            />

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              size="large"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 1.5 }}>
              System Information
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Version
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                v0.2.0
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Environment
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                Production
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Database
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                PostgreSQL
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </GlobalAdminLayout>
  );
}
