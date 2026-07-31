"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import BrandLogo from "@/components/BrandLogo";
import { apiFetch } from "@/lib/api";

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/auth/accept-reviewer-invite", {
        method: "POST",
        body: { email, token, password, full_name: fullName },
      });
      localStorage.setItem("templumis_token", res.access_token);
      router.replace("/reviewer/tasks");
    } catch (err) {
      setError(err.message || "Could not complete invitation setup");
    } finally {
      setLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <Alert severity="error">Invalid invitation link. Check the email you received or contact the scholarship office.</Alert>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 480, mx: "auto", boxShadow: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Set up reviewer account
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create your password to access scholarship review tasks for <strong>{email}</strong>.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          type="password"
          label="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          sx={{ mb: 3 }}
        />
        <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ textTransform: "none", fontWeight: 600 }}>
          {loading ? "Creating account…" : "Create account & open tasks"}
        </Button>
      </Box>
    </Paper>
  );
}

export default function ReviewerInvitePage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 6 }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <BrandLogo height={48} format="png" sx={{ mx: "auto", mb: 2 }} />
        </Box>
        <Suspense fallback={<Typography textAlign="center">Loading invitation…</Typography>}>
          <AcceptInviteForm />
        </Suspense>
      </Container>
    </Box>
  );
}
