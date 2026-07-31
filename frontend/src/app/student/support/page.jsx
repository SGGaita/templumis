"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import HeadsetMicIcon from "@mui/icons-material/HeadsetMic";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PersonIcon from "@mui/icons-material/Person";
import ScienceIcon from "@mui/icons-material/Science";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import JourneyTimeline from "@/components/student/JourneyTimeline";
import { transformExcelJourney } from "@/lib/studentJourney";

/* ── Risk badge ── */
const RISK_STYLE = {
  low:      { bg: ST.colors.successLight, color: ST.colors.success, label: "Low risk" },
  medium:   { bg: ST.colors.warningLight, color: ST.colors.warning, label: "Medium risk" },
  high:     { bg: ST.colors.errorLight,   color: ST.colors.error,   label: "High risk" },
  critical: { bg: ST.colors.errorLight,   color: ST.colors.error,   label: "Critical" },
};

/* ── Quick-access resource row ── */
function ResourceRow({ icon: Icon, color, title, description, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.75,
        px: 2,
        py: 1.5,
        cursor: "pointer",
        borderRadius: 1.5,
        transition: "background 0.15s",
        "&:hover": { bgcolor: ST.colors.bg },
        "&:hover .arrow": { opacity: 1, transform: "translateX(2px)" },
      }}
    >
      <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon sx={{ fontSize: 18, color }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.navy }}>{title}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap>{description}</Typography>
      </Box>
      <ArrowForwardIcon className="arrow" sx={{ fontSize: 16, color: ST.colors.textSecondary, opacity: 0.4, transition: "all 0.15s", flexShrink: 0 }} />
    </Box>
  );
}

/* ── Inline dismissable alerts ── */
function InlineAlerts({ alerts }) {
  const [dismissed, setDismissed] = useState([]);
  const visible = alerts.filter((a) => !dismissed.includes(a.id));
  if (!visible.length) return null;
  return (
    <Stack spacing={1} sx={{ mb: 3 }}>
      {visible.map((a) => (
        <Alert
          key={a.id}
          severity={a.severity || "info"}
          action={
            <IconButton size="small" onClick={() => setDismissed((d) => [...d, a.id])}>
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ borderRadius: 2, "& .MuiAlert-message": { width: "100%" } }}
        >
          <Typography variant="body2" fontWeight={700}>{a.title}</Typography>
          {a.message && <Typography variant="caption" sx={{ display: "block", mt: 0.25 }}>{a.message}</Typography>}
        </Alert>
      ))}
    </Stack>
  );
}

/* ── Stat pill ── */
function Stat({ label, value, color }) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)", display: "block", fontSize: 10 }}>{label}</Typography>
      <Typography variant="subtitle2" fontWeight={800} sx={{ color: color || "white", lineHeight: 1.1 }}>{value ?? "—"}</Typography>
    </Box>
  );
}

