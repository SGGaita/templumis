"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Pagination from "@mui/material/Pagination";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import SearchIcon from "@mui/icons-material/Search";
import ScienceIcon from "@mui/icons-material/Science";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import EditNoteIcon from "@mui/icons-material/EditNote";
import BlockIcon from "@mui/icons-material/Block";
import GroupsIcon from "@mui/icons-material/Groups";
import StorageIcon from "@mui/icons-material/Storage";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonIcon from "@mui/icons-material/Person";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import { inferDegreeTier } from "@/lib/studentLevel";
import PiProjectBrief from "@/components/grants/PiProjectBrief";

const PAGE_SIZE = 10;

/* ── Mock PI grants ── */
const MOCK_PI_GRANTS = [
  {
    id: "pi-001",
    category: "pi",
    scholarship_name: "Prof. Kamau — Computational Biology Lab",
    type: "PI Grant",
    status: "open",
    description: "Funding for MSc and PhD students working on bioinformatics, genomic data analysis, or computational modelling of biological systems within Prof. Kamau's research group.",
    coverage: "Stipend + lab costs",
    "amount_(kes)": 480000,
    slots: 2,
    remaining: 2,
    total_slots: 2,
    pi_name: "Prof. J. Kamau",
    pi_department: "Computational Biology",
    endorsement_required: true,
    deadline: "31 Aug 2026",
    open_to: "PhD, Masters",
    position_type: "phd",
    scope_of_work: {
      position_type: "phd",
      research_question: "How can machine-learning models predict gene regulatory networks from multi-omics datasets in African crop species?",
      duration_months: 36,
      milestones: [
        { label: "Literature review & pipeline design", month: 6 },
        { label: "Data acquisition and model training", month: 18 },
        { label: "Validation on field samples & manuscript draft", month: 30 },
        { label: "Thesis submission and code release", month: 36 },
      ],
      reporting_obligations: "Monthly lab meetings; quarterly written progress reports to PI; annual presentation at departmental seminar.",
      expected_outputs: ["PhD thesis on computational genomics", "Open-source analysis pipeline", "At least one peer-reviewed publication"],
    },
  },
  {
    id: "pi-002",
    category: "pi",
    scholarship_name: "Dr. Wanjiru — Environmental Science Fund",
    type: "PI Grant",
    status: "open",
    description: "Research grants for postgraduate students studying climate adaptation, water resource management, or soil science under Dr. Wanjiru's supervision.",
    coverage: "Field work + equipment",
    "amount_(kes)": 320000,
    slots: 3,
    remaining: 1,
    total_slots: 3,
    pi_name: "Dr. A. Wanjiru",
    pi_department: "Environmental Science",
    endorsement_required: true,
    deadline: "15 Jul 2026",
    open_to: "PhD, Masters",
    position_type: "phd",
    scope_of_work: {
      position_type: "phd",
      research_question: "How do smallholder irrigation systems adapt to prolonged drought conditions in semi-arid Kenya?",
      duration_months: 36,
      milestones: [
        { label: "Literature review & study site selection", month: 6 },
        { label: "Field data collection — water and soil sampling", month: 18 },
        { label: "Data analysis & draft thesis chapters", month: 30 },
        { label: "Thesis submission & policy dissemination", month: 36 },
      ],
      reporting_obligations: "Quarterly progress reports to PI; annual presentation at departmental seminar; final thesis and one peer-reviewed publication.",
      expected_outputs: ["PhD thesis on climate-adaptive irrigation", "Minimum one Q1 journal article", "Policy brief for county water boards"],
    },
  },
  {
    id: "pi-003",
    category: "pi",
    scholarship_name: "Dr. Ochieng — Digital Health Innovation",
    type: "PI Grant",
    status: "open",
    description: "Supports postgraduate research in health informatics, telemedicine platforms, and AI-driven diagnostics. Preference for students with programming background.",
    coverage: "Stipend + conference travel",
    "amount_(kes)": 550000,
    slots: 2,
    remaining: 2,
    total_slots: 2,
    pi_name: "Dr. P. Ochieng",
    pi_department: "Health Informatics",
    endorsement_required: true,
    deadline: "30 Sep 2026",
    open_to: "PhD",
  },
  {
    id: "pi-004",
    category: "pi",
    scholarship_name: "Prof. Muthoni — Materials Science Lab",
    type: "PI Grant",
    status: "closed",
    description: "Research funding for advanced materials, nanomaterials, and renewable energy storage under Prof. Muthoni. Applications for next cycle open October 2026.",
    coverage: "Lab consumables + stipend",
    "amount_(kes)": 410000,
    slots: 2,
    remaining: 0,
    total_slots: 2,
    pi_name: "Prof. C. Muthoni",
    pi_department: "Materials Science",
    endorsement_required: true,
    deadline: "Closed",
    open_to: "PhD",
  },
];

