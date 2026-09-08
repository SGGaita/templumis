"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import BrandLogo from "@/components/BrandLogo";
import LanguageToggle from "@/components/LanguageToggle";
import LoginIcon from "@mui/icons-material/Login";
import { useAuth } from "@/lib/auth-context";
import { getPostLoginPath } from "@/lib/auth-routing";
import { useLanguage } from "@/lib/language-context";
import { apiFetch } from "@/lib/api";
import SiteFooter from "@/components/SiteFooter";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const L = t.auth.login;
  const F = t.auth.forgotPassword;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userData = await login(email, password);
      const destination = getPostLoginPath(userData);
      if (!destination) {
        setError(L.accountNotConfigured);
        setLoading(false);
        return;
      }
      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : L.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  const openForgot = () => {
    setForgotEmail(email);
    setForgotSent(false);
    setForgotError("");
    setForgotOpen(true);
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setForgotSending(false);
    setForgotError("");
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotEmail.trim()) {
      setForgotError(F.emailRequired);
      return;
    }
    setForgotSending(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: {
          email: forgotEmail.trim(),
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      setForgotSent(true);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setForgotSending(false);
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
            <Box sx={{ width: 60, height: 60, borderRadius: "50%", bgcolor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
              <LoginIcon sx={{ fontSize: 30, color: "white" }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>{L.title}</Typography>
            <Typography variant="body2" color="text.secondary">{L.subtitle}</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField fullWidth label={L.emailLabel} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2 }} />
            <TextField fullWidth label={L.passwordLabel} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 1 }} />
            <Box sx={{ textAlign: "end", mb: 2 }}>
              <Link component="button" type="button" variant="body2" onClick={openForgot} sx={{ cursor: "pointer" }}>
                {L.forgotPassword}
              </Link>
            </Box>
            <Button fullWidth variant="contained" type="submit" size="large" disabled={loading} sx={{ mb: 2 }}>
              {loading ? L.signingIn : L.signInBtn}
            </Button>
          </form>

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {L.noAccount}{" "}
              <Link component="button" variant="body2" onClick={() => router.push("/signup")} sx={{ fontWeight: 600, cursor: "pointer" }}>
                {L.signUpLink}
              </Link>
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center", mt: 2, pt: 2, borderTop: "1px solid", borderColor: "grey.200" }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>{L.adminAccess}</Typography>
            <Link component="button" variant="caption" onClick={() => router.push("/institution/login")} sx={{ cursor: "pointer" }}>{L.institutionAdmin}</Link>
          </Box>
        </Paper>
      </Container>

      <Dialog open={forgotOpen} onClose={closeForgot} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{F.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{F.subtitle}</Typography>
          {forgotSent ? (
            <Alert severity="success">{F.sent}</Alert>
          ) : (
            <Box component="form" id="forgot-password-form" onSubmit={handleForgotSubmit}>
              {forgotError && <Alert severity="error" sx={{ mb: 2 }}>{forgotError}</Alert>}
              <TextField
                fullWidth
                autoFocus
                type="email"
                label={L.emailLabel}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={closeForgot} sx={{ textTransform: "none" }}>
            {forgotSent ? t.common.close : t.common.cancel}
          </Button>
          {!forgotSent && (
            <Button
              type="submit"
              form="forgot-password-form"
              variant="contained"
              disabled={forgotSending}
              disableElevation
              sx={{ textTransform: "none" }}
            >
              {forgotSending ? F.sendingBtn : F.submitBtn}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <SiteFooter />
    </Box>
  );
}