/* ══ Main page ══ */
export default function StudentSupportHub() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [journeyData, setJourneyData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    apiFetch("/student-journey/my-journey-excel")
      .then((raw) => {
        setJourneyData(transformExcelJourney(raw));
        setAlerts(
          (raw.alerts || []).map((a, i) => ({
            id: `alert-${i}`,
            severity: a.type === "critical" || a.type === "urgent" ? "error" : a.type === "warning" ? "warning" : "info",
            title: a.title,
            message: a.message,
          }))
        );
      })
      .catch(() => {
        setJourneyData({ student: {}, milestones: [], risk_info: { risk_level: "low" } });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}><CircularProgress sx={{ color: BRAND.teal }} /></Box>;
  }

  const isPostgrad = journeyData?.is_postgraduate;
  const student = journeyData?.student ?? {};
  const risk = journeyData?.risk_info?.risk_level || "low";
  const riskStyle = RISK_STYLE[risk] || RISK_STYLE.low;
  const pgResearch = journeyData?.pg_research;
  const pgSupport = journeyData?.pg_academic_support || [];

  const undergradResources = [
    { icon: AttachMoneyIcon,   color: ST.chart.green,  title: "Scholarships",    description: "Browse and apply for financial aid",        onClick: () => router.push("/student/scholarships") },
    { icon: LibraryBooksIcon,  color: ST.chart.blue,   title: "Library",         description: "Access library resources and databases",    onClick: () => router.push("/student/library") },
    { icon: PersonIcon,        color: ST.chart.purple, title: "My Advisor",      description: "View your academic advisor contact",        onClick: () => router.push("/student/profile") },
    { icon: AccountBalanceIcon,color: ST.chart.teal,   title: "Financial Aid",   description: "Fees, payments and balance",                onClick: () => router.push("/student/financials") },
    { icon: SupportAgentIcon,  color: ST.chart.red,    title: "Student Services","description": "General student support and welfare",    onClick: () => router.push("/student/support") },
  ];

  const postgradResources = [
    { icon: ScienceIcon,       color: ST.chart.orange, title: "Research Grants", description: "Funding opportunities for your research",   onClick: () => router.push("/student/grants/opportunities") },
    { icon: LibraryBooksIcon,  color: ST.chart.blue,   title: "Library Resources","description": "FAIR-compliant databases & datasets",   onClick: () => router.push("/student/library") },
    { icon: MenuBookIcon,      color: ST.chart.purple, title: "Writing Centre",  description: "Thesis and academic writing support",       onClick: () => router.push("/student/support/writing-centre") },
    { icon: PersonIcon,        color: ST.chart.green,  title: "Supervisor",      description: pgResearch?.supervisor || "Research supervision", onClick: () => router.push("/student/support/supervisor") },
    { icon: AccountBalanceIcon,color: ST.chart.teal,   title: "Financials",      description: "Fees and grant disbursements",              onClick: () => router.push("/student/financials") },
    { icon: SupportAgentIcon,  color: ST.chart.red,    title: "PG Support",      description: "Graduate school academic support",          onClick: () => router.push("/student/support/pg-support-office") },
  ];

  const resources = isPostgrad ? postgradResources : undergradResources;

  return (
    <Box>
      {/* ── Compact header ── */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, background: `linear-gradient(135deg, ${BRAND.navy} 0%, #1e3a5f 100%)` }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${BRAND.teal}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <HeadsetMicIcon sx={{ color: BRAND.teal, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: "white", lineHeight: 1.2 }}>
                {isPostgrad ? "Postgraduate Support Hub" : "Student Support Hub"}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
                {student.program || "—"} · {student.current_milestone || journeyData?.journey_stage || "Active"}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Stat label="GPA" value={student.gpa} />
            <Stat label="Stage" value={student.current_milestone || "—"} />
            <Stat label="Risk" value={riskStyle.label} color={risk === "low" ? BRAND.teal : risk === "medium" ? "#fbbf24" : "#f87171"} />
            {alerts.length > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.5, borderRadius: 1.5, bgcolor: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
                <WarningAmberIcon sx={{ fontSize: 14, color: "#fbbf24" }} />
                <Typography variant="caption" fontWeight={700} sx={{ color: "#fbbf24" }}>{alerts.length} alert{alerts.length !== 1 ? "s" : ""}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* ── Alerts ── */}
      <InlineAlerts alerts={alerts} />

      {/* ── Main grid: 2/3 left, 1/3 right ── */}
      <Grid container spacing={2.5}>

        {/* Left column */}
        <Grid item xs={12} md={8}>
          <Stack spacing={2.5}>

            {/* Journey timeline */}
            <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, overflow: "hidden" }}>
              <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${ST.colors.border}`, display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 18, color: BRAND.teal }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: BRAND.navy }}>
                  {isPostgrad ? "Research journey" : "Academic journey"}
                </Typography>
                <Chip
                  label={riskStyle.label}
                  size="small"
                  sx={{ ml: "auto", height: 20, fontSize: 10, fontWeight: 700, bgcolor: riskStyle.bg, color: riskStyle.color }}
                />
              </Box>
              <Box sx={{ px: 2.5, py: 2.5 }}>
                <JourneyTimeline milestones={journeyData?.milestones || []} journeyData={journeyData} compact />
              </Box>
            </Paper>

            {/* PG Research tracker (postgrad only) */}
            {isPostgrad && pgResearch && (
              <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2.5 }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${ST.colors.border}`, display: "flex", alignItems: "center", gap: 1 }}>
                  <ScienceIcon sx={{ fontSize: 18, color: BRAND.teal }} />
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: BRAND.navy }}>Research tracker</Typography>
                </Box>
                <Box sx={{ px: 2.5, py: 2.5 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Dissertation title</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25 }}>{pgResearch.dissertation_title || "—"}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Supervisor</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25 }}>{pgResearch.supervisor || "—"}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Research area</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25 }}>{pgResearch.research_area || "—"}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Current challenge</Typography>
                      <Typography variant="body2" sx={{ mt: 0.25 }}>{pgResearch.current_challenge || "—"}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Next milestone</Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.teal, mt: 0.25 }}>{pgResearch.next_milestone || "—"}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            )}

            {/* PG academic support table */}
            {isPostgrad && pgSupport.length > 0 && (
              <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, overflow: "hidden" }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${ST.colors.border}` }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: BRAND.navy }}>PG academic support services</Typography>
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, color: ST.colors.textSecondary, py: 1, bgcolor: ST.colors.bg } }}>
                      <TableCell>Service</TableCell>
                      <TableCell>Provider</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="right">Next session</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pgSupport.map((row, i) => (
                      <TableRow key={i} sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: `${BRAND.teal}06` } }}>
                        <TableCell><Typography variant="body2" fontWeight={600}>{row.service}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{row.provider}</Typography></TableCell>
                        <TableCell align="center">
                          <Chip size="small" label={row.status} sx={{ height: 18, fontSize: 10, fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="right"><Typography variant="caption">{row.next_session || "—"}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}

            {/* Summary stats (undergrad) */}
            {!isPostgrad && student && (
              <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2.5 }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${ST.colors.border}` }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: BRAND.navy }}>Academic summary</Typography>
                </Box>
                <Box sx={{ px: 2.5, py: 2 }}>
                  <Grid container spacing={2.5}>
                    {[
                      { label: "Programme", value: student.program },
                      { label: "Current stage", value: student.current_milestone },
                      { label: "GPA", value: student.gpa },
                      { label: "Academic standing", value: journeyData?.academic_standing?.standing },
                      { label: "Journey stage", value: journeyData?.journey_stage },
                      { label: "Risk level", value: riskStyle.label },
                    ].map(({ label, value }) => (
                      <Grid item xs={6} sm={4} key={label}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{label}</Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ mt: 0.25, color: label === "Risk level" ? riskStyle.color : BRAND.navy }}>
                          {value || "—"}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Paper>
            )}
          </Stack>
        </Grid>

        {/* Right column: quick access */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, overflow: "hidden", position: "sticky", top: 16 }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${ST.colors.border}` }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: BRAND.navy }}>Quick access</Typography>
              <Typography variant="caption" color="text.secondary">Services and resources</Typography>
            </Box>
            <Box sx={{ py: 1 }}>
              {resources.map((r, i) => (
                <Box key={r.title}>
                  <ResourceRow {...r} />
                  {i < resources.length - 1 && <Divider sx={{ mx: 2, opacity: 0.5 }} />}
                </Box>
              ))}
            </Box>
            <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${ST.colors.border}`, bgcolor: ST.colors.bg }}>
              <Typography variant="caption" color="text.secondary">
                Need help? Contact the student services office or visit the portal below.
              </Typography>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                sx={{ mt: 1.25, textTransform: "none", fontWeight: 600, borderRadius: 1.5, borderColor: BRAND.teal, color: BRAND.teal, fontSize: 12 }}
                onClick={() => router.push("/student/support")}
              >
                Open a support request
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
