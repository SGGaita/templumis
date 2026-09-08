"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import LinearProgress from "@mui/material/LinearProgress";
import LockResetIcon from "@mui/icons-material/LockReset";
import BrandLogo from "@/components/BrandLogo";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/language-context";
import { apiFetch } from "@/lib/api";
import SiteFooter from "@/components/SiteFooter";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const R = t.auth.resetPassword;
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const mismatch = Boolean(confirm) && password !== confirm;
  const tooShort = Boolean(password) && password.length < 8;
  const formError = tooShort ? R.passwordTooShort : mismatch ? R.passwordsNoMatch : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(R.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      setError(R.passwordsNoMatch);
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: { email, token, password },
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : R.invalidLink);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ minHeight: 88, py: 1.5, px: { xs: 2, sm: 3 }, justifyContent: "space-between" }}>
          <BrandLogo height={64} format="png" onClick={() => router.push("/")} />
          <LanguageToggle />
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ flex: 1, display: "flex", alignItems: "center", py: 4 }}>
        <Paper sx={{ p: 4, width: "100%", boxShadow: 3 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box sx={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              bgcolor: success ? "success.main" : "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}>
              <LockResetIcon sx={{ fontSize: 30, color: "white" }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>{R.title}</Typography>
            <Typography variant="body2" color="text.secondary">{R.subtitle}</Typography>
          </Box>

          {!email || !token ? (
            <Alert severity="error" sx={{ mb: 2 }}>{R.missingParams}</Alert>
          ) : success ? (
            <Alert severity="success" sx={{ mb: 3 }}>{R.success}</Alert>
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  type="password"
                  label={R.newPassword}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText={R.passwordHelper}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="password"
                  label={R.confirmPassword}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  error={Boolean(formError)}
                  helperText={formError || " "}
                  required
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={saving || Boolean(formError) || !password || !confirm}
                >
                  {saving ? R.savingBtn : R.submitBtn}
                </Button>
              </Box>
            </>
          )}

          {(success || !email || !token) && (
            <Button fullWidth variant="contained" sx={{ mt: success ? 0 : 1 }} onClick={() => router.push("/login")}>
              {R.signInBtn}
            </Button>
          )}
        </Paper>
      </Container>

      <SiteFooter />
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LinearProgress />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