/* ── Mock Grant Database subscriptions ── */
const MOCK_DB_GRANTS = [
  {
    id: "db-001",
    category: "db",
    scholarship_name: "NIH Research Portfolio (Grants.gov)",
    type: "Database",
    status: "open",
    description: "Access the full NIH Research Portfolio Open Reporting Suite. Browse thousands of federally-funded research grants. International applicants may apply to select open calls.",
    coverage: "Variable by NIH institute",
    "amount_(kes)": 0,
    portal_url: "https://grants.nih.gov",
    deadline: "Rolling",
    open_to: "PhD, PostDoc",
    notes: "Requires institutional registration. Contact OSP for access credentials.",
  },
  {
    id: "db-002",
    category: "db",
    scholarship_name: "African Development Bank Grants Portal",
    type: "Database",
    status: "open",
    description: "The AfDB grants portal lists research funding, fellowships, and innovation grants specifically for African researchers and institutions across all disciplines.",
    coverage: "Project-based funding",
    "amount_(kes)": 0,
    portal_url: "https://www.afdb.org/en/grants",
    deadline: "Rolling",
    open_to: "PhD, Masters, PostDoc",
    notes: "University is a registered partner institution.",
  },
  {
    id: "db-003",
    category: "db",
    scholarship_name: "European Research Council — Open Calls",
    type: "Database",
    status: "open",
    description: "ERC funding for frontier research. Starting Grants, Consolidator Grants, and Advanced Grants open to researchers at all career stages. Hosted institution must be in an ERC member state — applies via collaborative partner.",
    coverage: "Up to EUR 2.5M project",
    "amount_(kes)": 0,
    portal_url: "https://erc.europa.eu/apply-grant",
    deadline: "See ERC Work Programme",
    open_to: "PhD, PostDoc",
    notes: "Applications must be co-submitted through a partner EU institution. Contact the Research Office.",
  },
  {
    id: "db-004",
    category: "db",
    scholarship_name: "Kenya National Research Fund (NRF)",
    type: "Database",
    status: "open",
    description: "NRF funds research projects aligned with Kenya's national development priorities including health, agriculture, energy, and ICT. Open to Kenyan researchers and institutions.",
    coverage: "Full project funding",
    "amount_(kes)": 5000000,
    portal_url: "https://www.nrf.go.ke",
    deadline: "Per call",
    open_to: "PhD, Masters, PostDoc",
    notes: "Student must apply jointly with a faculty supervisor as PI.",
  },
];

/* ── Category config ── */
const CATEGORIES = {
  pi: {
    label: "Principal Investigator Grants",
    shortLabel: "PI Grants",
    icon: GroupsIcon,
    color: "#7c3aed",
    bg: "#f5f3ff",
    description: "PI-authored project briefs — apply to PhD or postdoc positions",
    cta: (isOpen) => isOpen ? "View brief & apply" : "Closed",
    ctaVariant: "contained",
    ctaBg: (isOpen) => isOpen ? "#7c3aed" : undefined,
  },
  university: {
    label: "Available University Grants",
    shortLabel: "University Grants",
    icon: AccountBalanceIcon,
    color: BRAND.teal,
    bg: `${BRAND.teal}0d`,
    description: "Grants funded directly by the university — apply through the portal",
    cta: (isOpen, app) => app ? (app.status === "draft" ? "Continue" : "View application") : isOpen ? "Apply now" : "Closed",
    ctaVariant: "contained",
    ctaBg: (isOpen) => isOpen ? BRAND.teal : undefined,
  },
  db: {
    label: "University Grant Database Subscriptions",
    shortLabel: "Grant Databases",
    icon: StorageIcon,
    color: "#0369a1",
    bg: "#f0f9ff",
    description: "External grant databases the university subscribes to — access the portal directly",
    cta: () => "Access Portal",
    ctaVariant: "outlined",
    ctaBg: () => undefined,
  },
};

function appStatusChip(app) {
  const st = String(app?.status || "").toLowerCase();
  if (st === "awarded" || st === "approved") return { label: "Approved", color: ST.colors.success, bg: ST.colors.successLight, icon: CheckCircleIcon };
  if (st === "submitted for review") return { label: "Under review", color: ST.colors.warning, bg: ST.colors.warningLight, icon: HourglassEmptyIcon };
  if (st === "draft") return { label: "Draft", color: ST.colors.info, bg: ST.colors.infoLight, icon: EditNoteIcon };
  if (st === "rejected") return { label: "Rejected", color: ST.colors.error, bg: ST.colors.errorLight, icon: BlockIcon };
  return null;
}

