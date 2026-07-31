"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import LinearProgress from "@mui/material/LinearProgress";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PaymentsIcon from "@mui/icons-material/Payments";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

/* ── Payment method icon ── */
function MethodIcon({ method }) {
  const m = (method || "").toLowerCase();
  if (m.includes("mpesa") || m.includes("m-pesa")) return <PhoneIphoneIcon sx={{ fontSize: 15, color: ST.chart.green }} />;
  if (m.includes("bank")) return <AccountBalanceIcon sx={{ fontSize: 15, color: ST.chart.blue }} />;
  return <PaymentsIcon sx={{ fontSize: 15, color: ST.colors.textSecondary }} />;
}

/* ── Fee status chip style ── */
function feeStatusStyle(s) {
  if (!s) return { bg: ST.colors.bg, color: ST.colors.textSecondary };
  const sl = s.toLowerCase();
  if (sl.includes("fully paid") || sl === "paid") return { bg: ST.colors.successLight, color: ST.colors.success };
  if (sl.includes("on track")) return { bg: ST.colors.infoLight, color: ST.colors.info };
  if (sl.includes("partial") || sl.includes("behind")) return { bg: ST.colors.warningLight, color: ST.colors.warning };
  if (sl.includes("unpaid") || sl.includes("overdue")) return { bg: ST.colors.errorLight, color: ST.colors.error };
  return { bg: ST.colors.bg, color: ST.colors.textSecondary };
}

