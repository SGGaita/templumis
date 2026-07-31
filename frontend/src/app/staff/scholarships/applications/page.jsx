"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Tooltip from "@mui/material/Tooltip";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import LinearProgress from "@mui/material/LinearProgress";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditNoteIcon from "@mui/icons-material/EditNote";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import GavelIcon from "@mui/icons-material/Gavel";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CancelIcon from "@mui/icons-material/Cancel";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonIcon from "@mui/icons-material/Person";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

/* ── Pipeline stage classification ── */
function pipelineStage(app) {
  const stage = app?.award_stage;
  const status = String(app?.status || "").toLowerCase();
  if (status === "draft") return "draft";
  if (stage === "offer_sent") return "offer_pending";
  if (stage === "offer_accepted") return "offer_accepted";
  if (stage === "offer_declined" || stage === "offer_expired") return "offer_closed";
  if (stage === "credited" || status === "awarded" || status === "active") return "credited";
  if (stage === "proposed" || stage === "approved") return "decision";
  return "in_review";
}

const STAGE_CONFIG = {
  draft:          { label: "Draft",           bg: `${ST.colors.info}15`,    color: ST.colors.info,           icon: EditNoteIcon },
  in_review:      { label: "Under review",    bg: ST.colors.warningLight,   color: ST.colors.warning,        icon: HourglassEmptyIcon },
  decision:       { label: "Decision",        bg: ST.colors.infoLight,      color: ST.colors.info,           icon: GavelIcon },
  offer_pending:  { label: "Offer sent",      bg: `${ST.chart.orange}18`,   color: ST.chart.orange || "#f97316", icon: MailOutlineIcon },
  offer_accepted: { label: "Offer accepted",  bg: ST.colors.infoLight,      color: ST.colors.info,           icon: CheckCircleOutlineIcon },
  offer_closed:   { label: "Offer closed",    bg: ST.colors.errorLight,     color: ST.colors.error,          icon: CancelIcon },
  credited:       { label: "Credited",        bg: ST.colors.successLight,   color: ST.colors.success,        icon: AccountBalanceIcon },
};

const TABS = [
  { id: "all",           label: "All" },
  { id: "draft",         label: "Drafts" },
  { id: "in_review",     label: "Under review" },
  { id: "decision",      label: "Decision" },
  { id: "offer_pending", label: "Offer sent" },
  { id: "credited",      label: "Credited" },
];

const fmtKES = (n) => (n && Number(n) > 0 ? `KES ${Number(n).toLocaleString()}` : "—");

function StageChip({ app, size = "small" }) {
  const stage = pipelineStage(app);
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.in_review;
  const Icon = cfg.icon;
  return (
    <Chip
      size={size}
      icon={<Icon sx={{ fontSize: "12px !important" }} />}
      label={cfg.label}
      sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: cfg.bg, color: cfg.color, "& .MuiChip-icon": { color: `${cfg.color} !important` } }}
    />
  );
}

function KpiCard({ label, value, color, subtext, active, onClick }) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2, borderRadius: 2.5, cursor: onClick ? "pointer" : "default",
        border: `1.5px solid ${active ? color : ST.colors.border}`,
        bgcolor: active ? `${color}08` : "white",
        transition: "all 0.15s",
        "&:hover": onClick ? { borderColor: color, bgcolor: `${color}08` } : {},
      }}
    >
      <Typography variant="h5" fontWeight={800} sx={{ color: color || BRAND.navy }}>{value ?? "—"}</Typography>
      <Typography variant="caption" fontWeight={700} sx={{ color: BRAND.navy, display: "block", mt: 0.25 }}>{label}</Typography>
      {subtext && <Typography variant="caption" color="text.secondary">{subtext}</Typography>}
    </Paper>
  );
}

