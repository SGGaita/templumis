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
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RateReviewIcon from "@mui/icons-material/RateReview";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

export default function ReviewerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiFetch("/sis-lms/financial-aid/evaluation/reviewer-dashboard")
      .then(setStats)
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

  const tiles = [
    {
      label: "Pending tasks",
      value: stats?.pending_count ?? 0,
      color: ST.chart.blue,
      icon: AssignmentIcon,
      action: () => router.push("/reviewer/tasks"),
    },
    {
      label: "Completed reviews",
      value: stats?.completed_count ?? 0,
      color: ST.colors.success,
      icon: CheckCircleIcon,
      action: () => router.push("/reviewer/history"),
    },
    {
      label: "Total assigned",
      value: stats?.total_reviews ?? 0,
      color: BRAND.navy,
      icon: RateReviewIcon,
    },
    {
      label: "Average composite",
      value: stats?.average_composite != null ? stats.average_composite : "—",
      color: BRAND.teal,
      icon: TrendingUpIcon,
    },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
        Reviewer overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Track pending scholarship reviews and your scoring history.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {tiles.map(({ label, value, color, icon: Icon, action }) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: `1px solid ${ST.colors.border}`,
                borderRadius: 2,
                cursor: action ? "pointer" : "default",
                "&:hover": action ? { borderColor: color } : undefined,
              }}
              onClick={action}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Icon sx={{ color, fontSize: 20 }} />
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </Box>
              <Typography variant="h4" fontWeight={800} sx={{ color }}>
                {value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {(stats?.pending_count ?? 0) > 0 && (
        <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            You have {stats.pending_count} review task{stats.pending_count === 1 ? "" : "s"} waiting
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Open your queue to read blind application files and submit rubric scores.
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push("/reviewer/tasks")}
            sx={{ bgcolor: BRAND.navy, textTransform: "none", fontWeight: 600 }}
          >
            Go to new review tasks
          </Button>
        </Paper>
      )}
    </Box>
  );
}
