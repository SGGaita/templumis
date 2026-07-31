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
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FilterListIcon from "@mui/icons-material/FilterList";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import LinearProgress from "@mui/material/LinearProgress";
import ScienceIcon from "@mui/icons-material/Science";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditNoteIcon from "@mui/icons-material/EditNote";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import GavelIcon from "@mui/icons-material/Gavel";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CancelIcon from "@mui/icons-material/Cancel";
import GroupsIcon from "@mui/icons-material/Groups";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonIcon from "@mui/icons-material/Person";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

/* ── Pipeline stage classification from grant lifecycle_stage ── */
function pipelineStage(app) {
  const lcStage = String(app?.lifecycle_stage || "").toLowerCase();
  const status = String(app?.status || "").toLowerCase();
  const lifecycle = app?.lifecycle || {};
  const isPi = grantCategory(app) === "pi";

  if (status === "rejected") return "closed";

  if (isPi) {
    const offer = lifecycle.offer || {};
    const cr = lifecycle.compliance_review || {};
    const submitted = Boolean(lifecycle.proposal?.application_submitted);
    const endorsed = Boolean(lifecycle.proposal?.pi_confirmed);

    if (lcStage === "post_award" || lcStage === "closeout" || offer.status === "accepted") return "active";
    if (offer.status === "issued") return "review";
    if (endorsed || cr.overall_status === "pending" || cr.overall_status === "cleared") return "compliance";
    if (submitted || status === "submitted for review") return "review";
    return "draft";
  }

  if (status === "draft" || lcStage === "proposal_budget") return "draft";
  if (lcStage === "compliance" || lcStage === "osp_routing") return "compliance";
  if (lcStage === "peer_review") return "review";
  if (status === "approved" || status === "awarded" || lcStage === "post_award") return "active";
  return "draft";
}

const STAGE_CONFIG = {
  draft:      { label: "Draft",           bg: `${ST.colors.info}15`,    color: ST.colors.info,     icon: EditNoteIcon },
  compliance: { label: "Compliance",      bg: ST.colors.warningLight,   color: ST.colors.warning,  icon: HourglassEmptyIcon },
  review:     { label: "Under review",    bg: ST.colors.infoLight,      color: ST.colors.info,     icon: GavelIcon },
  active:     { label: "Active grant",    bg: ST.colors.successLight,   color: ST.colors.success,  icon: AccountBalanceIcon },
  closed:     { label: "Closed",          bg: ST.colors.errorLight,     color: ST.colors.error,    icon: CancelIcon },
};

const TABS = [
  { id: "all",        label: "All" },
  { id: "draft",      label: "Drafts" },
  { id: "compliance", label: "Compliance" },
  { id: "review",     label: "Under review" },
  { id: "active",     label: "Active" },
  { id: "closed",     label: "Closed" },
];

const fmtKES = (n) => (n && Number(n) > 0 ? `KES ${Number(n).toLocaleString()}` : "—");

function grantCategory(app) {
  const grantId = String(app?.grant_id || app?.grant_external_id || "");
  const type = String(app?.type || "").toLowerCase();
  if (grantId.startsWith("pi-") || type.includes("pi") || type.includes("principal")) return "pi";
  return "university";
}

function StageChip({ app, size = "small" }) {
  const stage = pipelineStage(app);
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <Chip size={size} icon={<Icon sx={{ fontSize: "12px !important" }} />} label={cfg.label}
      sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: cfg.bg, color: cfg.color, "& .MuiChip-icon": { color: `${cfg.color} !important` } }} />
  );
}

function CategoryChip({ app }) {
  const cat = grantCategory(app);
  const isPi = cat === "pi";
  return (
    <Chip size="small"
      icon={(isPi ? <GroupsIcon /> : <AccountBalanceIcon />)}
      label={isPi ? "PI Grant" : "University"}
      sx={{ height: 18, fontSize: 10, fontWeight: 600,
        bgcolor: isPi ? "#f5f3ff" : `${BRAND.teal}12`,
        color: isPi ? "#7c3aed" : BRAND.teal,
        "& .MuiChip-icon": { fontSize: "11px !important", color: isPi ? "#7c3aed !important" : `${BRAND.teal} !important` } }} />
  );
}