/* ── Application detail dialog ── */
function AppDetailDialog({ open, app, triageDetail, triageLoading, onClose }) {
  if (!app) return null;

  const stage = pipelineStage(app);
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.in_review;
  const initials = (app.recipient || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const eligChecks = triageDetail?.eligibility_comparison?.checks || [];
  const objectiveMetrics = triageDetail?.objective_metrics || {};
  const essay = triageDetail?.essay_scrubbed;
  const docs = triageDetail?.supporting_documents || [];
  const overallPass = triageDetail?.eligibility_comparison?.overall_pass;
  const financialNeed = triageDetail?.financial_need_summary;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: BRAND.navy, fontWeight: 700, fontSize: 14 }}>{initials}</Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: BRAND.navy, lineHeight: 1.2 }}>{app.scholarship_name || "—"}</Typography>
            <Typography variant="body2" color="text.secondary">{app.recipient} · {app.student_id}</Typography>
          </Box>
          <StageChip app={app} />
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Summary strip */}
        <Box sx={{ px: 3, py: 2, bgcolor: ST.colors.bg, borderBottom: `1px solid ${ST.colors.border}` }}>
          <Grid container spacing={3}>
            {[
              { label: "Amount", value: fmtKES(app.amount), color: ST.colors.success },
              { label: "Applied", value: app.applied || "—" },
              { label: "Type", value: app.scholarship_type || "—" },
              { label: "Pipeline stage", value: cfg.label, color: cfg.color },
              ...(app.award_stage ? [{ label: "Award stage", value: app.award_stage.replace(/_/g, " ") }] : []),
            ].map(({ label, value, color }) => (
              <Grid item xs={6} sm={4} key={label}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{label}</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: color || BRAND.navy, mt: 0.25 }}>{value}</Typography>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ px: 3, py: 2.5 }}>
          {triageLoading ? (
            <Box sx={{ py: 4 }}>
              <LinearProgress sx={{ borderRadius: 2, "& .MuiLinearProgress-bar": { bgcolor: BRAND.teal } }} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block", textAlign: "center" }}>
                Loading triage details…
              </Typography>
            </Box>
          ) : triageDetail && !triageDetail._error ? (
            <>
              {/* Financial need summary */}
              {financialNeed && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mb: 1.25 }}>Financial need</Typography>
                  <Grid container spacing={1.5}>
                    {Object.entries(financialNeed).slice(0, 6).map(([k, v]) => (
                      <Grid item xs={6} sm={4} key={k}>
                        <Box sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 1.25 }}>
                          <Typography variant="caption" color="text.secondary" display="block">{k.replace(/_/g, " ")}</Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.navy }}>{v ?? "—"}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Eligibility checks */}
              {eligChecks.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy }}>Eligibility check</Typography>
                    <Chip
                      size="small"
                      icon={overallPass
                        ? <CheckCircleIcon sx={{ fontSize: "12px !important" }} />
                        : <CancelIcon sx={{ fontSize: "12px !important" }} />
                      }
                      label={overallPass ? "All criteria met" : "Requirements not met"}
                      sx={{
                        height: 20, fontSize: 10, fontWeight: 700,
                        bgcolor: overallPass ? ST.colors.successLight : ST.colors.errorLight,
                        color: overallPass ? ST.colors.success : ST.colors.error,
                        "& .MuiChip-icon": { color: `${overallPass ? ST.colors.success : ST.colors.error} !important` },
                      }}
                    />
                  </Box>
                  <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, color: ST.colors.textSecondary, bgcolor: ST.colors.bg, py: 1 } }}>
                          <TableCell>Criterion</TableCell>
                          <TableCell>Required</TableCell>
                          <TableCell>Applicant</TableCell>
                          <TableCell align="center">Match</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {eligChecks.map((row, i) => (
                          <TableRow key={i} sx={{ bgcolor: row.passes === false ? `${ST.colors.error}06` : "transparent", "&:last-child td": { border: 0 } }}>
                            <TableCell><Typography variant="body2" fontWeight={600}>{row.criterion}</Typography></TableCell>
                            <TableCell><Typography variant="caption">{row.required}</Typography></TableCell>
                            <TableCell><Typography variant="caption">{row.actual}</Typography></TableCell>
                            <TableCell align="center">
                              {row.passes === true
                                ? <Chip size="small" icon={<CheckCircleIcon sx={{ fontSize: "12px !important" }} />} label="Meets" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: ST.colors.successLight, color: ST.colors.success, "& .MuiChip-icon": { color: `${ST.colors.success} !important` } }} />
                                : row.passes === false
                                ? <Chip size="small" icon={<CancelIcon sx={{ fontSize: "12px !important" }} />} label="Does not meet" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: ST.colors.errorLight, color: ST.colors.error, "& .MuiChip-icon": { color: `${ST.colors.error} !important` } }} />
                                : <Chip size="small" icon={<HelpOutlineIcon sx={{ fontSize: "12px !important" }} />} label="Review manually" sx={{ height: 18, fontSize: 10 }} />
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Paper>
                </Box>
              )}

              {/* Objective metrics */}
              {Object.keys(objectiveMetrics).length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mb: 1.25 }}>Academic profile</Typography>
                  <Grid container spacing={1.5}>
                    {Object.entries(objectiveMetrics).map(([k, v]) => (
                      <Grid item xs={6} sm={3} key={k}>
                        <Box sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 1.25 }}>
                          <Typography variant="caption" color="text.secondary" display="block">{k.replace(/_/g, " ")}</Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.navy }}>{v ?? "—"}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Essay */}
              {essay && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25 }}>
                    <VisibilityOffIcon sx={{ fontSize: 15, color: ST.colors.textSecondary }} />
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy }}>Personal statement (scrubbed)</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: ST.colors.bg, borderRadius: 1.5, border: `1px solid ${ST.colors.border}` }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: BRAND.navy }}>
                      {essay.slice(0, 1500)}{essay.length > 1500 ? "…" : ""}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Documents */}
              {docs.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mb: 1.25 }}>Supporting documents ({docs.length})</Typography>
                  <List dense sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 1.5, py: 0 }}>
                    {docs.map((d, i) => (
                      <ListItem key={i} divider={i < docs.length - 1} sx={{ py: 0.75 }}>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{d.name}</Typography>}
                          secondary={d.size_mb != null ? `${d.size_mb} MB` : null}
                        />
                        {!d.previewable && (
                          <Typography variant="caption" color="text.secondary">Re-upload required</Typography>
                        )}
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </>
          ) : (
            /* No triage detail available — show what we have from the list */
            <Box>
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 1.5 }}>
                Full triage review data is available for applications in the triage pipeline. This application is at the <strong>{cfg.label}</strong> stage.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25 }}>
                      <PersonIcon sx={{ fontSize: 15, color: BRAND.teal }} />
                      <Typography variant="caption" fontWeight={700} sx={{ color: BRAND.navy, textTransform: "uppercase", fontSize: 10, letterSpacing: 0.5 }}>Student</Typography>
                    </Box>
                    {[
                      { label: "Name", value: app.recipient },
                      { label: "Student ID", value: app.student_id },
                      { label: "Programme", value: app.programme || app.program },
                    ].map(({ label, value }) => value && (
                      <Box key={label} sx={{ display: "flex", justifyContent: "space-between", py: 0.4 }}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="caption" fontWeight={600} sx={{ color: BRAND.navy }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25 }}>
                      <ReceiptLongIcon sx={{ fontSize: 15, color: BRAND.teal }} />
                      <Typography variant="caption" fontWeight={700} sx={{ color: BRAND.navy, textTransform: "uppercase", fontSize: 10, letterSpacing: 0.5 }}>Application</Typography>
                    </Box>
                    {[
                      { label: "Scholarship", value: app.scholarship_name },
                      { label: "Amount", value: fmtKES(app.amount) },
                      { label: "Applied", value: app.applied },
                      { label: "Status", value: app.status },
                      { label: "Award stage", value: app.award_stage?.replace(/_/g, " ") },
                    ].map(({ label, value }) => value && (
                      <Box key={label} sx={{ display: "flex", justifyContent: "space-between", py: 0.4 }}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="caption" fontWeight={600} sx={{ color: BRAND.navy }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 600 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

/* ══ Main page ══ */
export default function ScholarshipApplicationsPage() {
  const router = useRouter();
  const [data, setData] = useState({ applications: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [scholarshipFilter, setScholarshipFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const [reviewApp, setReviewApp] = useState(null);
  const [triageDetail, setTriageDetail] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/sis-lms/scholarships/applications/staff?limit=500")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const applications = data.applications || [];
  const stats = data.stats || {};

  const scholarshipNames = useMemo(() => {
    const names = [...new Set(applications.map((a) => a.scholarship_name).filter(Boolean))];
    return names.sort();
  }, [applications]);

  const stageCounts = useMemo(() => {
    const c = { all: applications.length, draft: 0, in_review: 0, decision: 0, offer_pending: 0, offer_accepted: 0, offer_closed: 0, credited: 0 };
    applications.forEach((a) => { const s = pipelineStage(a); if (s in c) c[s]++; });
    return c;
  }, [applications]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return applications.filter((a) => {
      const stageMatch = tab === "all" || pipelineStage(a) === tab;
      const scholMatch = scholarshipFilter === "all" || a.scholarship_name === scholarshipFilter;
      const searchMatch = !q || (a.recipient || "").toLowerCase().includes(q) || (a.student_id || "").toLowerCase().includes(q) || (a.scholarship_name || "").toLowerCase().includes(q);
      return stageMatch && scholMatch && searchMatch;
    });
  }, [applications, tab, scholarshipFilter, search]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const totalCredited = useMemo(
    () => applications.filter((a) => pipelineStage(a) === "credited").reduce((s, a) => s + Number(a.amount || 0), 0),
    [applications]
  );

  const avatarColor = (name) => {
    const colors = [BRAND.navy, BRAND.teal, ST.chart.purple, ST.chart.blue, ST.chart.orange];
    return colors[(name || "?").charCodeAt(0) % colors.length];
  };

  const openReview = async (app) => {
    setReviewApp(app);
    setTriageDetail(null);
    setTriageLoading(true);
    try {
      const id = app.application_id || app.id;
      const detail = await apiFetch(`/sis-lms/financial-aid/triage/applications/${id}`);
      setTriageDetail(detail);
    } catch {
      setTriageDetail({ _error: true });
    } finally {
      setTriageLoading(false);
    }
  };

  const closeReview = () => { setReviewApp(null); setTriageDetail(null); };

  return (
    <Box>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, background: `linear-gradient(135deg, ${BRAND.navy} 0%, #1e3a5f 100%)` }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${BRAND.teal}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <EmojiEventsIcon sx={{ color: BRAND.teal, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: "white", lineHeight: 1.2 }}>Scholarship Applications</Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)" }}>All student scholarship applications · live from database</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            {[
              { label: "Total", value: loading ? "—" : applications.length },
              { label: "In pipeline", value: loading ? "—" : (stageCounts.in_review + stageCounts.decision + stageCounts.offer_pending) },
              { label: "Credited", value: loading ? "—" : stageCounts.credited, color: BRAND.teal },
            ].map(({ label, value, color }) => (
              <Box key={label} sx={{ textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: 10, display: "block" }}>{label}</Typography>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: color || "white" }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* KPI cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Total applications" value={loading ? "—" : stats.total_applications ?? applications.length} color={BRAND.navy} subtext={`${scholarshipNames.length} scholarship${scholarshipNames.length !== 1 ? "s" : ""}`} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Under review" value={loading ? "—" : (stats.pending_review ?? stageCounts.in_review)} color={ST.colors.warning} subtext="Awaiting triage or committee" active={tab === "in_review"} onClick={() => { setTab("in_review"); setPage(0); }} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Offer stage" value={loading ? "—" : stageCounts.offer_pending} color={ST.chart.orange || "#f97316"} subtext="Awaiting student response" active={tab === "offer_pending"} onClick={() => { setTab("offer_pending"); setPage(0); }} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Credited" value={loading ? "—" : (stats.active_recipients ?? stageCounts.credited)} color={ST.colors.success} subtext={totalCredited > 0 ? `KES ${totalCredited.toLocaleString()} disbursed` : "Awards applied to fees"} active={tab === "credited"} onClick={() => { setTab("credited"); setPage(0); }} />
        </Grid>
      </Grid>

      {/* Table card */}
      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, overflow: "hidden" }}>
        <Box sx={{ borderBottom: `1px solid ${ST.colors.border}` }}>
          <Box sx={{ px: 2, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => { setTab(v); setPage(0); }}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ minHeight: 46, "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 46, fontSize: 13, px: 1.5 }, "& .MuiTabs-indicator": { bgcolor: BRAND.teal, height: 3, borderRadius: "3px 3px 0 0" } }}
            >
              {TABS.map((t) => {
                const count = t.id === "all" ? stageCounts.all : (stageCounts[t.id] || 0);
                return (
                  <Tab
                    key={t.id}
                    value={t.id}
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        {t.label}
                        <Box component="span" sx={{ bgcolor: tab === t.id ? BRAND.teal : ST.colors.bg, color: tab === t.id ? "white" : ST.colors.textSecondary, px: 0.75, py: 0.1, borderRadius: 1, fontWeight: 700, fontSize: 10, minWidth: 18, textAlign: "center" }}>
                          {loading ? "—" : count}
                        </Box>
                      </Box>
                    }
                  />
                );
              })}
            </Tabs>
          </Box>
          <Box sx={{ px: 2, pb: 1.5, pt: 0.75, display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Search student name, ID, or scholarship…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: ST.colors.textSecondary }} /></InputAdornment> }}
              sx={{ width: 280, "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: 13 } }}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FilterListIcon sx={{ fontSize: 16, color: ST.colors.textSecondary }} />
              <Select
                size="small"
                value={scholarshipFilter}
                onChange={(e) => { setScholarshipFilter(e.target.value); setPage(0); }}
                sx={{ minWidth: 200, borderRadius: 1.5, fontSize: 13 }}
              >
                <MenuItem value="all" sx={{ fontSize: 13 }}>All scholarships</MenuItem>
                {scholarshipNames.map((n) => <MenuItem key={n} value={n} sx={{ fontSize: 13 }}>{n}</MenuItem>)}
              </Select>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
              {loading ? "Loading…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}><CircularProgress size={28} sx={{ color: BRAND.teal }} /></Box>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, color: ST.colors.textSecondary, py: 1.25, bgcolor: ST.colors.bg, letterSpacing: 0.3, borderBottom: `1px solid ${ST.colors.border}` } }}>
                  <TableCell>Scholarship</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Applied</TableCell>
                  <TableCell>Pipeline stage</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                      <EmojiEventsIcon sx={{ fontSize: 36, color: ST.colors.textSecondary, opacity: 0.25, mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {search || scholarshipFilter !== "all" ? "No applications match your filters." : "No applications submitted yet."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((app, i) => {
                    const stage = pipelineStage(app);
                    const initials = (app.recipient || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                    const isActionable = ["in_review", "decision", "offer_pending"].includes(stage);
                    return (
                      <TableRow key={app.id || app.application_id || i} sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: `${BRAND.teal}04` }, bgcolor: stage === "offer_pending" ? `${ST.chart.orange || "#f97316"}05` : "transparent" }}>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.navy }} noWrap>{app.scholarship_name || "—"}</Typography>
                          {app.scholarship_type && <Typography variant="caption" color="text.secondary">{app.scholarship_type}</Typography>}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 700, bgcolor: avatarColor(app.recipient) }}>{initials}</Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13, color: BRAND.navy }} noWrap>{app.recipient || "—"}</Typography>
                              <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontFamily: "monospace", fontSize: 10 }}>{app.student_id || ""}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} sx={{ color: ST.colors.success, fontSize: 13 }}>{fmtKES(app.amount)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{app.applied || "—"}</Typography>
                        </TableCell>
                        <TableCell>
                          <StageChip app={app} />
                          {app.award_stage && app.award_stage !== "credited" && (
                            <Typography variant="caption" sx={{ display: "block", color: ST.colors.textSecondary, fontSize: 10, mt: 0.3 }}>{app.award_stage.replace(/_/g, " ")}</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {isActionable ? (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 14 }} />}
                              onClick={() => openReview(app)}
                              sx={{ bgcolor: BRAND.navy, textTransform: "none", fontWeight: 600, fontSize: 12, borderRadius: 1.5, px: 1.5, py: 0.5 }}
                            >
                              Review
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 14 }} />}
                              onClick={() => openReview(app)}
                              sx={{ textTransform: "none", fontWeight: 600, fontSize: 12, borderRadius: 1.5, px: 1.5, py: 0.5, borderColor: ST.colors.border, color: ST.colors.textSecondary }}
                            >
                              View
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <Box sx={{ borderTop: `1px solid ${ST.colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, bgcolor: ST.colors.bg }}>
              <Typography variant="caption" color="text.secondary" sx={{ py: 1 }}>
                {filtered.length > 0 && `Showing ${page * rowsPerPage + 1}–${Math.min((page + 1) * rowsPerPage, filtered.length)} of ${filtered.length}`}
              </Typography>
              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 15, 25, 50]}
                sx={{ "& .MuiTablePagination-toolbar": { minHeight: 44 }, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 12 } }}
              />
            </Box>
          </>
        )}
      </Paper>
      {/* App detail dialog */}
      <AppDetailDialog
        open={Boolean(reviewApp)}
        app={reviewApp}
        triageDetail={triageDetail}
        triageLoading={triageLoading}
        onClose={closeReview}
      />
    </Box>
  );
}
