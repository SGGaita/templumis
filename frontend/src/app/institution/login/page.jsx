"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { useAuth } from "@/lib/auth-context";
import BrandLogo from "@/components/BrandLogo";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/language-context";
import SiteFooter from "@/components/SiteFooter";

export default function InstitutionLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const L = t.institutionAdmin.login;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/institution/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => router.push("/");

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ minHeight: 88, py: 1.5, px: { xs: 2, sm: 3 }, justifyContent: "space-between" }}>
          <BrandLogo height={64} format="png" onClick={goHome} />
          <LanguageToggle />
        </Toolbar>
      </AppBar>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Card sx={{ width: 400, p: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <BrandLogo height={72} format="png" onClick={goHome} />
          </Box>
          <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mb: 3 }}>{L.subtitle}</Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label={t.common.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2 }} />
            <TextField fullWidth label={t.auth.login.passwordLabel} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 3 }} />
            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : L.signInBtn}
            </Button>
          </Box>
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Link component="button" type="button" variant="body2" onClick={goHome} sx={{ cursor: "pointer" }}>
              {L.backToHome}
            </Link>
          </Box>
        </CardContent>
      </Card>
      </Box>
      <SiteFooter />
    </Box>
  );
}
