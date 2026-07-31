"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ScienceIcon from "@mui/icons-material/Science";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { stageLabel } from "@/lib/grantLifecycle";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

const statusStyle = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "awarded" || s === "approved") return { bg: ST.colors.successLight, color: ST.colors.success };
  if (s === "submitted for review") return { bg: ST.colors.warningLight, color: ST.colors.warning };
  if (s === "rejected") return { bg: ST.colors.errorLight, color: ST.colors.error };
  return { bg: ST.colors.bg, color: ST.colors.textSecondary };
};

export default function MyGrantsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [journey, setJourney] = useState(null);
  const [applications, setApplications] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const loadApplications = () =>
    apiFetch("/sis-lms/grants/applications/my")
      .then((apps) => setApplications(apps.applications || []))
      .catch((e) => setError(e.message));

  useEffect(() => {
    Promise.all([
      apiFetch("/student-journey/my-journey-excel").catch(() => null),
      apiFetch("/sis-lms/grants/applications/my").catch(() => ({ applications: [] })),
    ])
      .then(([j, apps]) => {
        setJourney(j);
        setApplications(apps.applications || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const useWorkspace = (app) =>
    ["proposal_budget", "compliance"].includes(String(app.lifecycle_stage || ""));

  const isDeletable = (app) =>
    String(app.status || "").toLowerCase() === "draft" &&
    String(app.lifecycle_stage || "") === "proposal_budget";

  const handleDeleteDraft = async (app) => {
    if (!app?.id || !isDeletable(app)) return;
    const name = app.grant_details?.scholarship_name || app.grant_id;
    if (!window.confirm(`Delete draft for "${name}"? This cannot be undone.`)) return;
    setDeletingId(app.id);
    setError("");
    try {
      await apiFetch(`/sis-lms/grants/applications/${app.id}/draft`, { method: "DELETE" });
      await loadApplications();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress sx={{ color: BRAND.teal }} /></Box>;
  }

  const pg = journey?.pg_research;

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>My Grants</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Track grant applications and research funding linked to your programme
          </Typography>
        </Box>
        <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => router.push("/student/grants/opportunities")} sx={{ bgcolor: BRAND.teal, textTransform: "none", fontWeight: 700 }}>
          Browse opportunities
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          <Box sx={{ bgcolor: `${BRAND.navy}15`, borderRadius: 2, p: 1.5 }}>
            <ScienceIcon sx={{ color: BRAND.navy, fontSize: 32 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>{pg?.dissertation_title || "Research project"}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Supervisor: {pg?.supervisor || "—"} · {pg?.research_area || journey?.programme_level}
            </Typography>
            <Chip size="small" label={pg?.grant_funding || pg?.research_output || "Institutional funding on file"} sx={{ mt: 1.5, fontWeight: 600 }} />
          </Box>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>Grant applications</Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: ST.colors.bg }}>
              <TableCell sx={{ fontWeight: 700 }}>Grant</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Project</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Requested</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Applied</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Lifecycle stage</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: ST.colors.textSecondary }}>
                  No applications yet.{" "}
                  <Button size="small" onClick={() => router.push("/student/grants/opportunities")} sx={{ textTransform: "none" }}>
                    Apply from opportunities
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => {
                const st = statusStyle(app.status);
                return (
                  <TableRow key={app.application_id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{app.grant_details?.scholarship_name || app.grant_id}</TableCell>
                    <TableCell>{app.project_title || "—"}</TableCell>
                    <TableCell>KES {Number(app.amount_requested || 0).toLocaleString()}</TableCell>
                    <TableCell>{app.applied_date || "—"}</TableCell>
                    <TableCell>
                      <Chip size="small" label={stageLabel(app.lifecycle_stage)} sx={{ fontWeight: 600, fontSize: 10 }} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={app.status} sx={{ fontWeight: 700, fontSize: 10, bgcolor: st.bg, color: st.color }} />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end", alignItems: "center" }}>
                        <Button
                          size="small"
                          onClick={() => router.push(`/student/grants/lifecycle/${app.id}`)}
                          sx={{ textTransform: "none", fontWeight: 600, fontSize: 11 }}
                        >
                          {useWorkspace(app) ? "Continue" : "Open"}
                        </Button>
                        {isDeletable(app) && (
                          <Tooltip title="Delete draft">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={deletingId === app.id}
                                onClick={() => handleDeleteDraft(app)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
