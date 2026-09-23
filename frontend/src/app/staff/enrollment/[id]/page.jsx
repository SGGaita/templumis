"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import StudentDetailView from "@/components/staff/StudentDetailView";

export default function StudentDetailPage() {
  const params = useParams();
  const { t } = useLanguage();
  const L = t.staff.studentDetail;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    apiFetch(`/sis-lms/students/${params.id}`)
      .then(setData)
      .catch((err) => setError(err.message || L.loadError))
      .finally(() => setLoading(false));
  }, [params.id, L.loadError]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;
  }

  if (!data?.student) {
    return <Box sx={{ p: 3 }}><Alert severity="warning">{L.notFound}</Alert></Box>;
  }

  return <StudentDetailView data={data} />;
}