function KpiCard({ label, value, color, subtext, active, onClick }) {
  return (
    <Paper elevation={0} onClick={onClick} sx={{
      p: 2, borderRadius: 2.5, cursor: onClick ? "pointer" : "default",
      border: `1.5px solid ${active ? color : ST.colors.border}`,
      bgcolor: active ? `${color}08` : "white",
      transition: "all 0.15s",
      "&:hover": onClick ? { borderColor: color, bgcolor: `${color}08` } : {},
    }}>
      <Typography variant="h5" fontWeight={800} sx={{ color: color || BRAND.navy }}>{value ?? "—"}</Typography>
      <Typography variant="caption" fontWeight={700} sx={{ color: BRAND.navy, display: "block", mt: 0.25 }}>{label}</Typography>
      {subtext && <Typography variant="caption" color="text.secondary">{subtext}</Typography>}
    </Paper>
  );
}

/* ── Application detail dialog ── */
function AppDetailDialog({ open, app, onClose }) {
  if (!app) return null;
  const stage = pipelineStage(app);
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.draft;
  const cat = grantCategory(app);
  const isPi = cat === "pi";
  const initials = (app.recipient || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const lc = app.lifecycle || {};
  const proposal = lc.proposal || {};
  const budget = lc.budget || {};
  const piName = proposal.pi_name || app.form_data?.pi_name || "—";
  const piConfirmed = proposal.pi_confirmed;
  const totalRequested = budget.total_requested || Number(app.amount || 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: BRAND.navy, fontWeight: 700, fontSize: 14 }}>{initials}</Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: BRAND.navy, lineHeight: 1.2 }}>
              {app.project_title || app.grant_name || "Grant Application"}
            </Typography>
            <Typography variant="body2" color="text.secondary">{app.recipient} · {app.student_number || app.student_id}</Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
            <StageChip app={app} />
            <CategoryChip app={app} />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Summary strip */}
        <Box sx={{ px: 3, py: 2, bgcolor: ST.colors.bg, borderBottom: `1px solid ${ST.colors.border}` }}>
          <Grid container spacing={3}>
            {[
              { label: "Grant", value: app.grant_name || app.scholarship_name || "—" },
              { label: "Amount requested", value: fmtKES(totalRequested), color: ST.colors.success },
              { label: "Applied", value: app.applied || "—" },
              { label: "Type", value: app.type || "—" },
              { label: "Lifecycle stage", value: (app.lifecycle_stage || "—").replace(/_/g, " ") },
              { label: "Status", value: cfg.label, color: cfg.color },
            ].map(({ label, value, color }) => (
              <Grid item xs={6} sm={4} key={label}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{label}</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: color || BRAND.navy, mt: 0.25 }}>{value}</Typography>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ px: 3, py: 2.5 }}>
          <Grid container spacing={2.5}>
            {/* Student card */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 2, height: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25 }}>
                  <PersonIcon sx={{ fontSize: 15, color: BRAND.teal }} />
                  <Typography variant="caption" fontWeight={700} sx={{ color: BRAND.navy, textTransform: "uppercase", fontSize: 10, letterSpacing: 0.5 }}>Student</Typography>
                </Box>
                {[
                  { label: "Name", value: app.recipient },
                  { label: "Student number", value: app.student_number || app.student_id },
                  { label: "Programme", value: app.program },
                ].map(({ label, value }) => value && (
                  <Box key={label} sx={{ display: "flex", justifyContent: "space-between", py: 0.4 }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="caption" fontWeight={600} sx={{ color: BRAND.navy }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* PI / Grant card */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 2, height: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25 }}>
                  {isPi ? <GroupsIcon sx={{ fontSize: 15, color: "#7c3aed" }} /> : <ReceiptLongIcon sx={{ fontSize: 15, color: BRAND.teal }} />}
                  <Typography variant="caption" fontWeight={700} sx={{ color: BRAND.navy, textTransform: "uppercase", fontSize: 10, letterSpacing: 0.5 }}>
                    {isPi ? "PI Details" : "Application"}
                  </Typography>
                </Box>
                {[
                  { label: "Grant", value: app.grant_name },
                  isPi ? { label: "Principal Investigator", value: piName } : null,
                  isPi ? { label: "Supervisor endorsement", value: piConfirmed ? "Endorsed ✓" : "Pending", color: piConfirmed ? ST.colors.success : ST.colors.warning } : null,
                  { label: "Amount requested", value: fmtKES(totalRequested) },
                  { label: "Application ID", value: app.application_id || String(app.id) },
                ].filter(Boolean).map(({ label, value, color }) => value && (
                  <Box key={label} sx={{ display: "flex", justifyContent: "space-between", py: 0.4 }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="caption" fontWeight={600} sx={{ color: color || BRAND.navy }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* Budget summary */}
            {budget.lines && budget.lines.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mb: 1 }}>Budget Summary</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
                  {[
                    { label: "Total direct costs", value: fmtKES(budget.total_direct) },
                    { label: "Indirect (F&A)", value: fmtKES(budget.indirect) },
                    { label: "Total requested", value: fmtKES(budget.total_requested), color: ST.colors.success },
                  ].map(({ label, value, color }) => (
                    <Box key={label} sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>{label}</Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: color || BRAND.navy }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            )}

            {/* Proposal title */}
            {app.project_title && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: ST.colors.bg, borderRadius: 1.5, border: `1px solid ${ST.colors.border}` }}>
                  <Typography variant="caption" color="text.secondary" display="block" fontWeight={600} sx={{ mb: 0.5 }}>Project title</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: BRAND.navy }}>{app.project_title}</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 600 }}>Close</Button>
        {app.id && (
          <Button variant="contained" endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
            onClick={() => window.open(`/staff/grants/lifecycle?app=${app.id}`, "_blank")}
            sx={{ bgcolor: BRAND.navy, textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}>
            Full lifecycle view
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

/* ══ Main page ══ */
export default function GrantApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [reviewApp, setReviewApp] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/sis-lms/grants/applications/staff?limit=500")
      .then((res) => setApplications(Array.isArray(res) ? res : res.applications || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const grantNames = useMemo(() => {
    const names = [...new Set(applications.map((a) => a.grant_name || a.scholarship_name).filter(Boolean))];
    return names.sort();
  }, [applications]);

  const stageCounts = useMemo(() => {
    const c = { all: applications.length, draft: 0, compliance: 0, review: 0, active: 0, closed: 0 };
    applications.forEach((a) => { const s = pipelineStage(a); if (s in c) c[s]++; });
    return c;
  }, [applications]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return applications.filter((a) => {
      const stageMatch = tab === "all" || pipelineStage(a) === tab;
      const typeMatch = typeFilter === "all" || (a.grant_name || a.scholarship_name) === typeFilter;
      const searchMatch = !q ||
        (a.recipient || "").toLowerCase().includes(q) ||
        (a.student_number || a.student_id || "").toLowerCase().includes(q) ||
        (a.grant_name || a.scholarship_name || "").toLowerCase().includes(q) ||
        (a.project_title || "").toLowerCase().includes(q);
      return stageMatch && typeMatch && searchMatch;
    });
  }, [applications, tab, typeFilter, search]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const activeGrantAmount = useMemo(
    () => applications.filter((a) => pipelineStage(a) === "active").reduce((s, a) => s + Number(a.amount || 0), 0),
    [applications]
  );

  const avatarColor = (name) => {
    const colors = [BRAND.navy, BRAND.teal, ST.chart.purple, ST.chart.blue, ST.chart.orange];
    return colors[(name || "?").charCodeAt(0) % colors.length];
  };

  return (
    <Box>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, background: `linear-gradient(135deg, ${BRAND.navy} 0%, #1e3a5f 100%)` }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${BRAND.teal}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ScienceIcon sx={{ color: BRAND.teal, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: "white", lineHeight: 1.2 }}>Grant Applications</Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)" }}>All postgraduate grant applications · live from database</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            {[
              { label: "Total", value: loading ? "—" : applications.length },
              { label: "In pipeline", value: loading ? "—" : stageCounts.compliance + stageCounts.review },
              { label: "Active grants", value: loading ? "—" : stageCounts.active, color: BRAND.teal },
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
          <KpiCard label="Total applications" value={loading ? "—" : applications.length} color={BRAND.navy} subtext={`${grantNames.length} grant programme${grantNames.length !== 1 ? "s" : ""}`} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Compliance / Routing" value={loading ? "—" : stageCounts.compliance} color={ST.colors.warning} subtext="Awaiting ethics & sign-off" active={tab === "compliance"} onClick={() => { setTab("compliance"); setPage(0); }} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Under review" value={loading ? "—" : stageCounts.review} color={ST.colors.info} subtext="Peer review panel" active={tab === "review"} onClick={() => { setTab("review"); setPage(0); }} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Active grants" value={loading ? "—" : stageCounts.active} color={ST.colors.success} subtext={activeGrantAmount > 0 ? `KES ${activeGrantAmount.toLocaleString()} awarded` : "Funds disbursed"} active={tab === "active"} onClick={() => { setTab("active"); setPage(0); }} />
        </Grid>
      </Grid>

      {/* Table card */}
      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, overflow: "hidden" }}>
        <Box sx={{ borderBottom: `1px solid ${ST.colors.border}` }}>
          <Box sx={{ px: 2, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
            <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }} variant="scrollable" scrollButtons="auto"
              sx={{ minHeight: 46, "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 46, fontSize: 13, px: 1.5 }, "& .MuiTabs-indicator": { bgcolor: BRAND.teal, height: 3, borderRadius: "3px 3px 0 0" } }}>
              {TABS.map((t) => {
                const count = t.id === "all" ? stageCounts.all : (stageCounts[t.id] || 0);
                return (
                  <Tab key={t.id} value={t.id} label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      {t.label}
                      <Box component="span" sx={{ bgcolor: tab === t.id ? BRAND.teal : ST.colors.bg, color: tab === t.id ? "white" : ST.colors.textSecondary, px: 0.75, py: 0.1, borderRadius: 1, fontWeight: 700, fontSize: 10, minWidth: 18, textAlign: "center" }}>
                        {loading ? "—" : count}
                      </Box>
                    </Box>
                  } />
                );
              })}
            </Tabs>
          </Box>
          <Box sx={{ px: 2, pb: 1.5, pt: 0.75, display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
            <TextField size="small" placeholder="Search student, ID, grant, or project title…"
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: ST.colors.textSecondary }} /></InputAdornment> }}
              sx={{ width: 300, "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: 13 } }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FilterListIcon sx={{ fontSize: 16, color: ST.colors.textSecondary }} />
              <Select size="small" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                sx={{ minWidth: 200, borderRadius: 1.5, fontSize: 13 }}>
                <MenuItem value="all" sx={{ fontSize: 13 }}>All grants</MenuItem>
                {grantNames.map((n) => <MenuItem key={n} value={n} sx={{ fontSize: 13 }}>{n}</MenuItem>)}
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
                  <TableCell>Grant</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Project title</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Applied</TableCell>
                  <TableCell>Stage</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 7 }}>
                      <ScienceIcon sx={{ fontSize: 36, color: ST.colors.textSecondary, opacity: 0.25, mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {search || typeFilter !== "all" ? "No applications match your filters." : "No grant applications submitted yet."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((app, i) => {
                    const stage = pipelineStage(app);
                    const initials = (app.recipient || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                    const isActionable = ["compliance", "review"].includes(stage);
                    return (
                      <TableRow key={app.id || app.application_id || i}
                        sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: `${BRAND.teal}04` } }}>
                        <TableCell sx={{ maxWidth: 180 }}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.navy, fontSize: 13 }} noWrap>
                            {app.grant_name || app.scholarship_name || "—"}
                          </Typography>
                          <CategoryChip app={app} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 700, bgcolor: avatarColor(app.recipient) }}>{initials}</Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13, color: BRAND.navy }} noWrap>{app.recipient || "—"}</Typography>
                              <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontFamily: "monospace", fontSize: 10 }}>
                                {app.student_number || app.student_id || ""}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="caption" sx={{ color: ST.colors.textSecondary }} noWrap>
                            {app.project_title || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} sx={{ color: ST.colors.success, fontSize: 13 }}>
                            {fmtKES(app.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
                            {app.applied || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StageChip app={app} />
                          {app.lifecycle_stage && (
                            <Typography variant="caption" sx={{ display: "block", color: ST.colors.textSecondary, fontSize: 10, mt: 0.3 }}>
                              {app.lifecycle_stage.replace(/_/g, " ")}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {isActionable ? (
                            <Button size="small" variant="contained"
                              startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 14 }} />}
                              onClick={() => setReviewApp(app)}
                              sx={{ bgcolor: BRAND.navy, textTransform: "none", fontWeight: 600, fontSize: 12, borderRadius: 1.5, px: 1.5, py: 0.5 }}>
                              Review
                            </Button>
                          ) : (
                            <Button size="small" variant="outlined"
                              startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 14 }} />}
                              onClick={() => setReviewApp(app)}
                              sx={{ textTransform: "none", fontWeight: 600, fontSize: 12, borderRadius: 1.5, px: 1.5, py: 0.5, borderColor: ST.colors.border, color: ST.colors.textSecondary }}>
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
              <TablePagination component="div" count={filtered.length} page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 15, 25, 50]}
                sx={{ "& .MuiTablePagination-toolbar": { minHeight: 44 }, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 12 } }} />
            </Box>
          </>
        )}
      </Paper>
      <AppDetailDialog open={Boolean(reviewApp)} app={reviewApp} onClose={() => setReviewApp(null)} />
    </Box>
  );
}
