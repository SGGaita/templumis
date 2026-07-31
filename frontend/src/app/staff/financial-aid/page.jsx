"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ScienceIcon from "@mui/icons-material/Science";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";

function StatTile({ label, value, sub, onClick, color, bg, icon }) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2.5,
        border: `1px solid ${ST.colors.border}`,
        borderRadius: 2,
        cursor: onClick ? "pointer" : "default",
        height: "100%",
        "&:hover": onClick ? { boxShadow: 2, borderColor: color } : {},
      }}
    >
      <Box sx={{ bgcolor: bg, color, p: 1, borderRadius: 1.5, display: "inline-flex", mb: 1.5 }}>{icon}</Box>
      <Typography variant="h4" fontWeight={800}>{value}</Typography>
      <Typography variant="body2" fontWeight={600}>{label}</Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

export default function FinancialAidDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch("/sis-lms/financial-aid/dashboard")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const s = data?.scholarships || {};
  const g = data?.grants || {};

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
        Financial Aid Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Overview of scholarship and grant programmes and student applications
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Scholarships
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            label="Opportunities"
            value={s.opportunities_published ?? 0}
            sub={`${s.opportunities_total ?? 0} total configured`}
            icon={<AttachMoneyIcon />}
            color={ST.colors.primary}
            bg={ST.colors.primaryLight}
            onClick={() => router.push("/staff/scholarships/opportunities")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            label="Applications"
            value={s.applications_total ?? 0}
            sub="All submissions"
            icon={<EmojiEventsIcon />}
            color={ST.colors.success}
            bg={ST.colors.successLight}
            onClick={() => router.push("/staff/scholarships/applications")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            label="Pending review"
            value={s.applications_pending ?? 0}
            sub="Scholarship queue"
            icon={<HourglassEmptyIcon />}
            color={ST.colors.warning}
            bg={ST.colors.warningLight}
            onClick={() => router.push("/staff/scholarships/applications")}
          />
        </Grid>
        {(s.triage?.document_verification > 0 || s.triage?.pending_triage > 0) && (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Triage pipeline: {s.triage?.pending_triage ?? 0} pending ·{" "}
              {s.triage?.document_verification ?? 0} awaiting document certification ·{" "}
              {s.triage?.ready_for_committee ?? 0} ready for committee
              <Button size="small" sx={{ ml: 2, textTransform: "none" }} onClick={() => router.push("/staff/scholarships/triage")}>
                Open triage
              </Button>
            </Alert>
          </Grid>
        )}
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            label="Awarded"
            value={s.applications_awarded ?? 0}
            sub="Active awards"
            icon={<AttachMoneyIcon />}
            color={ST.chart.teal}
            bg="#CCFBF1"
            onClick={() => router.push("/staff/scholarships/applications")}
          />
        </Grid>
      </Grid>

      <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Grants
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            label="Opportunities"
            value={g.opportunities_published ?? 0}
            sub={`${g.opportunities_total ?? 0} total configured`}
            icon={<ScienceIcon />}
            color="#7C3AED"
            bg="#EDE9FE"
            onClick={() => router.push("/staff/grants/opportunities")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            label="Applications"
            value={g.applications_total ?? 0}
            sub="All submissions"
            icon={<ScienceIcon />}
            color={ST.colors.info}
            bg={ST.colors.infoLight}
            onClick={() => router.push("/staff/grants/applications")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            label="Pending review"
            value={g.applications_pending ?? 0}
            sub="Grant queue"
            icon={<HourglassEmptyIcon />}
            color={ST.colors.warning}
            bg={ST.colors.warningLight}
            onClick={() => router.push("/staff/grants/applications")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            label="Approved"
            value={g.applications_approved ?? 0}
            sub="Funded projects"
            icon={<EmojiEventsIcon />}
            color={ST.colors.success}
            bg={ST.colors.successLight}
            onClick={() => router.push("/staff/grants/applications")}
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Quick links
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => router.push("/staff/scholarships/opportunities")} sx={{ textTransform: "none" }}>
            Scholarship opportunities
          </Button>
          <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => router.push("/staff/scholarships/applications")} sx={{ textTransform: "none" }}>
            Scholarship applications
          </Button>
          <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => router.push("/staff/grants/opportunities")} sx={{ textTransform: "none" }}>
            Grant opportunities
          </Button>
          <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => router.push("/staff/grants/applications")} sx={{ textTransform: "none" }}>
            Grant applications
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
