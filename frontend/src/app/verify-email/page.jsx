"use client";

import { useState, useEffect, Suspense } from "react";
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
import CircularProgress from "@mui/material/CircularProgress";
import BrandLogo from "@/components/BrandLogo";
import SiteFooter from "@/components/SiteFooter";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import { apiFetch } from "@/lib/api";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push("/signup");
    }
  }, [email, router]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/auth/verify-email", {
        method: "POST",
        body: {
          email: email,
          verification_code: verificationCode,
        },
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResending(true);

    try {
      await apiFetch(`/auth/resend-verification?email=${encodeURIComponent(email)}`, {
        method: "POST",
      });

      setError("");
      alert("A new verification code has been sent to your email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ minHeight: 88, py: 1.5, px: { xs: 2, sm: 3 } }}>
          <BrandLogo height={64} format="png" onClick={() => router.push("/")} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ flex: 1, display: "flex", alignItems: "center", py: 4 }}>
        <Paper sx={{ p: 4, width: "100%", boxShadow: 3 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                bgcolor: success ? "success.main" : "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <MarkEmailReadIcon sx={{ fontSize: 30, color: "white" }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {success ? "Email Verified!" : "Verify Your Email"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {success 
                ? "Your email has been successfully verified. Redirecting to login..."
                : `We've sent a 6-digit verification code to ${email}`
              }
            </Typography>
          </Box>

          {!success && (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleVerify}>
                <TextField
                  fullWidth
                  label="Verification Code"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setVerificationCode(value);
                  }}
                  placeholder="000000"
                  helperText="Enter the 6-digit code sent to your email"
                  required
                  sx={{ mb: 3 }}
                  inputProps={{
                    maxLength: 6,
                    style: { fontSize: 24, textAlign: "center", letterSpacing: 8 }
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={loading || verificationCode.length !== 6}
                  sx={{ mb: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : "Verify Email"}
                </Button>
              </form>

              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Didn't receive the code?
                </Typography>
                <Button
                  variant="text"
                  onClick={handleResend}
                  disabled={resending}
                  size="small"
                >
                  {resending ? "Sending..." : "Resend Code"}
                </Button>
              </Box>

              <Box sx={{ textAlign: "center", mt: 2, pt: 2, borderTop: "1px solid", borderColor: "grey.200" }}>
                <Typography variant="body2" color="text.secondary">
                  Wrong email?{" "}
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => router.push("/signup")}
                  >
                    Sign up again
                  </Button>
                </Typography>
              </Box>
            </>
          )}

          {success && (
            <Box sx={{ textAlign: "center", mt: 3 }}>
              <CircularProgress size={40} />
            </Box>
          )}
        </Paper>
      </Container>

      <SiteFooter showLegal={false} />
    </Box>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
