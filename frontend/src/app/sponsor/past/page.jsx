"use client";

import { useEffect, useState } from "react";
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
  confirmed: { label: "Confirmed", color: "success" },
  declined: { label: "Declined", color: "error" },
};

export default function SponsorPastRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    Promise.all([
      apiFetch("/sis-lms/grants/sponsorship-requests?status=confirmed"),
      apiFetch("/sis-lms/grants/sponsorship-requests?status=declined"),
    ])
      .then(([confirmed, declined]) => {
        const merged = [...(confirmed.requests || []), ...(declined.requests || [])];
        merged.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
        setRequests(merged);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Past requests</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Sponsorship requests you have already confirmed or declined.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "#7c3aed" }} />
        </Box>
      ) : requests.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, border: `1px solid ${ST.colors.border}`, borderRadius: 2, textAlign: "center" }}>
          <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>No past requests yet</Typography>
          <Typography variant="body2" color="text.secondary">
            Confirmed and declined sponsorship decisions will appear here.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {requests.map((req) => {
            const chip = STATUS_CHIP[req.sponsorship_status] || STATUS_CHIP.confirmed;
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
                    {req.project_title || "—"}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push(`/sponsor/requests/${req.id}`)}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}
                >
                  View details
                </Button>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
