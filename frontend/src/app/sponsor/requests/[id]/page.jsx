"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { RichTextDisplay } from "@/components/RichTextEditor";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";

export default function SponsorshipRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [req, setReq] = useState(null);
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (!id) return;
    apiFetch(`/sis-lms/grants/sponsorship-requests/${id}`)
      .then((data) => setReq(data.request))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const respond = async (confirmed) => {
    setActing(true);
    setError("");
    setSuccess("");
    try {
      const res = await apiFetch(`/sis-lms/grants/sponsorship-requests/${id}/respond`, {
        method: "POST",
        body: { confirmed, comments: comments.trim() },
      });
      setReq(res.request);
      setSuccess(res.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "#7c3aed" }} />
      </Box>
    );
  }

  if (!req) {
    return <Alert severity="error">Sponsorship request not found.</Alert>;
  }

  const isPending = req.sponsorship_status === "pending";
  const isConfirmed = req.sponsorship_status === "confirmed";

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(isPending ? "/sponsor/requests" : "/sponsor/past")}
        sx={{ mb: 2, textTransform: "none", color: ST.colors.textSecondary }}
      >
        Back
      </Button>

      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>PI grant application</Typography>
          <Typography variant="body2" color="text.secondary">
            {req.grant_name} · Application {req.application_id}
          </Typography>
        </Box>
        <Chip
          label={isConfirmed ? "Endorsed" : req.sponsorship_status === "declined" ? "Declined" : "Pending endorsement"}
          color={isConfirmed ? "success" : req.sponsorship_status === "declined" ? "error" : "warning"}
          sx={{ fontWeight: 700 }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2, mb: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>Student & project</Typography>
            <Grid container spacing={2}>
              {[
                { label: "Student", value: req.student_name },
                { label: "Student ID", value: req.student_id },
                { label: "Program", value: req.program },
                { label: "Project title", value: req.project_title || "—" },
                { label: "Grant", value: req.grant_name },
                { label: "Keywords", value: (req.keywords || []).join(", ") || "—" },
              ].map(({ label, value }) => (
                <Grid item xs={12} sm={6} key={label}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{label}</Typography>
                  <Typography variant="body2" fontWeight={700}>{value}</Typography>
                </Grid>
              ))}
            </Grid>
            {req.candidate?.cover_letter && (
              <Box sx={{ mt: 2, bgcolor: ST.colors.bg, borderRadius: 1.5, p: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                  Cover letter / motivation
                </Typography>
                <RichTextDisplay html={req.candidate.cover_letter} />
              </Box>
            )}
            {req.fit_statement && !req.candidate?.cover_letter && (
              <Box sx={{ mt: 2, bgcolor: ST.colors.bg, borderRadius: 1.5, p: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                  Expression of interest
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7, fontSize: 13 }}>{req.fit_statement}</Typography>
              </Box>
            )}
          </Paper>

          {(req.documents || []).length > 0 && (
            <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>Attached documents</Typography>
              {req.documents.map((doc, i) => (
                <Typography key={doc.storage_key || i} variant="body2" sx={{ py: 0.5 }}>
                  · {doc.filename || doc.name || "Document"} ({doc.doc_type || "file"})
                </Typography>
              ))}
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>Supervisor endorsement</Typography>

            <Box sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 2, mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">Principal Investigator</Typography>
              <Typography variant="body2" fontWeight={700}>{req.pi_name || "—"}</Typography>
            </Box>

            {isPending ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Review this candidate&apos;s application and endorse them to proceed to compliance checks (RDO funder eligibility and other requirements).
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Comments (optional)"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="e.g. Happy to sponsor — let's discuss methodology next week."
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    disabled={acting}
                    onClick={() => respond(true)}
                    sx={{ bgcolor: "#7c3aed", textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#6d28d9" } }}
                  >
                    Endorse application
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    disabled={acting}
                    onClick={() => respond(false)}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Decline endorsement
                  </Button>
                </Box>
              </>
            ) : (
              <Box>
                <Alert severity={isConfirmed ? "success" : "warning"} sx={{ borderRadius: 1.5 }}>
                  {isConfirmed
                    ? `You endorsed this application${req.pi_confirmed_at ? ` on ${new Date(req.pi_confirmed_at).toLocaleString()}` : ""}. Compliance review will follow.`
                    : `You declined to endorse${req.pi_declined_at ? ` on ${new Date(req.pi_declined_at).toLocaleString()}` : ""}.`}
                </Alert>
                {req.pi_response_comments && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Your comments</Typography>
                    <Typography variant="body2">{req.pi_response_comments}</Typography>
                  </>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
