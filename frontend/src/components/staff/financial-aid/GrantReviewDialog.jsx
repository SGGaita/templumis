"use client";

import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

export default function GrantReviewDialog({ application, open, onClose, onUpdated }) {
  const [status, setStatus] = useState("approved");
  const [awardAmount, setAwardAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!application?.id) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/sis-lms/grants/applications/${application.id}/review`, {
        method: "PATCH",
        body: {
          status,
          award_amount: awardAmount ? Number(awardAmount) : undefined,
          review_notes: notes || undefined,
        },
      });
      onUpdated?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Review grant application</DialogTitle>
      <DialogContent>
        {application && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>{application.recipient}</strong> · {application.grant_name}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Project:</strong> {application.project_title || "—"}
            </Typography>
            {application.form_data?.supervisor_name && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Supervisor:</strong> {application.form_data.supervisor_name}
                {application.form_data.supervisor_endorsed ? " (endorsed)" : ""}
              </Typography>
            )}
            {application.form_data?.research_summary && (
              <Typography variant="body2" sx={{ mb: 2, fontSize: 13 }}>
                {application.form_data.research_summary}
              </Typography>
            )}
            {application.form_data?.budget_breakdown && (
              <Typography variant="body2" sx={{ mb: 2, fontSize: 12, color: "text.secondary" }}>
                <strong>Budget:</strong> {application.form_data.budget_breakdown}
              </Typography>
            )}
          </>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          select
          fullWidth
          size="small"
          label="Decision"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ mb: 2 }}
        >
          <MenuItem value="approved">Approve</MenuItem>
          <MenuItem value="awarded">Award & disburse</MenuItem>
          <MenuItem value="rejected">Reject</MenuItem>
        </TextField>
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Award amount (KES)"
          value={awardAmount}
          onChange={(e) => setAwardAmount(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={3}
          label="Review notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy} sx={{ textTransform: "none" }}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={busy} sx={{ bgcolor: BRAND.teal, textTransform: "none", fontWeight: 700 }}>
          {busy ? "Saving…" : "Save decision"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
