"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import { apiFetch } from "@/lib/api";
import { ST } from "@/lib/staffTheme";
import {
  ALL_RANKING_FRAMEWORK_IDS,
  RANKING_FRAMEWORK_CATALOG,
  RANKING_FRAMEWORK_GROUPS,
  institutionFrameworkIds,
} from "@/lib/rankings/catalog";

/**
 * Institution admin: choose which ranking / accreditation frameworks staff see
 * on University Rankings and the University Rankings Summary.
 * Saving every framework stores null ("all"), so new frameworks appear
 * automatically for institutions that never narrowed the list.
 */
export default function RankingFrameworksSettings({ profile, token, onSaved }) {
  const [selected, setSelected] = useState(() => institutionFrameworkIds(profile?.ranking_frameworks));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setSelected(institutionFrameworkIds(profile?.ranking_frameworks));
  }, [profile?.ranking_frameworks]);

  const saved = institutionFrameworkIds(profile?.ranking_frameworks);
  const dirty = saved.length !== selected.length || saved.some((id) => !selected.includes(id));

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : ALL_RANKING_FRAMEWORK_IDS.filter((x) => x === id || prev.includes(x))
    );

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const all = selected.length === ALL_RANKING_FRAMEWORK_IDS.length;
      const updated = await apiFetch("/institution/profile", {
        method: "PATCH",
        token,
        body: { ranking_frameworks: all ? null : selected },
      });
      setMessage({ type: "success", text: "Ranking frameworks saved. Staff will see the change on their next page load." });
      onSaved?.(updated);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Could not save frameworks" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 2.5, mt: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <EmojiEventsOutlinedIcon sx={{ color: ST.colors.primary, fontSize: 20 }} />
        <Typography variant="body1" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
          Ranking frameworks
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mb: 2 }}>
        Choose the rankings and accreditation frameworks your institution reports against. Staff only see these on
        University Rankings and the University Rankings Summary, and can narrow them further for themselves.
      </Typography>

      <Grid container spacing={2}>
        {RANKING_FRAMEWORK_GROUPS.map((group) => (
          <Grid item xs={12} md={4} key={group.id}>
            <Typography
              variant="overline"
              sx={{ color: ST.colors.textSecondary, fontWeight: 700, letterSpacing: 0.8, display: "block" }}
            >
              {group.label}
            </Typography>
            {RANKING_FRAMEWORK_CATALOG.filter((f) => f.group === group.id).map((f) => (
              <FormControlLabel
                key={f.id}
                sx={{ display: "flex", ml: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={selected.includes(f.id)}
                    onChange={() => toggle(f.id)}
                    disabled={saving}
                  />
                }
                label={<Typography variant="body2">{f.label}</Typography>}
              />
            ))}
          </Grid>
        ))}
      </Grid>

      {message && (
        <Alert severity={message.type} sx={{ mt: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, gap: 2, flexWrap: "wrap" }}>
        <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
          {selected.length === 0
            ? "Select at least one framework."
            : `${selected.length} of ${ALL_RANKING_FRAMEWORK_IDS.length} selected`}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            onClick={() => setSelected(saved)}
            disabled={!dirty || saving}
            sx={{ textTransform: "none", color: ST.colors.textSecondary }}
          >
            Discard
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={save}
            disabled={!dirty || saving || selected.length === 0}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ textTransform: "none", fontWeight: 600, bgcolor: ST.colors.primary }}
          >
            Save frameworks
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