/* ── Single fee record row ── */
function FeeRecord({ f, index, isExpanded, onToggle, isLast }) {
  const sc = feeStatusStyle(f.status);
  const balanceDue = Number(f.balance_due || 0);
  const paidPct = f.total_annual > 0 ? Math.min(Math.round((Number(f.total_paid || 0) / Number(f.total_annual)) * 100), 100) : 0;

  const components = [
    { label: "Tuition", value: f.tuition },
    { label: "Accommodation", value: f.accommodation },
    { label: "Exam fee", value: f.exam_fee },
    { label: "Activity", value: f.activity },
    { label: "Medical", value: f.medical },
  ].filter((x) => x.value && Number(x.value) > 0);

  const summary = [
    { label: "Total fees", value: f.total_annual, color: ST.colors.textSecondary },
    { label: "Scholarship credit", value: f.scholarship, color: ST.chart.purple },
    { label: "Net payable", value: f.net_payable, color: BRAND.navy },
    { label: "Total paid", value: f.total_paid, color: ST.colors.success },
    { label: "Balance due", value: f.balance_due, color: balanceDue > 0 ? ST.colors.error : ST.colors.success },
  ];

  return (
    <Box sx={{ borderBottom: !isLast ? `1px solid ${ST.colors.border}` : "none" }}>
      {/* Row header */}
      <Box
        onClick={onToggle}
        sx={{ px: 2.5, py: 1.75, cursor: "pointer", transition: "background 0.15s", "&:hover": { bgcolor: ST.colors.bg } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Expand arrow */}
          <IconButton size="small" sx={{ color: ST.colors.textSecondary, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", p: 0.25, flexShrink: 0 }}>
            <ExpandMoreIcon fontSize="small" />
          </IconButton>

          {/* Year + programme */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.navy }}>AY {f.year || "—"}</Typography>
            {f.program && <Typography variant="caption" color="text.secondary" noWrap>{f.program}</Typography>}
          </Box>

          {/* Progress bar (compact) */}
          <Box sx={{ width: 80, display: { xs: "none", sm: "block" } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{paidPct}% paid</Typography>
            <LinearProgress
              variant="determinate"
              value={paidPct}
              sx={{ height: 4, borderRadius: 2, bgcolor: `${BRAND.teal}18`, mt: 0.25, "& .MuiLinearProgress-bar": { bgcolor: paidPct === 100 ? ST.colors.success : BRAND.teal, borderRadius: 2 } }}
            />
          </Box>

          {/* Balance + status chip */}
          <Box sx={{ textAlign: "right", flexShrink: 0 }}>
            <Typography variant="body2" fontWeight={800} sx={{ color: balanceDue > 0 ? ST.colors.error : ST.colors.success }}>
              {balanceDue > 0 ? `KES ${balanceDue.toLocaleString()} due` : "Cleared"}
            </Typography>
          </Box>
          <Chip label={f.status || "—"} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: sc.bg, color: sc.color, flexShrink: 0 }} />
        </Box>
      </Box>

      {/* Expanded detail */}
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Box sx={{ px: 2.5, pb: 2.5, pt: 0.5 }}>
          <Grid container spacing={2}>
            {/* Components breakdown */}
            {components.length > 0 && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ bgcolor: ST.colors.bg, borderRadius: 2, p: 1.75 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", fontSize: 10, letterSpacing: 0.5, display: "block", mb: 1 }}>
                    Fee components
                  </Typography>
                  {components.map(({ label, value }) => (
                    <Box key={label} sx={{ display: "flex", justifyContent: "space-between", py: 0.4 }}>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography variant="caption" fontWeight={600} sx={{ color: BRAND.navy }}>KES {Number(value).toLocaleString()}</Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            )}

            {/* Summary */}
            <Grid item xs={12} sm={components.length > 0 ? 6 : 12}>
              <Box sx={{ bgcolor: ST.colors.bg, borderRadius: 2, p: 1.75 }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", fontSize: 10, letterSpacing: 0.5, display: "block", mb: 1 }}>
                  Summary
                </Typography>
                {summary.map(({ label, value, color }) => (
                  value != null && (
                    <Box key={label} sx={{ display: "flex", justifyContent: "space-between", py: 0.4 }}>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ color }}>KES {Number(value || 0).toLocaleString()}</Typography>
                    </Box>
                  )
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Box>
  );
}

/* ══ Main page ══ */
export default function FinancialsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedFees, setExpandedFees] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  useEffect(() => {
    apiFetch("/sis-lms/my-profile")
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = profile?.statistics ?? {};
  const payments = profile?.payments ?? [];
  const feeRecords = profile?.fee_records ?? [];
  const scholarshipApps = profile?.scholarship_apps ?? [];

  const paid = Number(stats.total_paid ?? 0);
  const balance = Number(stats.net_balance_due ?? stats.balance_due ?? 0);
  const scholarship = Number(stats.total_scholarships ?? 0);
  const totalFees = Number(stats.total_fees ?? 0);
  const paidPct = totalFees > 0 ? Math.min(Math.round((paid / totalFees) * 100), 100) : 0;

  const creditedScholarships = useMemo(
    () => scholarshipApps.filter((a) => a.award_stage === "credited" || String(a.status || "").toLowerCase() === "awarded"),
    [scholarshipApps]
  );

  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return payments.filter((p) => {
      const matchSearch = !q || (p.payment_id || "").toLowerCase().includes(q) || (p.reference || "").toLowerCase().includes(q);
      const m = (p.method || "").toLowerCase();
      const matchMethod =
        methodFilter === "all" ||
        (methodFilter === "mpesa" && (m.includes("mpesa") || m.includes("m-pesa"))) ||
        (methodFilter === "bank" && m.includes("bank")) ||
        (methodFilter === "cash" && m.includes("cash"));
      return matchSearch && matchMethod;
    });
  }, [payments, searchQuery, methodFilter]);

  const METHODS = ["all", "mpesa", "bank", "cash"];

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}><CircularProgress sx={{ color: BRAND.teal }} /></Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      {/* ── Compact branded header ── */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, background: `linear-gradient(135deg, ${BRAND.navy} 0%, #1e3a5f 100%)` }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${BRAND.teal}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AccountBalanceWalletIcon sx={{ color: BRAND.teal, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: "white", lineHeight: 1.2 }}>Fee & Payment Summary</Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)" }}>Academic year financial record</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            {[
              { label: "Total fees", value: totalFees > 0 ? `KES ${totalFees.toLocaleString()}` : "—" },
              { label: "Paid", value: paid > 0 ? `KES ${paid.toLocaleString()}` : "—", color: BRAND.teal },
              { label: "Balance", value: balance > 0 ? `KES ${balance.toLocaleString()}` : "Cleared", color: balance > 0 ? "#f87171" : "#4ade80" },
            ].map(({ label, value, color }) => (
              <Box key={label} sx={{ textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: 10, display: "block" }}>{label}</Typography>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: color || "white", lineHeight: 1.1 }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* ── Outstanding balance alert ── */}
      {balance > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button size="small" sx={{ fontWeight: 700, textTransform: "none", color: ST.colors.warning }} onClick={() => {}}>
              Contact finance
            </Button>
          }
        >
          Outstanding balance of <strong>KES {balance.toLocaleString()}</strong> — please clear this with the finance office to avoid disruption to your studies.
        </Alert>
      )}

      {/* ── KPI strip + progress ── */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2.5 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Total annual fees</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: BRAND.navy, mt: 0.25 }}>
              {totalFees > 0 ? `KES ${totalFees.toLocaleString()}` : "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary">{feeRecords.length} academic year{feeRecords.length !== 1 ? "s" : ""}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Amount paid</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: ST.colors.success, mt: 0.25 }}>
              {paid > 0 ? `KES ${paid.toLocaleString()}` : "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary">{payments.length} payment{payments.length !== 1 ? "s" : ""}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Scholarship credits</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: ST.chart.purple, mt: 0.25 }}>
              {scholarship > 0 ? `KES ${scholarship.toLocaleString()}` : "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary">{creditedScholarships.length} award{creditedScholarships.length !== 1 ? "s" : ""} applied</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Balance due</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: balance > 0 ? ST.colors.error : ST.colors.success, mt: 0.25 }}>
              {balance > 0 ? `KES ${balance.toLocaleString()}` : "Cleared"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
              {balance === 0
                ? <><CheckCircleOutlineIcon sx={{ fontSize: 12, color: ST.colors.success }} /><Typography variant="caption" sx={{ color: ST.colors.success }}>All paid</Typography></>
                : <Typography variant="caption" sx={{ color: ST.colors.error, fontWeight: 600 }}>Outstanding</Typography>
              }
            </Box>
          </Grid>

          {/* Full-width progress bar */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
              <Typography variant="caption" color="text.secondary">Payment progress</Typography>
              <Typography variant="caption" fontWeight={800} sx={{ color: paidPct === 100 ? ST.colors.success : BRAND.teal }}>{paidPct}% paid</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={paidPct}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: `${BRAND.teal}14`,
                "& .MuiLinearProgress-bar": { bgcolor: paidPct === 100 ? ST.colors.success : BRAND.teal, borderRadius: 4 },
              }}
            />
            {scholarship > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
                Includes KES {scholarship.toLocaleString()} in scholarship credits applied to your fees.
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {/* ── Fee records ── */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${ST.colors.border}`, display: "flex", alignItems: "center", gap: 1 }}>
              <ReceiptLongIcon sx={{ fontSize: 18, color: BRAND.teal }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: BRAND.navy }}>Fee records</Typography>
              <Chip label={`${feeRecords.length} year${feeRecords.length !== 1 ? "s" : ""}`} size="small" sx={{ ml: "auto", height: 20, fontSize: 10, fontWeight: 700, bgcolor: `${BRAND.teal}12`, color: BRAND.teal }} />
            </Box>
            {feeRecords.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <ReceiptLongIcon sx={{ fontSize: 36, color: ST.colors.textSecondary, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No fee records yet</Typography>
              </Box>
            ) : (
              feeRecords.map((f, i) => (
                <FeeRecord
                  key={i}
                  f={f}
                  index={i}
                  isExpanded={!!expandedFees[i]}
                  onToggle={() => setExpandedFees((prev) => ({ ...prev, [i]: !prev[i] }))}
                  isLast={i === feeRecords.length - 1}
                />
              ))
            )}
          </Paper>
        </Grid>

        {/* ── Right column: scholarships + quick links ── */}
        <Grid item xs={12} md={5}>
          <Stack spacing={2.5}>
            {/* Scholarship credits */}
            <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, overflow: "hidden" }}>
              <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${ST.colors.border}`, display: "flex", alignItems: "center", gap: 1 }}>
                <EmojiEventsIcon sx={{ fontSize: 18, color: ST.chart.purple }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: BRAND.navy }}>Scholarship credits</Typography>
                {scholarship > 0 && (
                  <Chip
                    label={`KES ${scholarship.toLocaleString()}`}
                    size="small"
                    sx={{ ml: "auto", height: 20, fontSize: 10, fontWeight: 700, bgcolor: `${ST.chart.purple}14`, color: ST.chart.purple }}
                  />
                )}
              </Box>
              {creditedScholarships.length > 0 ? (
                <Box sx={{ py: 0.5 }}>
                  {creditedScholarships.map((a, i) => {
                    const name = a.scholarship_name || a.scholarship_details?.scholarship_name || "Scholarship";
                    const amount = Number(a["award_amount_(kes)"] || a.scholarship_details?.["amount_(kes)"] || 0);
                    return (
                      <Box key={i} sx={{ px: 2.5, py: 1.25, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: i < creditedScholarships.length - 1 ? `1px solid ${ST.colors.border}` : "none" }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.navy }} noWrap>{name}</Typography>
                          <Typography variant="caption" color="text.secondary">{a.scholarship_type || "Award"}</Typography>
                        </Box>
                        <Box sx={{ textAlign: "right", flexShrink: 0, ml: 2 }}>
                          {amount > 0 && (
                            <Typography variant="body2" fontWeight={800} sx={{ color: ST.chart.purple }}>KES {amount.toLocaleString()}</Typography>
                          )}
                          <Chip label="Credited" size="small" sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: ST.colors.successLight, color: ST.colors.success }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ) : scholarship > 0 ? (
                <Box sx={{ px: 2.5, py: 2 }}>
                  <Typography variant="body2" sx={{ color: ST.colors.success, fontWeight: 700 }}>KES {scholarship.toLocaleString()} credited to your fees</Typography>
                  <Typography variant="caption" color="text.secondary">Credit applied across your fee records above.</Typography>
                </Box>
              ) : (
                <Box sx={{ px: 2.5, py: 2.5, textAlign: "center" }}>
                  <EmojiEventsIcon sx={{ fontSize: 28, color: ST.colors.textSecondary, opacity: 0.25, mb: 0.75 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>No scholarship credits yet</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                    onClick={() => router.push("/student/scholarships/available")}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5, fontSize: 12, borderColor: BRAND.teal, color: BRAND.teal }}
                  >
                    Browse scholarships
                  </Button>
                </Box>
              )}
            </Paper>

            {/* Quick links */}
            <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2.5 }}>
              <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${ST.colors.border}` }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: BRAND.navy }}>Quick actions</Typography>
              </Box>
              <Box sx={{ py: 0.5 }}>
                {[
                  { label: "My scholarships", desc: "Applications and awards", icon: EmojiEventsIcon, color: ST.chart.purple, path: "/student/scholarships" },
                  { label: "Available scholarships", desc: "Browse and apply for aid", icon: EmojiEventsIcon, color: ST.chart.green, path: "/student/scholarships/available" },
                  { label: "My profile", desc: "Academic and financial history", icon: AccountBalanceWalletIcon, color: ST.chart.blue, path: "/student/profile" },
                ].map(({ label, desc, icon: Icon, color, path }, i, arr) => (
                  <Box
                    key={label}
                    onClick={() => router.push(path)}
                    sx={{ px: 2.5, py: 1.25, display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", borderBottom: i < arr.length - 1 ? `1px solid ${ST.colors.border}` : "none", transition: "background 0.15s", "&:hover": { bgcolor: ST.colors.bg }, "&:hover .arrow": { opacity: 1 } }}
                  >
                    <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: `${color}16`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon sx={{ fontSize: 16, color }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.navy }}>{label}</Typography>
                      <Typography variant="caption" color="text.secondary">{desc}</Typography>
                    </Box>
                    <ArrowForwardIcon className="arrow" sx={{ fontSize: 15, color: ST.colors.textSecondary, opacity: 0.35, transition: "opacity 0.15s", flexShrink: 0 }} />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* ── Payment history ── */}
      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, overflow: "hidden" }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${ST.colors.border}`, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <PaymentsIcon sx={{ fontSize: 18, color: BRAND.teal }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: BRAND.navy }}>Payment history</Typography>
          <Chip label={`${filteredPayments.length} of ${payments.length}`} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: `${BRAND.teal}12`, color: BRAND.teal }} />

          {/* Search */}
          <Box sx={{ ml: "auto", display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Search ID or reference…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: ST.colors.textSecondary }} /></InputAdornment> }}
              sx={{ width: 200, "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: 13 } }}
            />
            {/* Method filter pills */}
            <Stack direction="row" spacing={0.5}>
              {METHODS.map((m) => (
                <Box
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  sx={{
                    px: 1.25, py: 0.4, borderRadius: 2, cursor: "pointer", fontSize: 12, fontWeight: 700, textTransform: "capitalize", border: "1.5px solid",
                    borderColor: methodFilter === m ? BRAND.teal : ST.colors.border,
                    bgcolor: methodFilter === m ? `${BRAND.teal}10` : "transparent",
                    color: methodFilter === m ? BRAND.teal : ST.colors.textSecondary,
                    transition: "all 0.15s",
                    "&:hover": { borderColor: BRAND.teal },
                  }}
                >
                  {m === "all" ? "All" : m === "mpesa" ? "M-Pesa" : m.charAt(0).toUpperCase() + m.slice(1)}
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, color: ST.colors.textSecondary, py: 1.25, bgcolor: ST.colors.bg, letterSpacing: 0.3 } }}>
              <TableCell>Date</TableCell>
              <TableCell>Payment ID</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell align="right">Amount (KES)</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery || methodFilter !== "all" ? "No payments match your filters" : "No payment records yet"}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((p, i) => {
                const amount = Number(p["amount_(kes)"] || p.amount || 0);
                return (
                  <TableRow key={i} sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: `${BRAND.teal}05` } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: 13 }}>{p.date || "—"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", color: ST.colors.textSecondary, fontSize: 11 }}>{p.payment_id || `P-${i + 1}`}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <MethodIcon method={p.method} />
                        <Typography variant="body2" sx={{ fontSize: 13 }}>{p.method || "—"}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", color: ST.colors.textSecondary, fontSize: 11 }}>{p.reference || "—"}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={800} sx={{ color: ST.colors.success, fontSize: 13 }}>
                        + {amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.25, borderRadius: 2, bgcolor: ST.colors.successLight }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: 12, color: ST.colors.success }} />
                        <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.success, fontSize: 11 }}>Confirmed</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {payments.length > 0 && (
          <Box sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${ST.colors.border}`, bgcolor: ST.colors.bg, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Total confirmed: <strong>KES {payments.reduce((s, p) => s + Number(p["amount_(kes)"] || p.amount || 0), 0).toLocaleString()}</strong>
            </Typography>
            <Tooltip title="Download statement — contact the finance office">
              <Button size="small" startIcon={<ReceiptLongIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: "none", fontSize: 12, color: ST.colors.textSecondary, fontWeight: 600 }}>
                Get statement
              </Button>
            </Tooltip>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
