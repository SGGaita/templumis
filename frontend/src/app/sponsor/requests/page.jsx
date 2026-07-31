"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";

const STATUS_CHIP = {
  pending: { label: "Pending review", color: "warning" },
  confirmed: { label: "Sponsorship confirmed", color: "success" },
  declined: { label: "Declined", color: "error" },
};

function PendingRequestsInner() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    apiFetch("/sis-lms/grants/sponsorship-requests?status=pending")
      .then((data) => setRequests(data.requests || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Sponsorship requests</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Pending requests from students who listed you as their sponsoring PI on a research grant application.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "#7c3aed" }} />
        </Box>
      ) : requests.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, border: `1px solid ${ST.colors.border}`, borderRadius: 2, textAlign: "center" }}>
          <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>No pending requests</Typography>
          <Typography variant="body2" color="text.secondary">
            When a student enters your email on a PI grant application, it will appear here for your review.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {requests.map((req) => {
            const chip = STATUS_CHIP[req.sponsorship_status] || STATUS_CHIP.pending;
            return (
              <Paper
                key={req.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  border: `1px solid ${ST.colors.border}`,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                    <Typography variant="subtitle1" fontWeight={800}>{req.student_name}</Typography>
                    <Chip label={chip.label} color={chip.color} size="small" sx={{ fontWeight: 600, height: 22 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {req.grant_name} · {req.grant_id}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {req.project_title || "Project title not set yet"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Program: {req.program} · Requested: {req.request_sent_at ? new Date(req.request_sent_at).toLocaleDateString() : "—"}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push(`/sponsor/requests/${req.id}`)}
                  sx={{ bgcolor: "#7c3aed", textTransform: "none", fontWeight: 700, borderRadius: 1.5, "&:hover": { bgcolor: "#6d28d9" } }}
                >
                  Review & respond
                </Button>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

export default function SponsorRequestsPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "#7c3aed" }} />
      </Box>
    }>
      <PendingRequestsInner />
    </Suspense>
  );
}