function grantAmount(g) {
  return Number(g["amount_(kes)"] || g.amount_kes || 0);
}

function degreeTierLabel(tier) {
  if (tier === "phd") return "PhD Candidate";
  if (tier === "masters") return "Masters Student";
  return "Postgraduate";
}

/* ── Filter sidebar ── */
function FilterSidebar({ searchQuery, setSearchQuery, viewFilter, setViewFilter, categoryFilter, setCategoryFilter, counts }) {
  const views = [
    { value: "open",    label: "Open to apply",   count: counts.open },
    { value: "applied", label: "My applications",  count: counts.applied },
    { value: "all",     label: "All programmes",   count: counts.total },
  ];

  const cats = [
    { value: "all",        label: "All categories",   count: counts.total },
    { value: "pi",         label: "PI Grants",         count: counts.byCategory.pi },
    { value: "university", label: "University Grants", count: counts.byCategory.university },
    { value: "db",         label: "Grant Databases",   count: counts.byCategory.db },
  ];

  return (
    <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, overflow: "hidden", position: "sticky", top: 16 }}>
      {/* Search */}
      <Box sx={{ p: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search grants…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: ST.colors.textSecondary }} />
              </InputAdornment>
            ),
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: 13 } }}
        />
      </Box>

      <Divider />

      {/* Show (view) filter */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1.25 }}>
          Show
        </Typography>
        <Stack spacing={0.25}>
          {views.map(({ value, label, count }) => (
            <Box
              key={value}
              onClick={() => setViewFilter(value)}
              sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                px: 1.25, py: 0.875, borderRadius: 1.5, cursor: "pointer",
                bgcolor: viewFilter === value ? `${BRAND.teal}12` : "transparent",
                border: `1px solid ${viewFilter === value ? `${BRAND.teal}40` : "transparent"}`,
                transition: "all 0.15s",
                "&:hover": { bgcolor: viewFilter === value ? `${BRAND.teal}12` : ST.colors.bg },
              }}
            >
              <Typography variant="body2" fontWeight={viewFilter === value ? 700 : 500} sx={{ color: viewFilter === value ? BRAND.teal : ST.colors.textPrimary, fontSize: 13 }}>
                {label}
              </Typography>
              <Box sx={{ bgcolor: viewFilter === value ? BRAND.teal : ST.colors.border, color: viewFilter === value ? "white" : ST.colors.textSecondary, borderRadius: 1, px: 0.75, fontSize: 11, fontWeight: 700, minWidth: 22, textAlign: "center" }}>
                {count ?? 0}
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>

      <Divider />

      {/* Category filter */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1.25 }}>
          Category
        </Typography>
        <Stack spacing={0.25}>
          {cats.map(({ value, label, count }) => {
            const catConf = CATEGORIES[value];
            const CatIcon = catConf?.icon;
            const active = categoryFilter === value;
            return (
              <Box
                key={value}
                onClick={() => setCategoryFilter(value)}
                sx={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  px: 1.25, py: 0.875, borderRadius: 1.5, cursor: "pointer",
                  bgcolor: active ? `${BRAND.teal}12` : "transparent",
                  border: `1px solid ${active ? `${BRAND.teal}40` : "transparent"}`,
                  transition: "all 0.15s",
                  "&:hover": { bgcolor: active ? `${BRAND.teal}12` : ST.colors.bg },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  {CatIcon && <CatIcon sx={{ fontSize: 14, color: active ? BRAND.teal : (catConf?.color || ST.colors.textSecondary) }} />}
                  <Typography variant="body2" fontWeight={active ? 700 : 500} sx={{ color: active ? BRAND.teal : ST.colors.textPrimary, fontSize: 13 }}>
                    {label}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: active ? BRAND.teal : ST.colors.border, color: active ? "white" : ST.colors.textSecondary, borderRadius: 1, px: 0.75, fontSize: 11, fontWeight: 700, minWidth: 22, textAlign: "center" }}>
                  {count ?? 0}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>

      {/* Clear */}
      {searchQuery && (
        <>
          <Divider />
          <Box sx={{ p: 2, pt: 1.5 }}>
            <Button size="small" fullWidth onClick={() => setSearchQuery("")}
              sx={{ textTransform: "none", fontWeight: 600, color: ST.colors.textSecondary, fontSize: 12, border: `1px solid ${ST.colors.border}`, borderRadius: 1.5 }}>
              Clear search
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
}

/* ── Grant card ── */
function GrantCard({ grant, app, onApply, onView }) {
  const catKey = grant.category || "university";
  const catConf = CATEGORIES[catKey];
  const CatIcon = catConf?.icon || ScienceIcon;
  const isOpen = String(grant.status || "").toLowerCase() === "open";
  const sc = appStatusChip(app);
  const StatusIcon = sc?.icon;
  const amount = grantAmount(grant);
  const slots = grant.remaining ?? grant.slots;
  const slotsPct = grant.total_slots > 0 ? Math.min(Math.round(((grant.total_slots - (grant.remaining ?? 0)) / grant.total_slots) * 100), 100) : null;
  const isDb = catKey === "db";
  const isPi = catKey === "pi";

  const borderLeft = app
    ? `3px solid ${BRAND.navyMuted || "#8da0b3"}`
    : isOpen
    ? `3px solid ${catConf?.color || BRAND.teal}`
    : `3px solid ${ST.colors.border}`;

  return (
    <Paper elevation={0} sx={{
      display: "flex",
      border: `1px solid ${isOpen && !app ? `${catConf?.color || BRAND.teal}35` : ST.colors.border}`,
      borderLeft,
      borderRadius: 2.5,
      overflow: "hidden",
      transition: "box-shadow 0.15s",
      "&:hover": { boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
    }}>
      {/* Icon column */}
      <Box sx={{ width: 52, flexShrink: 0, bgcolor: catConf?.bg || `${BRAND.navy}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CatIcon sx={{ color: catConf?.color || BRAND.navy, fontSize: 22 }} />
      </Box>

      {/* Middle */}
      <Box sx={{ flex: 1, minWidth: 0, px: 2, py: 1.75 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", mb: 0.75 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mr: 0.5 }}>
            {grant.scholarship_name || "—"}
          </Typography>
          <Chip size="small" label={isOpen ? "Open" : "Closed"}
            sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: isOpen ? ST.colors.successLight : ST.colors.bg, color: isOpen ? ST.colors.success : ST.colors.textSecondary }} />
          {grant.type && (
            <Chip size="small" label={grant.type}
              sx={{ height: 18, fontSize: 10, fontWeight: 600, bgcolor: catConf?.bg || `${BRAND.navy}10`, color: catConf?.color || BRAND.navy }} />
          )}
          {sc && (
            <Chip size="small"
              icon={StatusIcon ? <StatusIcon sx={{ fontSize: "11px !important" }} /> : undefined}
              label={sc.label}
              sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: sc.bg, color: sc.color, "& .MuiChip-icon": { color: `${sc.color} !important` } }} />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary"
          sx={{ fontSize: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", mb: 1 }}>
          {grant.description || "No description available."}
        </Typography>

        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
          {grant.coverage && (
            <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontSize: 11 }}>{grant.coverage}</Typography>
          )}
          {isPi && grant.pi_name && (
            <>
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontSize: 11 }}>·</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                <PersonIcon sx={{ fontSize: 11, color: ST.colors.textSecondary }} />
                <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontSize: 11 }}>{grant.pi_name}</Typography>
              </Box>
            </>
          )}
          {!isDb && slots != null && (
            <>
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontSize: 11 }}>·</Typography>
              <Typography variant="caption" sx={{ color: slots <= 1 ? ST.colors.error : ST.colors.textSecondary, fontWeight: slots <= 1 ? 700 : 400, fontSize: 11 }}>
                {slots} slot{slots !== 1 ? "s" : ""} left
              </Typography>
            </>
          )}
          {grant.deadline && (
            <>
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontSize: 11 }}>·</Typography>
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontSize: 11 }}>Deadline: {grant.deadline}</Typography>
            </>
          )}
        </Box>

        {slotsPct != null && !isDb && (
          <Box sx={{ mt: 1, maxWidth: 200 }}>
            <LinearProgress variant="determinate" value={slotsPct}
              sx={{ height: 4, borderRadius: 2, bgcolor: `${BRAND.navy}10`, "& .MuiLinearProgress-bar": { bgcolor: slotsPct >= 90 ? ST.colors.error : catConf?.color || BRAND.teal, borderRadius: 2 } }} />
          </Box>
        )}

        {isPi && isOpen && (
          <Typography variant="caption" sx={{ color: "#7c3aed", fontWeight: 600, fontSize: 11, display: "block", mt: 0.75 }}>
            ✦ PI-authored {grant.position_type === "postdoc" ? "postdoc" : "PhD"} project brief — review scope of work before applying
          </Typography>
        )}
        {isDb && grant.notes && (
          <Typography variant="caption" sx={{ color: "#0369a1", fontWeight: 600, fontSize: 11, display: "block", mt: 0.75 }}>
            ℹ {grant.notes}
          </Typography>
        )}
      </Box>

      {/* Right CTA */}
      <Box sx={{
        minWidth: 160, flexShrink: 0,
        borderLeft: `1px solid ${ST.colors.border}`,
        display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center",
        gap: 1, px: 2, py: 1.75,
      }}>
        {amount > 0 && (
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 10 }}>Up to</Typography>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: ST.colors.success, lineHeight: 1.2 }}>
              KES {amount.toLocaleString()}
            </Typography>
          </Box>
        )}
        {isDb && !amount && (
          <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontSize: 10, textAlign: "right" }}>External portal</Typography>
        )}

        <Button size="small" variant="outlined" onClick={() => onView(grant)}
          sx={{ textTransform: "none", fontWeight: 600, fontSize: 12, borderRadius: 1.5, borderColor: ST.colors.border, color: ST.colors.textSecondary, width: "100%", py: 0.4 }}>
          Details
        </Button>

        {isDb ? (
          <Button size="small" variant="outlined"
            endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
            onClick={() => grant.portal_url && window.open(grant.portal_url, "_blank")}
            sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, borderRadius: 1.5, width: "100%", py: 0.4, borderColor: "#0369a1", color: "#0369a1" }}>
            Access Portal
          </Button>
        ) : app ? (
          <Button size="small" variant="contained" onClick={() => onApply(grant, app)}
            sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, borderRadius: 1.5, width: "100%", py: 0.4, bgcolor: BRAND.navy }}>
            {app.status === "draft" ? "Continue" : "View application"}
          </Button>
        ) : (
          <Tooltip title={!isOpen ? "Not currently accepting applications" : ""}>
            <span style={{ width: "100%" }}>
              <Button size="small" variant="contained"
                endIcon={isPi ? undefined : <ArrowForwardIcon sx={{ fontSize: 14 }} />}
                disabled={!isOpen}
                onClick={() => onApply(grant, null)}
                sx={{
                  textTransform: "none", fontWeight: 700, fontSize: 12, borderRadius: 1.5, width: "100%", py: 0.4,
                  bgcolor: isOpen ? (isPi ? "#7c3aed" : BRAND.teal) : undefined,
                  fontSize: isPi ? 11 : 12,
                }}>
                {isOpen ? (isPi ? "View brief & apply" : "Apply now") : "Closed"}
              </Button>
            </span>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
}

/* ── Grant detail drawer ── */
function GrantDetailDialog({ grant, app, open, onClose, onApply }) {
  if (!grant) return null;
  const catKey = grant.category || "university";
  const catConf = CATEGORIES[catKey];
  const CatIcon = catConf?.icon || ScienceIcon;
  const isOpen = String(grant.status || "").toLowerCase() === "open";
  const amount = grantAmount(grant);
  const sc = appStatusChip(app);
  const isDb = catKey === "db";
  const isPi = catKey === "pi";

  return (
    <>
      {open && <Box onClick={onClose} sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.3)", zIndex: 1200 }} />}
      <Box sx={{
        position: "fixed", top: 0, right: 0,
        width: { xs: "100%", sm: 500 },
        height: "100vh", bgcolor: "white", zIndex: 1201,
        boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s ease",
        display: "flex", flexDirection: "column",
        borderRadius: "16px 0 0 16px", overflow: "hidden",
      }}>
        {/* Header */}
        <Box sx={{ px: 3, py: 2.5, background: `linear-gradient(135deg, ${BRAND.navy} 0%, #1e3a5f 100%)` }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: `${catConf?.color || BRAND.teal}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CatIcon sx={{ color: catConf?.color || BRAND.teal, fontSize: 16 }} />
                </Box>
                <Typography variant="caption" sx={{ color: catConf?.color || BRAND.teal, fontWeight: 700, fontSize: 11 }}>
                  {catConf?.shortLabel}
                </Typography>
              </Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: "white", lineHeight: 1.3 }}>
                {grant.scholarship_name || "Grant"}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.75, mt: 0.75, flexWrap: "wrap" }}>
                <Chip size="small" label={isOpen ? "Open" : "Closed"}
                  sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: isOpen ? `${ST.colors.success}30` : "rgba(255,255,255,0.15)", color: isOpen ? "#4ade80" : "rgba(255,255,255,0.6)" }} />
                {grant.type && <Chip size="small" label={grant.type} sx={{ height: 18, fontSize: 10, fontWeight: 600, bgcolor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }} />}
                {sc && <Chip size="small" label={sc.label} sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: sc.bg, color: sc.color }} />}
              </Box>
            </Box>
            <Button size="small" onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)", minWidth: 0, p: 0.5, fontWeight: 700 }}>✕</Button>
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          {/* Key facts */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 2.5 }}>
            {[
              amount > 0 ? { label: "Award amount", value: `KES ${amount.toLocaleString()}`, color: ST.colors.success } : null,
              { label: "Coverage", value: grant.coverage || "—" },
              isPi ? { label: "Principal Investigator", value: grant.pi_name || "—" } : null,
              isPi ? { label: "Department", value: grant.pi_department || "—" } : null,
              !isDb ? { label: "Slots remaining", value: (grant.remaining ?? grant.slots ?? "—").toString() } : null,
              { label: "Deadline", value: grant.deadline || grant.application_deadline || "Rolling" },
              { label: "Open to", value: grant.open_to || "All postgraduate" },
              { label: "Status", value: isOpen ? "Open" : "Closed", color: isOpen ? ST.colors.success : ST.colors.error },
              isDb ? { label: "Portal", value: grant.portal_url ? "External link" : "—" } : null,
            ].filter(Boolean).map(({ label, value, color }) => (
              <Box key={label} sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 1.5 }}>
                <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>{label}</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: color || BRAND.navy, mt: 0.25 }}>{value}</Typography>
              </Box>
            ))}
          </Box>

          {/* Description */}
          {grant.description && (
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: BRAND.navy, mb: 1 }}>About this grant</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{grant.description}</Typography>
            </Box>
          )}

          {/* Category-specific info panels */}
          {isPi && (
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: BRAND.navy, mb: 1.5 }}>Project brief</Typography>
              <PiProjectBrief grant={grant} compact />
            </Box>
          )}
          {isPi && (
            <Alert severity="info" sx={{ borderRadius: 1.5, mb: 2, "& .MuiAlert-message": { fontSize: 13 } }}>
              <strong>PI-authored scope of work.</strong> Review the research question, milestones, and expected outputs above. If you are a strong fit, apply with an expression of interest — the PI will select a candidate before the full proposal stage.
            </Alert>
          )}
          {isDb && (
            <Alert severity="info" sx={{ borderRadius: 1.5, mb: 2, "& .MuiAlert-message": { fontSize: 13 } }}>
              <strong>External portal.</strong> {grant.notes || "This grant is managed on an external platform. Click Access Portal to browse and apply."} Contact the Research Office if you need an institutional account.
            </Alert>
          )}

          {/* Eligibility */}
          {grant.min_gpa && (
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: BRAND.navy, mb: 1 }}>Eligibility requirements</Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", bgcolor: ST.colors.bg, borderRadius: 1.5, px: 1.5, py: 1 }}>
                <Typography variant="caption" color="text.secondary">Minimum GPA</Typography>
                <Typography variant="caption" fontWeight={700} sx={{ color: BRAND.navy }}>{grant.min_gpa}</Typography>
              </Box>
            </Box>
          )}

          {app && (
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              You have {sc?.label === "Draft" ? "a saved draft" : `an existing application (${sc?.label || app.status})`} for this grant.
            </Alert>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ px: 3, py: 2, borderTop: `1px solid ${ST.colors.border}`, display: "flex", gap: 1 }}>
          <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 600, flex: 1, borderColor: ST.colors.border, border: "1px solid" }}>
            Close
          </Button>
          {isDb ? (
            <Button variant="contained"
              endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
              onClick={() => grant.portal_url && window.open(grant.portal_url, "_blank")}
              sx={{ bgcolor: "#0369a1", textTransform: "none", fontWeight: 700, flex: 1 }}>
              Access Portal
            </Button>
          ) : app ? (
            <Button variant="contained" onClick={() => { onClose(); onApply(grant, app); }}
              sx={{ bgcolor: BRAND.navy, textTransform: "none", fontWeight: 700, flex: 1 }}>
              {app.status === "draft" ? "Continue draft" : "View application"}
            </Button>
          ) : (
            <Button variant="contained"
              endIcon={isPi ? undefined : <ArrowForwardIcon />}
              disabled={!isOpen}
              onClick={() => { onClose(); onApply(grant, null); }}
              sx={{ bgcolor: isOpen ? (isPi ? "#7c3aed" : BRAND.teal) : undefined, textTransform: "none", fontWeight: 700, flex: 1 }}>
              {isOpen ? (isPi ? "View brief & apply" : "Apply now") : "Closed"}
            </Button>
          )}
        </Box>
      </Box>
    </>
  );
}

