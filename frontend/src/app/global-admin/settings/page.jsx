"use client";

import { useEffect, useState } from "react";
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
import SaveIcon from "@mui/icons-material/Save";
import { useAuth } from "@/lib/auth-context";
import GlobalAdminLayout from "@/components/GlobalAdminLayout";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState({
    platformName: "TemplumIS",
    supportEmail: "support@templumis.com",
    allowRegistration: true,
    requireEmailVerification: true,
    maintenanceMode: false,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "global_admin") {
      router.push("/global-admin/login");
    }
  }, [user, authLoading, router]);

  const handleSave = () => {
    console.log("Saving settings:", settings);
  };

  if (authLoading) {
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
            >
              Save Settings
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
