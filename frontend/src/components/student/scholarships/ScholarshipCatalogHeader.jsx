"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { BRAND } from "@/lib/brand";

function StatPill({ label, value, highlight }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.25,
        borderRadius: 2,
        bgcolor: highlight ? "rgba(0,164,175,0.2)" : "rgba(255,255,255,0.08)",
        border: highlight ? `1px solid ${BRAND.teal}66` : "1px solid rgba(255,255,255,0.12)",
        minWidth: 100,
      }}
    >
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)", display: "block", fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={800} sx={{ color: "#fff", lineHeight: 1.2 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function ScholarshipCatalogHeader({
  student,
  stats,
  counts,
  onBack,
}) {
  const gpa = stats?.gpa != null ? Number(stats.gpa).toFixed(2) : "—";
  const program = [student?.program, student?.major].filter(Boolean).join(" · ") || "—";
  const nationality = student?.nationality || "—";

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 2,
        overflow: "hidden",
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <Box
        sx={{
          px: { xs: 2.5, md: 3 },
          py: 2.5,
          background: `linear-gradient(135deg, ${BRAND.navy} 0%, #2a4578 55%, ${BRAND.teal} 140%)`,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 240 }}>
            {onBack && (
              <Button
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={onBack}
                sx={{
                  mb: 1.5,
                  color: "rgba(255,255,255,0.85)",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                }}
              >
                My scholarships
              </Button>
            )}
            <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.6)", letterSpacing: 1.2, fontWeight: 700 }}>
              Financial aid
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: "#fff", mt: 0.25 }}>
              Scholarship opportunities
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 1, maxWidth: 520 }}>
              Programmes published by the university. We match awards to your GPA, programme, year of study, and nationality.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, opacity: 0.9 }}>
            <EmojiEventsIcon sx={{ color: BRAND.teal, fontSize: 40 }} />
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {[
            { label: "GPA", value: gpa },
            { label: "Programme", value: program },
            { label: "Nationality", value: nationality },
          ].map(({ label, value }) => (
            <Grid item xs={12} sm={4} key={label}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
                {label}
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: "#fff", mt: 0.25 }} noWrap title={value}>
                {value}
              </Typography>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 2.5 }}>
          <StatPill label="Open to you" value={counts.eligible} highlight />
          <StatPill label="Drafts" value={counts.drafts} />
          <StatPill label="Submitted" value={counts.submitted} />
          <StatPill label="All open programmes" value={counts.totalOpen} />
        </Box>
      </Box>
    </Paper>
  );
}