/* ── Section header for category grouping ── */
function CategorySectionHeader({ catKey, count }) {
  const catConf = CATEGORIES[catKey];
  const CatIcon = catConf?.icon || ScienceIcon;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 3, mb: 1.5, pb: 1, borderBottom: `2px solid ${catConf?.color || BRAND.teal}30` }}>
      <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: catConf?.bg || `${BRAND.navy}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CatIcon sx={{ color: catConf?.color || BRAND.navy, fontSize: 18 }} />
      </Box>
      <Box>
        <Typography variant="subtitle2" fontWeight={800} sx={{ color: catConf?.color || BRAND.navy, lineHeight: 1.2 }}>
          {catConf?.label}
        </Typography>
        <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontSize: 11 }}>
          {catConf?.description}
        </Typography>
      </Box>
      <Chip size="small" label={`${count} programme${count !== 1 ? "s" : ""}`}
        sx={{ ml: "auto", fontSize: 11, fontWeight: 600, bgcolor: catConf?.bg || `${BRAND.navy}10`, color: catConf?.color || BRAND.navy, height: 20 }} />
    </Box>
  );
}

/* ══ Main page ══ */
export default function GrantOpportunitiesPage() {
  const router = useRouter();
  const [universityGrants, setUniversityGrants] = useState([]);
  const [piGrantsFromApi, setPiGrantsFromApi] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewFilter, setViewFilter] = useState("open");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [detailGrant, setDetailGrant] = useState(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/sis-lms/grants/programs"),
      apiFetch("/sis-lms/grants/applications/my").catch(() => ({ applications: [] })),
      apiFetch("/sis-lms/my-profile").catch(() => null),
    ])
      .then(([programs, apps, profileData]) => {
        const raw = Array.isArray(programs) ? programs : programs.programs || [];
        const apiPi = raw.filter((g) => g.category === "pi" || String(g.id || "").startsWith("pi-")).map((g) => ({ ...g, category: "pi" }));
        const apiUniversity = raw.filter((g) => g.category !== "pi" && !String(g.id || "").startsWith("pi-")).map((g) => ({ ...g, category: "university" }));
        setUniversityGrants(apiUniversity.length ? apiUniversity : raw.map((g) => ({ ...g, category: "university" })));
        setPiGrantsFromApi(apiPi);
        setApplications(apps.applications || []);
        setProfile(profileData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  /* All grants combined */
  const allGrants = useMemo(() => {
    const piGrants = piGrantsFromApi.length ? piGrantsFromApi : MOCK_PI_GRANTS;
    return [...piGrants, ...universityGrants, ...MOCK_DB_GRANTS];
  }, [universityGrants, piGrantsFromApi]);

  const appByGrant = useMemo(() => {
    const m = {};
    applications.forEach((a) => { m[String(a.grant_id || a.schol_id)] = a; });
    return m;
  }, [applications]);

  /* Counts */
  const counts = useMemo(() => {
    const open = allGrants.filter((g) => String(g.status || "").toLowerCase() === "open" && !appByGrant[String(g.id)]).length;
    const applied = applications.length;
    const total = allGrants.length;
    const byCategory = { pi: 0, university: 0, db: 0 };
    allGrants.forEach((g) => { if (byCategory[g.category] !== undefined) byCategory[g.category]++; });
    return { open, applied, total, byCategory };
  }, [allGrants, applications, appByGrant]);

  /* Filtering */
  const baseFiltered = useMemo(() => {
    return allGrants.filter((g) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || [g.scholarship_name, g.description, g.type, g.coverage, g.pi_name].some((v) => String(v || "").toLowerCase().includes(q));
      const matchCat = categoryFilter === "all" || g.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [allGrants, searchQuery, categoryFilter]);

  const visible = useMemo(() => {
    if (viewFilter === "open") return baseFiltered.filter((g) => String(g.status || "").toLowerCase() === "open" && !appByGrant[String(g.id)]);
    if (viewFilter === "applied") return baseFiltered.filter((g) => Boolean(appByGrant[String(g.id)]));
    return baseFiltered;
  }, [baseFiltered, viewFilter, appByGrant]);

  /* Group by category when showing all */
  const showGrouped = categoryFilter === "all" && viewFilter === "all";
  const groupedByCategory = useMemo(() => {
    if (!showGrouped) return null;
    const groups = { pi: [], university: [], db: [] };
    visible.forEach((g) => { if (groups[g.category]) groups[g.category].push(g); });
    return groups;
  }, [showGrouped, visible]);

  useMemo(() => { setPage(1); }, [searchQuery, categoryFilter, viewFilter]);

  const totalPages = showGrouped ? 1 : Math.ceil(visible.length / PAGE_SIZE);
  const paginated = showGrouped ? visible : visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleApply = (grant, app) => {
    if (grant.category === "db") { if (grant.portal_url) window.open(grant.portal_url, "_blank"); return; }
    const gid = String(grant.id);
    if (app) {
      router.push(app.id ? `/student/grants/lifecycle/${app.id}` : `/student/grants/apply/${encodeURIComponent(gid)}`);
    } else {
      router.push(`/student/grants/apply/${encodeURIComponent(gid)}`);
    }
  };

  const student = profile?.student ?? {};
  const degreeTier = inferDegreeTier(student);
  const tierLabel = degreeTierLabel(degreeTier);
  const underReview = applications.filter((a) => String(a.status || "").toLowerCase() === "submitted for review").length;
  const approved = applications.filter((a) => ["approved", "awarded"].includes(String(a.status || "").toLowerCase())).length;
  const openTotal = allGrants.filter((g) => String(g.status || "").toLowerCase() === "open").length;

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 2 }}>
        <CircularProgress sx={{ color: BRAND.teal }} size={28} />
        <Typography variant="body2" color="text.secondary">Loading grant programmes…</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      {/* ── Header ── */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, background: `linear-gradient(135deg, ${BRAND.navy} 0%, #1e3a5f 100%)` }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${BRAND.teal}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ScienceIcon sx={{ color: BRAND.teal, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: "white", lineHeight: 1.2 }}>
                Research & Innovation Grants
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
                {student.program || tierLabel} · PI grants, university funds & external databases
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {[
              { label: "Open now",     value: openTotal,   highlight: true },
              { label: "Under review", value: underReview },
              { label: "Approved",     value: approved,    color: "#4ade80" },
            ].map(({ label, value, highlight, color }) => (
              <Box key={label} sx={{ textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)", display: "block", fontSize: 10 }}>{label}</Typography>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: color || (highlight ? BRAND.teal : "white"), lineHeight: 1 }}>{value}</Typography>
              </Box>
            ))}
            <Button size="small" startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
              onClick={() => router.push("/student/grants")}
              sx={{ color: "rgba(255,255,255,0.8)", textTransform: "none", fontWeight: 600, fontSize: 12, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 1.5, px: 1.5 }}>
              My grants
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ── Sidebar + content ── */}
      <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
        <Box sx={{ width: 236, flexShrink: 0 }}>
          <FilterSidebar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewFilter={viewFilter}
            setViewFilter={setViewFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            counts={counts}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
              {visible.length === 0 ? "No results" : `${visible.length} grant programme${visible.length !== 1 ? "s" : ""}`}
              {searchQuery && <span> for <strong>"{searchQuery}"</strong></span>}
            </Typography>
            {visible.length > 0 && totalPages > 1 && (
              <Typography variant="caption" color="text.secondary">Page {page} of {totalPages}</Typography>
            )}
          </Box>

          {visible.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, textAlign: "center", border: `1px dashed ${ST.colors.border}`, borderRadius: 2 }}>
              <ScienceIcon sx={{ fontSize: 40, color: ST.colors.border, mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: BRAND.navy }}>
                {viewFilter === "open" ? "No open grants right now" : viewFilter === "applied" ? "No applications yet" : "Nothing matches your filters"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2, maxWidth: 360, mx: "auto" }}>
                {viewFilter === "open" ? "Browse All programmes to see the full catalogue." : viewFilter === "applied" ? "Apply to open grants — progress is saved automatically." : "Clear your search or category filter."}
              </Typography>
              {viewFilter !== "all" && (
                <Button size="small" onClick={() => setViewFilter("all")} sx={{ textTransform: "none", fontWeight: 600, color: BRAND.teal }}>
                  Show all programmes
                </Button>
              )}
            </Paper>
          ) : showGrouped ? (
            /* Grouped by category */
            ["pi", "university", "db"].map((catKey) => {
              const group = groupedByCategory[catKey];
              if (!group || group.length === 0) return null;
              return (
                <Box key={catKey}>
                  <CategorySectionHeader catKey={catKey} count={group.length} />
                  <Stack spacing={1.5}>
                    {group.map((g) => (
                      <GrantCard key={g.id} grant={g} app={appByGrant[String(g.id)]} onApply={handleApply} onView={setDetailGrant} />
                    ))}
                  </Stack>
                </Box>
              );
            })
          ) : (
            <Stack spacing={1.5}>
              {paginated.map((g) => (
                <GrantCard key={g.id} grant={g} app={appByGrant[String(g.id)]} onApply={handleApply} onView={setDetailGrant} />
              ))}
            </Stack>
          )}

          {!showGrouped && totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination count={totalPages} page={page}
                onChange={(_, v) => { setPage(v); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                size="medium"
                sx={{ "& .MuiPaginationItem-root": { fontWeight: 600, borderRadius: 1.5 }, "& .Mui-selected": { bgcolor: `${BRAND.teal} !important`, color: "white" } }} />
            </Box>
          )}
        </Box>
      </Box>

      <GrantDetailDialog
        grant={detailGrant}
        app={detailGrant ? appByGrant[String(detailGrant.id)] : null}
        open={Boolean(detailGrant)}
        onClose={() => setDetailGrant(null)}
        onApply={handleApply}
      />
    </Box>
  );
}
