"use client";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import { BRAND } from "@/lib/brand";
import { ST } from "@/lib/staffTheme";

export default function ScholarshipDetailDialog({ scholarship, open, onClose, onApply }) {
  if (!scholarship) return null;

  const s = scholarship;
  const amount = Number(s["amount_(kes)"] || 0);
  const description = s.description || s.criteria || "No additional details published.";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontWeight: 800, color: BRAND.navy, pr: 6 }}>
        {s.scholarship_name}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          <Chip label={s.type || "General"} size="small" sx={{ fontWeight: 600 }} />
          <Chip label={`KES ${amount.toLocaleString()}`} size="small" sx={{ bgcolor: BRAND.tealLight, color: BRAND.teal, fontWeight: 700 }} />
          {s.min_gpa != null && <Chip label={`Min GPA ${s.min_gpa}`} size="small" variant="outlined" />}
        </Box>
        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {description}
        </Typography>
        {(s.coverage || s.frequency) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" fontWeight={700} sx={{ display: "block", mb: 0.5 }}>
              Award structure
            </Typography>
            <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
              {[s.coverage, s.frequency].filter(Boolean).join(" · ")}
            </Typography>
          </>
        )}
        {s.reason && !s.eligible && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: "#FFEBEE", borderRadius: 1.5 }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: "#C62828" }}>
              Why you may not qualify yet
            </Typography>
            <Typography variant="body2" sx={{ color: "#B71C1C", mt: 0.5 }}>
              {s.reason}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Close
        </Button>
        {!s.hasApplied && (
          <Button
            variant="contained"
            onClick={() => {
              onApply(s);
              onClose();
            }}
            disabled={s.hasApplied || (s.remaining === 0 && (s.slots ?? 0) > 0)}
            sx={{ bgcolor: BRAND.teal, textTransform: "none", fontWeight: 700 }}
          >
            {s.isDraft ? "Continue application" : "Apply"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
