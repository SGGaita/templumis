"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

export default function LibraryResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    apiFetch("/student-journey/library-resources")
      .then((d) => setResources(d.resources || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = resources.filter((r) => {
    const q = query.toLowerCase();
    if (!q) return true;
    return [r.title, r.type, r.subject_area, r.description].some((v) => String(v || "").toLowerCase().includes(q));
  });

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress sx={{ color: BRAND.teal }} /></Box>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Library Resources</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Databases, datasets, and research tools for your programme
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        fullWidth
        size="small"
        placeholder="Search resources…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 2.5 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
          ),
        }}
      />

      <Grid container spacing={2}>
        {filtered.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: "center" }}><Typography color="text.secondary">No resources match your search.</Typography></Paper>
          </Grid>
        ) : (
          filtered.map((r) => (
            <Grid item xs={12} md={6} key={r.resource_id}>
              <Paper elevation={0} sx={{ p: 2.5, height: "100%", border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
                <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ bgcolor: `${BRAND.teal}18`, borderRadius: 1.5, p: 1, display: "flex" }}>
                    <MenuBookIcon sx={{ color: BRAND.teal }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>{r.title}</Typography>
                    <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
                      <Chip size="small" label={r.type} sx={{ fontSize: 10, fontWeight: 600 }} />
                      <Chip size="small" label={r.subject_area} variant="outlined" sx={{ fontSize: 10 }} />
                      {r.research_stage && (
                        <Chip size="small" label={r.research_stage} variant="outlined" sx={{ fontSize: 10 }} />
                      )}
                    </Box>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: 13 }}>
                  {r.description}
                </Typography>
                {r.access_notes && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    {r.access_notes}
                  </Typography>
                )}
                {r.url && (
                  <Button
                    size="small"
                    endIcon={<OpenInNewIcon />}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textTransform: "none", fontWeight: 600, color: BRAND.teal }}
                  >
                    Access resource
                  </Button>
                )}
              </Paper>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}
