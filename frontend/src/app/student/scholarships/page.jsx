"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import { appCategory, awardAmount } from "@/lib/scholarshipPipeline";
import ScholarshipOfferDialog from "@/components/student/ScholarshipOfferDialog";
import StudentApplicationDetailDialog from "@/components/student/scholarships/StudentApplicationDetailDialog";
import ScholarshipApplicationCard from "@/components/student/scholarships/ScholarshipApplicationCard";

function clearLocalDraftCache(studentId, scholId) {
  if (!studentId || !scholId || typeof window === "undefined") return;
  try {
    localStorage.removeItem(`templumis_scholarship_draft_${studentId}_${scholId}`);
  } catch {
    /* ignore */
  }
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "in_review", label: "In review" },
  { id: "offer", label: "Offers" },
  { id: "awarded", label: "Awarded" },
];

export default function ScholarshipsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [offerScholId, setOfferScholId] = useState(null);
  const [detailScholId, setDetailScholId] = useState(null);

  const loadApplications = useCallback(() => {
    return apiFetch("/sis-lms/scholarships/my-applications")
      .then((data) => setApplications(data.applications || []))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    loadApplications().finally(() => setLoading(false));
  }, [loadApplications]);

  const counts = useMemo(() => {
    const c = { all: applications.length, draft: 0, in_review: 0, offer: 0, awarded: 0 };
    applications.forEach((a) => {
      const cat = appCategory(a);
      if (cat in c) c[cat] += 1;
    });
    return c;
  }, [applications]);

  const filtered = useMemo(() => {
    if (filter === "all") return applications;
    return applications.filter((a) => appCategory(a) === filter);
  }, [applications, filter]);

  const totalAwarded = useMemo(
    () =>
      applications
        .filter((a) => appCategory(a) === "awarded")
        .reduce((sum, a) => sum + awardAmount(a), 0),
    [applications]
  );

  const handleDeleteDraft = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      await apiFetch(
        `/sis-lms/scholarships/applications/draft/${encodeURIComponent(deleteTarget.schol_id)}`,
        { method: "DELETE" }
      );
      clearLocalDraftCache(deleteTarget.student_id, deleteTarget.schol_id);
      setDeleteTarget(null);
      if (expandedId === deleteTarget.schol_id) setExpandedId(null);
      await loadApplications();
    } catch (e) {
      setError(e.message || "Could not delete draft");
    } finally {
      setDeleting(false);
    }
  };

  const toggleExpand = (scholId) => {
    setExpandedId((prev) => (prev === scholId ? null : scholId));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress sx={{ color: BRAND.teal }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Page header ── */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: `${BRAND.teal}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EmojiEventsIcon sx={{ color: BRAND.teal, fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: BRAND.navy, lineHeight: 1.2 }}>
              My Scholarships
            </Typography>
            {totalAwarded > 0 && (
              <Typography variant="caption" sx={{ color: ST.colors.success, fontWeight: 700 }}>
                KES {totalAwarded.toLocaleString()} credited to tuition
              </Typography>
            )}
          </Box>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          endIcon={<ArrowForwardIcon />}
          onClick={() => router.push("/student/scholarships/available")}
          sx={{ bgcolor: BRAND.teal, textTransform: "none", fontWeight: 700, borderRadius: 2 }}
        >
          Browse scholarships
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ── Filters + counts (one bar, no separate stat cards) ── */}
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${ST.colors.border}`,
          borderRadius: 2.5,
          mb: 2,
          overflow: "hidden",
        }}
      >
        {/* Summary strip */}
        <Box
          sx={{
            px: 2.5,
            py: 1.25,
            bgcolor: ST.colors.bg,
            borderBottom: `1px solid ${ST.colors.border}`,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2.5,
          }}
        >
          {[
            { label: "Drafts", value: counts.draft, color: ST.colors.info },
            { label: "In review", value: counts.in_review, color: ST.colors.warning },
            { label: "Offers pending", value: counts.offer, color: ST.chart?.orange || "#f97316" },
            { label: "Credited", value: counts.awarded, color: ST.colors.success },
          ].map(({ label, value, color }, i) => (
            <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              {i > 0 && (
                <Divider orientation="vertical" flexItem sx={{ height: 16, alignSelf: "center" }} />
              )}
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: value > 0 ? color : ST.colors.border,
                  flexShrink: 0,
                  ml: i > 0 ? 1.5 : 0,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography
                variant="caption"
                fontWeight={800}
                sx={{ color: value > 0 ? color : ST.colors.textSecondary }}
              >
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Filter tabs */}
        <Tabs
          value={filter}
          onChange={(_, v) => setFilter(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 1,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 44, fontSize: 13 },
            "& .MuiTabs-indicator": { bgcolor: BRAND.teal, height: 3, borderRadius: "3px 3px 0 0" },
          }}
        >
          {FILTERS.map((f) => (
            <Tab
              key={f.id}
              value={f.id}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  {f.label}
                  <Box
                    component="span"
                    sx={{
                      bgcolor: filter === f.id ? BRAND.teal : ST.colors.bg,
                      color: filter === f.id ? "white" : ST.colors.textSecondary,
                      px: 0.75,
                      py: 0.1,
                      borderRadius: 1,
                      fontWeight: 700,
                      fontSize: 11,
                      minWidth: 18,
                      textAlign: "center",
                      display: "inline-block",
                    }}
                  >
                    {counts[f.id]}
                  </Box>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {filtered.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            border: `1px dashed ${ST.colors.border}`,
            borderRadius: 2.5,
          }}
        >
          <EmojiEventsIcon sx={{ fontSize: 48, color: ST.colors.textSecondary, mb: 1, opacity: 0.4 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {filter === "all" ? "No applications yet" : `No ${FILTERS.find((f) => f.id === filter)?.label?.toLowerCase()} applications`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {filter === "all"
              ? "Browse open scholarships and start your first application."
              : "Try another filter or browse available opportunities."}
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push("/student/scholarships/available")}
            sx={{ bgcolor: BRAND.teal, textTransform: "none", fontWeight: 700 }}
          >
            Browse available scholarships
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {filtered.map((app) => (
            <ScholarshipApplicationCard
              key={app.application_id || app.schol_id}
              app={app}
              expanded={expandedId === app.schol_id}
              onToggleExpand={() => toggleExpand(app.schol_id)}
              onOpenDetails={() => setDetailScholId(app.schol_id)}
              onContinue={() => router.push(`/student/scholarships/apply/${encodeURIComponent(app.schol_id)}`)}
              onRespondOffer={() => setOfferScholId(app.schol_id)}
              onDeleteDraft={() => setDeleteTarget(app)}
            />
          ))}
        </Stack>
      )}

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete draft?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This removes your saved draft for{" "}
            <strong>{deleteTarget?.scholarship_name || deleteTarget?.scholarship_details?.scholarship_name}</strong>.
            You can start a new application later from the catalog.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteDraft}
            color="error"
            variant="contained"
            disabled={deleting}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {deleting ? "Deleting…" : "Delete draft"}
          </Button>
        </DialogActions>
      </Dialog>

      <ScholarshipOfferDialog
        scholId={offerScholId}
        open={Boolean(offerScholId)}
        onClose={() => setOfferScholId(null)}
        onUpdated={loadApplications}
      />

      <StudentApplicationDetailDialog
        scholId={detailScholId}
        open={Boolean(detailScholId)}
        onClose={() => setDetailScholId(null)}
        onContinueDraft={(id) => {
          setDetailScholId(null);
          router.push(`/student/scholarships/apply/${encodeURIComponent(id)}`);
        }}
        onRespondOffer={(id) => {
          setDetailScholId(null);
          setOfferScholId(id);
        }}
      />
    </Box>
  );
}
