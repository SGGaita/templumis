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
import { useAuth } from "@/lib/auth-context";
import BrandLogo from "@/components/BrandLogo";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/language-context";

export default function GlobalAdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const L = t.globalAdmin.login;

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
      router.push("/global-admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 2 }}>
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <LanguageToggle />
      </Box>
      <Card sx={{ width: 400, p: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <BrandLogo height={112} format="png" />
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
        </CardContent>
      </Card>
    </Box>
  );
}
