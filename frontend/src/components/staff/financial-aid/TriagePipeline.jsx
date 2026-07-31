"use client";

import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import SettingsIcon from "@mui/icons-material/Settings";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import DialogContentText from "@mui/material/DialogContentText";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import DocumentPreviewDialog from "./DocumentPreviewDialog";
import FinancialNeedSummary from "./FinancialNeedSummary";

function EligibilityMatchChip({ passes }) {
  if (passes === true) {
    return (
      <Chip
        size="small"
        icon={<CheckCircleIcon sx={{ fontSize: "14px !important" }} />}
        label="Meets"
        sx={{ bgcolor: ST.colors.successLight, color: ST.colors.success, fontWeight: 700 }}
      />
    );
  }
  if (passes === false) {
    return (
      <Chip
        size="small"
        icon={<CancelIcon sx={{ fontSize: "14px !important" }} />}
        label="Does not meet"
        sx={{ bgcolor: ST.colors.errorLight, color: ST.colors.error, fontWeight: 700 }}
      />
    );
  }
  return (
    <Chip
      size="small"
      icon={<HelpOutlineIcon sx={{ fontSize: "14px !important" }} />}
      label="Review manually"
      sx={{ bgcolor: ST.colors.bg, fontWeight: 600 }}
    />
  );
}

const QUEUE_TABS = [
  { id: "", label: "All queues" },
  { id: "pending_triage", label: "Pending triage" },
  { id: "rejection_automated", label: "Rejection (automated)" },
  { id: "document_verification", label: "Document verification" },
  { id: "ready_for_committee", label: "Ready for committee" },
  { id: "assigned", label: "Assigned" },
];

const queueColor = {
  rejection_automated: ST.colors.error,
  document_verification: ST.colors.warning,
  ready_for_committee: ST.chart.blue,
  assigned: ST.colors.success,
  pending_triage: ST.colors.textSecondary,
};

