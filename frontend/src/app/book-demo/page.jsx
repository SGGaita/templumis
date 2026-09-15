"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import PublicNavbar from "@/components/PublicNavbar";
import SiteFooter from "@/components/SiteFooter";
import { BRAND } from "@/lib/brand";
import { useLanguage } from "@/lib/language-context";
import { apiFetch } from "@/lib/api";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  institution: "",
  job_title: "",
  phone: "",
  message: "",
  website: "",
};

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function BookDemoPage() {
  const { t } = useLanguage();
  const L = t.bookDemo;

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const setField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.full_name.trim() || !form.email.trim() || !form.institution.trim() || !form.job_title.trim()) {
      setError(L.requiredFields);
      return;
    }
    if (!isValidEmail(form.email.trim())) {
      setError(L.invalidEmail);
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/demo/request", {
        method: "POST",
        body: {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          institution: form.institution.trim(),
          job_title: form.job_title.trim(),
          phone: form.phone.trim() || undefined,
          message: form.message.trim() || undefined,
          website: form.website.trim() || undefined,
        },
      });
      setSuccess(true);
      setForm(EMPTY_FORM);
    } catch (err) {
      if (err?.status === 429) {
        setError(L.tooManyRequests);
      } else {
        setError(L.sendError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      <PublicNavbar />

      <Box sx={{ bgcolor: BRAND.navy, color: "white", py: 5, textAlign: "center" }}>
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {L.title}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 640, mx: "auto" }}>
            {L.subtitle}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ py: 5, flex: 1 }}>
        <Paper sx={{ p: { xs: 3, sm: 4 }, boxShadow: 2 }}>
          {success ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              {L.success}
            </Alert>
          ) : null}
          {error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : null}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Box
              aria-hidden="true"
              sx={{ position: "absolute", left: "-10000px", height: 0, overflow: "hidden" }}
            >
              <TextField
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={setField("website")}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label={L.fields.fullName}
                  value={form.full_name}
                  onChange={setField("full_name")}
                  autoComplete="name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  type="email"
                  label={L.fields.email}
                  value={form.email}
                  onChange={setField("email")}
                  autoComplete="email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label={L.fields.institution}
                  value={form.institution}
                  onChange={setField("institution")}
                  autoComplete="organization"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label={L.fields.jobTitle}
                  value={form.job_title}
                  onChange={setField("job_title")}
                  autoComplete="organization-title"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={`${L.fields.phone} (${t.common.optional})`}
                  value={form.phone}
                  onChange={setField("phone")}
                  autoComplete="tel"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label={`${L.fields.message} (${t.common.optional})`}
                  placeholder={L.placeholders.message}
                  value={form.message}
                  onChange={setField("message")}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ mt: 3, fontWeight: 700, py: 1.25 }}
            >
              {loading ? L.submitting : L.submitBtn}
            </Button>
          </Box>
        </Paper>
      </Container>

      <SiteFooter />
    </Box>
  );
}
