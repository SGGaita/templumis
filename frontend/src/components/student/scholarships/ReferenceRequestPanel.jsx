"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import { ST } from "@/lib/staffTheme";
import { REFERENCE_STATUS_LABEL, referenceStatus } from "@/lib/scholarshipSchemas";

export default function ReferenceRequestPanel({
  scholId,
  scholarship,
  references,
  ferpaWaived,
  onFerpaChange,
  onReferencesChange,
  fieldErrors = {},
  disabled = false,
}) {
  const refCount = Number(scholarship?.requires_references || 0);
  const [sending, setSending] = useState(null);
  const [linkInfo, setLinkInfo] = useState(null);

  if (refCount === 0) return null;

  const sendRequest = async (index) => {
    const ref = references[index] || {};
    setSending(index);
    setLinkInfo(null);
    try {
      const res = await apiFetch(`/sis-lms/scholarships/applications/${scholId}/references`, {
        method: "POST",
        body: {
          ref_index: index,
          name: ref.name,
          title: ref.title,
          institution: ref.institution,
          email: ref.email,
          ferpa_waived: ferpaWaived,
        },
      });
      const next = [...references];
      next[index] = { ...ref, status: "pending", token: res.token, verify_path: res.verify_path };
      onReferencesChange(next);
      setLinkInfo({ index, path: res.verify_path });
    } catch (e) {
      setLinkInfo({ index, error: e.message });
    } finally {
      setSending(null);
    }
  };

  const updateRef = (index, patch) => {
    const next = [...references];
    while (next.length <= index) next.push({});
    next[index] = { ...next[index], ...patch };
    onReferencesChange(next);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: `1px solid ${ST.colors.border}`,
        borderRadius: 2,
        mb: 3,
        position: "relative",
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? "none" : "auto",
        filter: disabled ? "grayscale(0.4)" : "none",
      }}
    >
      {disabled && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(255,255,255,0.65)",
            borderRadius: 2,
            pointerEvents: "auto",
          }}
        >
          <Typography variant="body2" fontWeight={700} sx={{ color: ST.colors.textSecondary, px: 2, textAlign: "center" }}>
            Reference requests — coming soon
          </Typography>
        </Box>
      )}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
        Reference requests (SRRS)
      </Typography>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mb: 2 }}>
        Recommenders receive a secure link. You cannot view submitted letters or scores.
      </Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={ferpaWaived === true}
            onChange={(e) => onFerpaChange(e.target.checked ? true : null)}
          />
        }
        label="I waive my right to access this recommendation (FERPA)"
        sx={{ display: "block", mb: 1 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={ferpaWaived === false}
            onChange={(e) => onFerpaChange(e.target.checked ? false : null)}
          />
        }
        label="I do NOT waive my right to access this recommendation"
        sx={{ display: "block", mb: 2 }}
      />
      {fieldErrors.ferpa_waived && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {fieldErrors.ferpa_waived}
        </Alert>
      )}

      {Array.from({ length: refCount }).map((_, index) => {
        const ref = references[index] || {};
        const status = referenceStatus(ref);
        const statusLabel = REFERENCE_STATUS_LABEL[status];
        return (
          <Box
            key={index}
            sx={{ mb: 2, p: 2, bgcolor: ST.colors.bg, borderRadius: 2, border: `1px solid ${ST.colors.border}` }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
              <Typography variant="body2" fontWeight={700}>
                Reference {index + 1}
              </Typography>
              <Chip
                size="small"
                label={statusLabel}
                color={status === "completed" ? "success" : status === "pending" ? "warning" : "default"}
              />
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
              <TextField
                size="small"
                label="Name"
                value={ref.name || ""}
                onChange={(e) => updateRef(index, { name: e.target.value })}
                disabled={status === "completed"}
              />
              <TextField
                size="small"
                label="Title"
                value={ref.title || ""}
                onChange={(e) => updateRef(index, { title: e.target.value })}
                disabled={status === "completed"}
              />
              <TextField
                size="small"
                label="Institution"
                value={ref.institution || ""}
                onChange={(e) => updateRef(index, { institution: e.target.value })}
                disabled={status === "completed"}
              />
              <TextField
                size="small"
                label="Email"
                type="email"
                value={ref.email || ""}
                onChange={(e) => updateRef(index, { email: e.target.value })}
                disabled={status === "completed"}
              />
            </Box>
            {status !== "completed" && (
              <Button
                size="small"
                variant="contained"
                sx={{ mt: 1.5, bgcolor: BRAND.teal, textTransform: "none", fontWeight: 700 }}
                disabled={ferpaWaived == null || sending === index}
                onClick={() => sendRequest(index)}
              >
                {sending === index ? "Sending…" : "Send secure invitation"}
              </Button>
            )}
            {linkInfo?.index === index && linkInfo.path && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Mock email sent. Recommender link:{" "}
                <Typography component="span" variant="caption" sx={{ wordBreak: "break-all" }}>
                  {typeof window !== "undefined" ? window.location.origin : ""}
                  {linkInfo.path}
                </Typography>
              </Alert>
            )}
            {fieldErrors[`references[${index}]`] && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {fieldErrors[`references[${index}]`]}
              </Alert>
            )}
          </Box>
        );
      })}
    </Paper>
  );
}
