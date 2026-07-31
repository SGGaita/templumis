"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import { transformExcelJourney } from "@/lib/studentJourney";

export function usePgJourney() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [journeyData, setJourneyData] = useState(null);

  useEffect(() => {
    apiFetch("/student-journey/my-journey-excel")
      .then((raw) => setJourneyData(transformExcelJourney(raw)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { loading, error, journeyData };
}

export default function PgSupportLayout({ title, subtitle, backHref = "/student/support", children }) {
  const router = useRouter();
  const { loading, error } = usePgJourney();

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress sx={{ color: BRAND.teal }} /></Box>;
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(backHref)} sx={{ mb: 2, textTransform: "none" }}>
        Back to support hub
      </Button>
      <Typography variant="h5" fontWeight={700}>{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>{subtitle}</Typography>}
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {children}
    </Box>
  );
}
