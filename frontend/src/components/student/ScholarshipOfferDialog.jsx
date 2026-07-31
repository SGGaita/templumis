"use client";

import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

function formatDeadline(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function ScholarshipOfferDialog({ scholId, open, onClose, onUpdated }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [offer, setOffer] = useState(null);

  useEffect(() => {
    if (!open || !scholId) return;
    setLoading(true);
    setError("");
    apiFetch(`/sis-lms/scholarships/applications/${encodeURIComponent(scholId)}/offer`)
      .then(setOffer)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, scholId]);

  const respond = async (action) => {
    setBusy(action);
    setError("");
    try {
      await apiFetch(
        `/sis-lms/scholarships/applications/${encodeURIComponent(scholId)}/offer/${action}`,
        { method: "POST" }
      );
      onUpdated?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const letter = offer?.offer_letter;
  const app = offer?.application;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Scholarship award offer</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress size={28} sx={{ display: "block", mx: "auto", my: 4 }} />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
              {letter?.title || app?.scholarship_details?.scholarship_name}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: BRAND.teal, mb: 2 }}>
              KES {Number(letter?.amount_kes || app?.["award_amount_(kes)"] || 0).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {letter?.body}
            </Typography>
            {offer?.offer_deadline && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Respond by <strong>{formatDeadline(offer.offer_deadline)}</strong> (14 business days).
              </Alert>
            )}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Terms of acceptance
            </Typography>
            <List dense disablePadding>
              {(letter?.terms || []).map((term, i) => (
                <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
                  <ListItemText primary={`• ${term}`} primaryTypographyProps={{ variant: "body2" }} />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary">
              By accepting, you agree to maintain eligibility requirements and acknowledge this award is
              applied as a tuition credit on your student ledger.
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={Boolean(busy)} sx={{ textTransform: "none" }}>
          Close
        </Button>
        {offer?.can_respond && !loading && !error && (
          <>
            <Button
              onClick={() => respond("decline")}
              disabled={Boolean(busy)}
              color="inherit"
              sx={{ textTransform: "none" }}
            >
              {busy === "decline" ? "Declining…" : "Decline"}
            </Button>
            <Button
              variant="contained"
              onClick={() => respond("accept")}
              disabled={Boolean(busy)}
              sx={{ bgcolor: BRAND.teal, textTransform: "none", fontWeight: 700 }}
            >
              {busy === "accept" ? "Accepting…" : "Accept offer"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