export default function TriagePipeline() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState(null);
  const [counts, setCounts] = useState({});
  const [applications, setApplications] = useState([]);
  const [detail, setDetail] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [minReviewers, setMinReviewers] = useState(2);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPreview, setAssignPreview] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState([]);
  const [inviteEmails, setInviteEmails] = useState([]);
  const [inviteEmailInput, setInviteEmailInput] = useState("");
  const [inviteNameInput, setInviteNameInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const queueFilter = QUEUE_TABS[tab]?.id || "";

  const isAssignable = (app) =>
    app.triage_queue === "ready_for_committee" ||
    (app.triage_queue === "document_verification" && app.documents_verified);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [settingsRes, queuesRes] = await Promise.all([
        apiFetch("/sis-lms/financial-aid/triage/settings"),
        apiFetch(`/sis-lms/financial-aid/triage/queues${queueFilter ? `?queue=${queueFilter}` : ""}`),
      ]);
      setSettings(settingsRes);
      setMinReviewers(settingsRes.min_reviewers_per_application ?? 2);
      setCounts(queuesRes.counts || {});
      setApplications(queuesRes.applications || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [queueFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const saveSettings = async () => {
    setBusy("settings");
    try {
      await apiFetch("/sis-lms/financial-aid/triage/settings", {
        method: "PATCH",
        body: {
          blind_review_enabled: false,
          min_reviewers_per_application: minReviewers,
          cycle_year: settings?.cycle_year,
        },
      });
      setSuccess("Settings saved");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const runScreenSingle = async (applicationId) => {
    setBusy(`screen-${applicationId}`);
    setSuccess("");
    try {
      const res = await apiFetch(
        `/sis-lms/financial-aid/triage/applications/${applicationId}/run-high-pass`,
        { method: "POST" }
      );
      const label = (res.outcome || res.triage_queue || "updated").replace(/_/g, " ");
      setSuccess(`Application screened → ${label}`);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const openAssignDialog = async (applicationId) => {
    setAssignTarget(applicationId);
    setAssignOpen(true);
    setAssignPreview(null);
    setInviteEmails([]);
    setInviteEmailInput("");
    setInviteNameInput("");
    setSelectedReviewerIds([]);
    setError("");
    try {
      const preview = await apiFetch("/sis-lms/financial-aid/triage/assignment-preview");
      setAssignPreview(preview);
    } catch (e) {
      setError(e.message);
      setAssignOpen(false);
    }
  };

  const addInviteEmail = () => {
    const email = inviteEmailInput.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setError("Enter a valid email address to invite.");
      return;
    }
    if (inviteEmails.some((e) => e.email === email)) {
      setError("This email is already in the invite list.");
      return;
    }
    setInviteEmails((prev) => [...prev, { email, full_name: inviteNameInput.trim() || undefined }]);
    setInviteEmailInput("");
    setInviteNameInput("");
    setError("");
  };

  const toggleReviewer = (id) => {
    setSelectedReviewerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const runAssign = async () => {
    if (!assignTarget) return;
    if (selectedReviewerIds.length === 0 && inviteEmails.length === 0) {
      setError("Select an existing reviewer or invite someone by email.");
      return;
    }
    setBusy("assign");
    setSuccess("");
    setError("");
    try {
      const res = await apiFetch(
        `/sis-lms/financial-aid/triage/applications/${assignTarget}/assign-reviewers`,
        {
          method: "POST",
          body: {
            reviewer_ids: selectedReviewerIds,
            invite_emails: inviteEmails,
          },
        }
      );
      const invited = (res.invites || []).filter((i) => i.is_new).length;
      setSuccess(
        `Assigned ${res.assigned_reviewers} reviewer(s).` +
          (res.emails_sent ? ` ${res.emails_sent} notification email(s) sent.` : "") +
          (invited ? ` ${invited} new reviewer invite(s) sent.` : "")
      );
      setAssignOpen(false);
      setAssignTarget(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const openDetail = async (id) => {
    try {
      const res = await apiFetch(`/sis-lms/financial-aid/triage/applications/${id}`);
      setDetail(res);
    } catch (e) {
      setError(e.message);
    }
  };

  const certifyDocs = async (id, verified) => {
    setBusy(`doc-${id}`);
    try {
      await apiFetch(`/sis-lms/financial-aid/triage/applications/${id}/verify-documents`, {
        method: "PATCH",
        body: { verified },
      });
      setSuccess(verified ? "Documents certified" : "Certification removed");
      setDetail(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/sis-lms/scholarships/applications/${deleteTarget.id}`, { method: "DELETE" });
      setSuccess(`Application deleted for ${deleteTarget.student_name}`);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(`Failed to delete: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
        Administrative triage & verification
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Stage 4 pipeline: high-pass filter, document certification, workload balancing, and blind-review IDs
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5, color: BRAND.navy }}>
          How the pipeline works
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Configure how many reviewers score each file, then work through the table below — screen, certify,
          and assign reviewers per application.
        </Typography>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${ST.colors.border}`,
            bgcolor: ST.colors.bg,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <SettingsIcon fontSize="small" sx={{ color: BRAND.navy, mt: 0.25 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                Committee review settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Set how many reviewers must score each application before awards are decided.
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    size="small"
                    type="number"
                    label="Reviewers per application"
                    helperText="Each file gets this many independent scores"
                    value={minReviewers}
                    onChange={(e) => setMinReviewers(Number(e.target.value))}
                    inputProps={{ min: 1, max: 5 }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    variant="outlined"
                    onClick={saveSettings}
                    disabled={busy === "settings"}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Save settings
                  </Button>
                </Grid>
              </Grid>
              {settings?.active_reviewers?.length > 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
                  Eligible committee accounts ({settings.active_reviewers.length}):{" "}
                  {settings.active_reviewers.map((r) => `${r.name} (${r.role})`).join(" · ")}
                </Typography>
              ) : (
                <Alert severity="info" sx={{ mt: 1.5 }}>
                  You can also invite external reviewers by email when assigning from the table.
                </Alert>
              )}
            </Box>
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { key: "pending_triage", label: "Pending" },
          { key: "rejection_automated", label: "Auto-rejected" },
          { key: "document_verification", label: "Doc verify" },
          { key: "ready_for_committee", label: "Ready" },
          { key: "assigned", label: "Assigned" },
        ].map(({ key, label }) => (
          <Grid item xs={6} sm={4} md key={key}>
            <Paper elevation={0} sx={{ p: 1.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2, textAlign: "center" }}>
              <Typography variant="h6" fontWeight={800} sx={{ color: queueColor[key] || ST.colors.textPrimary }}>
                {counts[key] ?? 0}
              </Typography>
              <Typography variant="caption">{label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: `1px solid ${ST.colors.border}` }}>
          {QUEUE_TABS.map((t) => (
            <Tab key={t.id || "all"} label={t.label} sx={{ textTransform: "none", fontWeight: 600 }} />
          ))}
        </Tabs>
        {loading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: ST.colors.bg }}>
                <TableCell>Anonymized ID</TableCell>
                <TableCell>Applicant (FAO view)</TableCell>
                <TableCell>Scholarship</TableCell>
                <TableCell>Queue</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No applications in this queue
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: "monospace" }}>
                        {app.anonymized_id || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>{app.student_name}</TableCell>
                    <TableCell>{app.scholarship_name}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={app.triage_queue?.replace(/_/g, " ")}
                        sx={{
                          fontWeight: 600,
                          fontSize: 10,
                          bgcolor: `${queueColor[app.triage_queue] || ST.colors.border}22`,
                          color: queueColor[app.triage_queue],
                        }}
                      />
                    </TableCell>
                    <TableCell>{app.status}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap">
                        {app.triage_queue === "pending_triage" && (
                          <Button
                            size="small"
                            startIcon={<PlayArrowIcon sx={{ fontSize: 16 }} />}
                            onClick={() => runScreenSingle(app.id)}
                            disabled={busy === `screen-${app.id}`}
                            sx={{ textTransform: "none", fontWeight: 600, color: BRAND.teal }}
                          >
                            Screen
                          </Button>
                        )}
                        {app.triage_queue === "document_verification" && !app.documents_verified && (
                          <Button
                            size="small"
                            startIcon={<VerifiedUserIcon sx={{ fontSize: 16 }} />}
                            onClick={() => certifyDocs(app.id, true)}
                            disabled={busy === `doc-${app.id}`}
                            sx={{ textTransform: "none", fontWeight: 600, color: BRAND.teal }}
                          >
                            Certify
                          </Button>
                        )}
                        {isAssignable(app) && (
                          <Button
                            size="small"
                            startIcon={<GroupWorkIcon sx={{ fontSize: 16 }} />}
                            onClick={() => openAssignDialog(app.id)}
                            sx={{ textTransform: "none", fontWeight: 600 }}
                          >
                            Assign
                          </Button>
                        )}
                        <Button size="small" onClick={() => openDetail(app.id)} sx={{ textTransform: "none" }}>
                          Review
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteTarget(app)}
                          sx={{ color: ST.colors.error }}
                          title="Delete application"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Triage review — {detail?.anonymized_id}
          {detail?.mapping && (
            <Typography variant="caption" display="block" color="text.secondary">
              {detail.mapping.student_name} ({detail.mapping.student_number})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {detail?.auto_reject_reason && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {detail.auto_reject_reason}
            </Alert>
          )}

          <FinancialNeedSummary summary={detail?.financial_need_summary} />

          {detail?.eligibility_comparison && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: BRAND.navy, mb: 1 }}>
                Eligibility vs programme requirements
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {detail.eligibility_comparison.program_requirements?.scholarship_name}
                {detail.eligibility_comparison.program_requirements?.type &&
                  ` · ${detail.eligibility_comparison.program_requirements.type}`}
              </Typography>
              <Alert
                severity={detail.eligibility_comparison.overall_pass ? "success" : "warning"}
                sx={{ mb: 2 }}
              >
                {detail.eligibility_comparison.overall_pass
                  ? "Applicant meets all configured hard constraints on current SIS data."
                  : "One or more requirements are not met on current SIS data — review before advancing."}
                {detail.eligibility_comparison.failure_reasons?.length > 0 && (
                  <Box component="ul" sx={{ m: 0, mt: 1, pl: 2 }}>
                    {detail.eligibility_comparison.failure_reasons.map((r) => (
                      <li key={r}>
                        <Typography variant="body2">{r}</Typography>
                      </li>
                    ))}
                  </Box>
                )}
              </Alert>
              {detail.eligibility_comparison.program_requirements?.description && (
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, mb: 2, bgcolor: ST.colors.bg, borderRadius: 1.5 }}
                >
                  <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                    Programme criteria (Stage 1)
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
                    {detail.eligibility_comparison.program_requirements.description}
                  </Typography>
                  {detail.eligibility_comparison.program_requirements.logic_summary && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                      Logic: {detail.eligibility_comparison.program_requirements.logic_summary}
                    </Typography>
                  )}
                </Paper>
              )}
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: ST.colors.bg }}>
                      <TableCell sx={{ fontWeight: 700 }}>Criterion</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Required</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Applicant (live SIS)</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        Match
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(detail.eligibility_comparison.checks || []).map((row, idx) => (
                      <TableRow
                        key={`${row.criterion}-${idx}`}
                        sx={{
                          bgcolor: row.passes === false ? `${ST.colors.error}08` : "transparent",
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {row.criterion}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.required}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={row.passes ? 600 : 400}>
                            {row.actual}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <EligibilityMatchChip passes={row.passes} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="overline" color="text.secondary">
                Objective metrics (committee-safe)
              </Typography>
              {detail?.objective_metrics &&
                Object.entries(detail.objective_metrics).map(([k, v]) => (
                  <Typography key={k} variant="body2">
                    <strong>{k.replace(/_/g, " ")}:</strong> {v ?? "—"}
                  </Typography>
                ))}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="overline" color="text.secondary">
                Masked / withheld
              </Typography>
              {detail?.masked_fields &&
                Object.entries(detail.masked_fields).map(([k, v]) => (
                  <Typography key={k} variant="body2" color="text.secondary">
                    {k.replace(/_/g, " ")}: {v ?? "—"}
                  </Typography>
                ))}
            </Grid>
          </Grid>
          {detail?.essay_scrubbed && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <VisibilityOffIcon fontSize="small" /> Scrubbed essay excerpt
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1, lineHeight: 1.6 }}>
                {detail.essay_scrubbed.slice(0, 1200)}
                {detail.essay_scrubbed.length > 1200 ? "…" : ""}
              </Typography>
            </>
          )}
          {detail?.supporting_documents?.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={700}>
                Supporting documents ({detail.supporting_documents.length})
              </Typography>
              <List dense sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 1.5 }}>
                {detail.supporting_documents.map((d, i) => (
                  <ListItem
                    key={d.storage_key || `${d.name}-${i}`}
                    secondaryAction={
                      d.previewable ? (
                        <Button
                          size="small"
                          startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                          onClick={() =>
                            setDocPreview({
                              path: `/sis-lms/financial-aid/triage/applications/${detail.application_id}/documents/${encodeURIComponent(d.storage_key)}`,
                              name: d.name,
                              mime: d.mime,
                            })
                          }
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          Preview
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 140 }}>
                          Re-upload required for preview
                        </Typography>
                      )
                    }
                  >
                    <ListItemText
                      primary={`✓ ${d.name}`}
                      secondary={d.size_mb != null ? `${d.size_mb} MB` : null}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
          {detail?.reviewers?.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={700}>
                Reviewer assignments
              </Typography>
              {detail.reviewers.map((r) => (
                <Typography key={r.slot} variant="body2">
                  Slot {r.slot}: {r.reviewer_name}
                </Typography>
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {detail?.triage_queue === "document_verification" && !detail?.documents_verified && (
            <Button
              startIcon={<VerifiedUserIcon />}
              variant="contained"
              onClick={() => certifyDocs(detail.application_id, true)}
              disabled={!!busy}
              sx={{ bgcolor: BRAND.teal, textTransform: "none" }}
            >
              Certify documents
            </Button>
          )}
          {(detail?.triage_queue === "ready_for_committee" ||
            (detail?.triage_queue === "document_verification" && detail?.documents_verified)) && (
            <Button
              startIcon={<GroupWorkIcon />}
              variant="contained"
              onClick={() => {
                const id = detail.application_id;
                setDetail(null);
                openAssignDialog(id);
              }}
              sx={{ bgcolor: BRAND.navy, textTransform: "none" }}
            >
              Assign reviewers
            </Button>
          )}
          <Button onClick={() => setDetail(null)} sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={assignOpen}
        onClose={() => !busy && setAssignOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Assign reviewers to this application
        </DialogTitle>
        <DialogContent dividers>
          {!assignPreview ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2 }}>
                Select internal committee members or invite an external reviewer by email.
                New invitees receive an account setup link, then the review task.
              </Alert>

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Invite by email
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1 }}>
                <TextField
                  size="small"
                  label="Reviewer email"
                  value={inviteEmailInput}
                  onChange={(e) => setInviteEmailInput(e.target.value)}
                  fullWidth
                />
                <TextField
                  size="small"
                  label="Name (optional)"
                  value={inviteNameInput}
                  onChange={(e) => setInviteNameInput(e.target.value)}
                  sx={{ minWidth: 160 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addInviteEmail}
                  sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                >
                  Add invite
                </Button>
              </Stack>
              {inviteEmails.length > 0 && (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 2, gap: 0.5 }}>
                  {inviteEmails.map((entry) => (
                    <Chip
                      key={entry.email}
                      icon={<EmailOutlinedIcon />}
                      label={entry.full_name ? `${entry.full_name} <${entry.email}>` : entry.email}
                      onDelete={() =>
                        setInviteEmails((prev) => prev.filter((e) => e.email !== entry.email))
                      }
                      size="small"
                    />
                  ))}
                </Stack>
              )}

              <Divider sx={{ my: 2 }} />

              {(assignPreview.reviewers || []).length > 0 ? (
                <>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Existing committee reviewers
                  </Typography>
                  <FormGroup>
                    {assignPreview.reviewers.map((r) => (
                      <FormControlLabel
                        key={r.id}
                        control={
                          <Checkbox
                            checked={selectedReviewerIds.includes(r.id)}
                            onChange={() => toggleReviewer(r.id)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {r.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {r.role}
                              {r.current_assignments > 0
                                ? ` · ${r.current_assignments} existing assignment(s)`
                                : ""}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>
                </>
              ) : (
                <Alert severity="info" sx={{ mb: 1 }}>
                  No internal committee accounts yet — use email invite above.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)} disabled={busy === "assign"} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={runAssign}
            disabled={
              busy === "assign" ||
              !assignPreview ||
              (selectedReviewerIds.length === 0 && inviteEmails.length === 0)
            }
            sx={{ bgcolor: BRAND.navy, textTransform: "none", fontWeight: 600 }}
          >
            {busy === "assign" ? "Assigning…" : "Assign & notify"}
          </Button>
        </DialogActions>
      </Dialog>

      <DocumentPreviewDialog
        open={Boolean(docPreview)}
        onClose={() => setDocPreview(null)}
        previewPath={docPreview?.path}
        fileName={docPreview?.name}
        mime={docPreview?.mime}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete Application?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this scholarship application?
            <br />
            <br />
            <strong>Student:</strong> {deleteTarget?.student_name}
            <br />
            <strong>Scholarship:</strong> {deleteTarget?.scholarship_name}
            <br />
            <strong>Status:</strong> {deleteTarget?.status}
            <br />
            <strong>Queue:</strong> {deleteTarget?.triage_queue?.replace(/_/g, " ")}
            <br />
            <br />
            This action cannot be undone. The student will be able to apply again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
