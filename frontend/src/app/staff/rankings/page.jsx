"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Button,
  GlobalStyles,
  Tooltip,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { ST } from "@/lib/staffTheme";
import { apiFetch, getWebSocketUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { buildPlatformInsights } from "@/lib/rankingInsights";
import { withInstitutionDomains } from "@/lib/webometricsVisibility";
import Link from "next/link";
import InsightsIcon from "@mui/icons-material/Insights";
import { filterSystemsByIds, institutionFrameworkIds } from "@/lib/rankings/catalog";
import { emptyScenario } from "@/lib/rankings/executive";
import RankingKpiStrip from "@/components/staff/rankings/RankingKpiStrip";
import { ScenarioPlanner } from "@/components/staff/rankings/ScenarioBaseline";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  RANKING_SYSTEMS,
  buildNaacSystem,
  buildNirfSystem,
  buildRankingTabs,
  getRatioNote,
} from "@/lib/rankings/frameworks";
import {
  effectiveScore,
  weightedReadiness,
  systemReadiness,
  formatScorePct,
  contributionFor,
  scoreInterpretation,
  defaultActions,
  resolveDetail,
  causesForCriterion,
  criterionTabLabel,
  flagIndicators,
  IAQRI_CRITERION_OWNER,
} from "@/lib/rankings/readiness";

const PRINT_STYLES = (
  <GlobalStyles
    styles={`
      @media print {
        .MuiDrawer-root,
        .MuiAppBar-root,
        .no-print {
          display: none !important;
        }
        main {
          margin-left: 0 !important;
          margin-top: 0 !important;
          padding: 16px !important;
          width: 100% !important;
        }
        .MuiPaper-root {
          box-shadow: none !important;
          border: 1px solid #e0e0e0 !important;
        }
        .MuiLinearProgress-root {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .MuiChip-root {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @page {
          margin: 1.2cm;
          size: A4 portrait;
        }
        .ranking-detail-hint {
          display: none !important;
        }
        .print-only {
          display: block !important;
        }
        body.printing-ranking-report .ranking-tab-panel:not(.print-export-target) {
          display: none !important;
        }
        body.printing-ranking-report .ranking-system-report:not(.print-export-target) {
          display: none !important;
        }
        body.printing-ranking-report .ranking-tab-panel.print-export-target,
        body.printing-ranking-report .ranking-system-report.print-export-target {
          display: block !important;
          page-break-inside: avoid;
          margin-bottom: 16px;
        }
      }
      .print-only {
        display: none;
      }
    `}
  />
);


export default function UniversityRankingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const L = t.staff.universityRankings;
  const [loading, setLoading] = useState(true);
  const [institutionalData, setInstitutionalData] = useState(null);
  const [institutionId, setInstitutionId] = useState(null);
  const [rankingTab, setRankingTab] = useState(0);
  const [arabSystemId, setArabSystemId] = useState("aur");
  const [visibilityLive, setVisibilityLive] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [printSystemId, setPrintSystemId] = useState(null);

  const institutionName = user?.institution_name || "Institution";
  const enabledSystems = useMemo(() => {
    const withIaqri = [
      ...RANKING_SYSTEMS,
      buildNaacSystem(institutionalData),
      buildNirfSystem(institutionalData),
    ];
    const systems = withInstitutionDomains(withIaqri, {
      domains: user?.institution_domains || [],
      primaryDomain: user?.institution_primary_domain || null,
      liveAssessment: visibilityLive,
    });
    // Only the frameworks this institution has enabled (all, if none chosen yet).
    return filterSystemsByIds(systems, institutionFrameworkIds(user?.ranking_frameworks));
  }, [
    user?.institution_domains,
    user?.institution_primary_domain,
    user?.ranking_frameworks,
    visibilityLive,
    institutionalData,
  ]);
  const rankingTabs = useMemo(() => buildRankingTabs(enabledSystems), [enabledSystems]);

  // The framework currently open in the tabs (drives the "Selected framework" KPIs).
  const selectedFrameworkSystem = useMemo(() => {
    const tab = rankingTabs[rankingTab];
    if (!tab) return null;
    return tab.type === "group"
      ? tab.systems.find((system) => system.id === arabSystemId) || tab.systems[0]
      : tab.systems[0];
  }, [rankingTabs, rankingTab, arabSystemId]);

  const [scenario, setScenario] = useState(emptyScenario);

  // Deep link from the University Rankings Summary: /staff/rankings?framework=<system id>
  const [deepLinkApplied, setDeepLinkApplied] = useState(false);
  useEffect(() => {
    if (deepLinkApplied || !institutionalData || !rankingTabs.length) return;
    setDeepLinkApplied(true);
    const wanted = new URLSearchParams(window.location.search).get("framework");
    if (!wanted) return;
    const index = rankingTabs.findIndex((tab) => tab.systems.some((system) => system.id === wanted));
    if (index < 0) return;
    setRankingTab(index);
    if (rankingTabs[index].type === "group") setArabSystemId(wanted);
  }, [deepLinkApplied, institutionalData, rankingTabs]);

  // Keep the selected tab valid if the enabled list shrinks.
  useEffect(() => {
    if (rankingTab > 0 && rankingTab >= rankingTabs.length) setRankingTab(0);
  }, [rankingTab, rankingTabs.length]);

  const exportableSystems = useMemo(
    () =>
      rankingTabs.flatMap((tab) =>
        tab.systems.map((system) => ({
          id: system.id,
          title: system.title,
          tabLabel: system.tabLabel,
          badge: system.badge,
          badgeColor: system.badgeColor,
          groupLabel: tab.type === "group" ? tab.tabLabel : null,
        }))
      ),
    [rankingTabs]
  );

  const printSystem = useMemo(
    () => exportableSystems.find((system) => system.id === printSystemId) || null,
    [exportableSystems, printSystemId]
  );

  const fetchInstitutionalData = useCallback(async () => {
    try {
      // Fetch data from Excel Rankings Dashboard
      const excelData = await apiFetch("/rankings-excel/dashboard-data");
      const inst = excelData.institutional_data;

      // Transform Excel data to match component structure
      setInstitutionalData({
        totalStudents: inst.total_students,
        totalStudentsBreakdown: `${inst.ug_students} UG · ${inst.pg_students} PG`,
        internationalStudents: inst.international_students,
        internationalStudentsCount: `${Math.round(parseFloat(inst.international_students) / 100 * inst.total_students)} of ${inst.total_students}`,
        femaleRatio: inst.female_ratio,
        femaleCount: `${Math.round(parseFloat(inst.female_ratio) / 100 * inst.total_students)} of ${inst.total_students}`,
        avgGPA: inst.avg_gpa,
        gpaScale: "",
        faculty: inst.faculty,
        facultySchools: `${inst.schools_faculties} schools`,
        studentFacultyRatio: inst.student_faculty_ratio,
        ratioNote: getRatioNote(inst.student_faculty_ratio),
        researchStudents: inst.research_students,
        researchBreakdown: "MSc/MA by Research",
        activeNationalities: inst.nationalities,
        nationalitiesRegion: "across Africa",
        academicYear: "2023/24",
        semester: "Sem 1",
        institutionName: user?.institution_name || "Institution",
        rankingsData: excelData.rankings,
      });
    } catch (error) {
      console.error("Error fetching institutional data:", error);
      setInstitutionalData({
        totalStudents: 37,
        totalStudentsBreakdown: "25 UG · 12 PG",
        internationalStudents: "35.1%",
        internationalStudentsCount: "13 of 37",
        femaleRatio: "48.6%",
        femaleCount: "18 of 37",
        avgGPA: "3.32 / 4.0",
        gpaScale: "",
        faculty: 15,
        facultySchools: "9 schools",
        studentFacultyRatio: "2.5 : 1",
        ratioNote: "world-class",
        researchStudents: 6,
        researchBreakdown: "MSc/MA by Research",
        activeNationalities: 10,
        nationalitiesRegion: "across Africa",
        academicYear: "2023/24",
        semester: "Sem 1",
        institutionName: user?.institution_name || "Institution",
        rankingsData: null,
      });
    } finally {
      setLoading(false);
    }
  }, [user?.institution_name]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setVisibilityLive({
          live: false,
          ahrefs: { status: "loading", referring_domains: null },
          scoring: { score: 18, status: "Limited", band: "loading" },
          canonical_domain: user?.institution_primary_domain || null,
          registered_domains: user?.institution_domains || [],
        });
        const assessment = await apiFetch("/rankings/webometrics/visibility");
        if (!cancelled) setVisibilityLive(assessment);
      } catch (error) {
        console.error("Error fetching live Webometrics Visibility:", error);
        if (!cancelled) {
          setVisibilityLive({
            live: false,
            ahrefs: {
              status: "provider_error",
              referring_domains: null,
              message: error?.message || "Visibility API unavailable",
            },
            scoring: { score: 15, status: "Limited", band: "api_error" },
            canonical_domain: user?.institution_primary_domain || null,
            registered_domains: user?.institution_domains || [],
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.institution_domains, user?.institution_primary_domain]);

  useEffect(() => {
    fetchInstitutionalData();

    const ws = new WebSocket(getWebSocketUrl("/ws/rankings"));

    ws.onopen = () => {
      console.log("✅ WebSocket connected for live rankings updates");
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "rankings_update") {
        console.log("📊 Received live update from Excel file");
        // Full refresh so insights and cards stay in sync with dashboard scores
        fetchInstitutionalData();
      }
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket disconnected");
    };

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("ping");
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [fetchInstitutionalData]);

  const handleExportPDF = () => {
    setExportOpen(true);
  };

  const handleExportRankingReport = (system) => {
    setExportOpen(false);
    setPrintSystemId(system.id);
    if (system.groupLabel) {
      setArabSystemId(system.id);
    }

    const prevTitle = document.title;
    document.title = L.reportDocumentTitle
      .replace("{institution}", institutionName)
      .replace("{ranking}", system.tabLabel);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove("printing-ranking-report");
      document.title = prevTitle;
      setPrintSystemId(null);
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    document.body.classList.add("printing-ranking-report");

    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        // Fallback if afterprint does not fire (some browsers)
        setTimeout(cleanup, 1500);
      }, 80);
    });
  };

  const getScoreColor = (score) => {
    if (score >= 60) return ST.colors.success;
    if (score >= 40) return ST.colors.warning;
    if (score >= 20) return "#EA580C";
    return ST.colors.error;
  };

  const getScoreBarColor = (score) => {
    if (score >= 60) return ST.colors.success;
    if (score >= 40) return ST.colors.warning;
    if (score >= 20) return "#EA580C";
    return ST.colors.error;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!institutionalData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Unable to load institutional data</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {PRINT_STYLES}
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="flex-end" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary, mb: 0.5 }}>
              University Rankings
            </Typography>
            <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
              {institutionName} · Academic Year {institutionalData.academicYear} · {institutionalData.semester}
            </Typography>
            <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", mt: 0.25 }}>
              Readiness figures are estimates of evidence coverage from LMS/SIS data, not official scores or
              predicted ranks.
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1.5} className="no-print">
            <Button
              component={Link}
              href="/staff/rankings/executive"
              size="small"
              startIcon={<InsightsIcon />}
              sx={{ textTransform: "none", fontWeight: 600, color: ST.colors.textSecondary }}
            >
              Rankings summary
            </Button>
            <Tooltip title={L.exportPdfTooltip}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={handleExportPDF}
                sx={{
                  borderColor: ST.colors.primary,
                  color: ST.colors.primary,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: `${ST.colors.primary}10`,
                    borderColor: ST.colors.primary,
                  },
                }}
              >
                {L.exportPdf}
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        maxWidth="sm"
        fullWidth
        className="no-print"
      >
        <DialogTitle sx={{ pr: 6, position: "relative" }}>
          {L.exportDialogTitle}
          <IconButton
            aria-label={t.common.close}
            onClick={() => setExportOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {L.exportDialogSubtitle}
          </Typography>
          <List disablePadding>
            {exportableSystems.map((system) => (
              <ListItemButton
                key={system.id}
                onClick={() => handleExportRankingReport(system)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  border: `1px solid ${ST.colors.border}`,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: system.badgeColor,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={system.tabLabel}
                  secondary={
                    system.groupLabel
                      ? `${system.groupLabel} · ${system.title}`
                      : system.title
                  }
                  primaryTypographyProps={{ fontWeight: 700 }}
                />
                <Typography variant="caption" color="primary" fontWeight={600} sx={{ ml: 1 }}>
                  {L.downloadReport}
                </Typography>
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportOpen(false)}>{t.common.cancel}</Button>
        </DialogActions>
      </Dialog>

      {printSystem && (
        <Box className="print-only" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={700}>
            {L.printReportHeading.replace("{ranking}", printSystem.tabLabel)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {institutionName}
          </Typography>
        </Box>
      )}

      {/* Ranking KPIs: all enabled frameworks + the framework open below */}
      <RankingKpiStrip systems={enabledSystems} selectedSystem={selectedFrameworkSystem} />

      {/* Institutional figures the scores are calculated from */}
      <Accordion
        disableGutters
        elevation={0}
        sx={{
          mb: 4,
          border: `1px solid ${ST.colors.border}`,
          borderRadius: "8px !important",
          "&:before": { display: "none" },
          "@media print": { display: "none" },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2.5 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              Institutional data used for scoring
            </Typography>
            <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
              {institutionalData.totalStudents} students · {institutionalData.faculty} faculty ·{" "}
              {institutionalData.activeNationalities} nationalities · from the LMS/SIS
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Total students
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {institutionalData.totalStudents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {institutionalData.totalStudentsBreakdown}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                International students
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {institutionalData.internationalStudents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {institutionalData.internationalStudentsCount}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Female ratio
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {institutionalData.femaleRatio}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {institutionalData.femaleCount}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Avg GPA
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {institutionalData.avgGPA}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {institutionalData.gpaScale}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Faculty (instructors)
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {institutionalData.faculty}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {institutionalData.facultySchools}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Student:Faculty ratio
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {institutionalData.studentFacultyRatio}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {institutionalData.ratioNote}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Research students
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {institutionalData.researchStudents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {institutionalData.researchBreakdown}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Active nationalities
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {institutionalData.activeNationalities}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {institutionalData.nationalitiesRegion}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Ranking Framework Breakdown Section */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5, color: ST.colors.textPrimary }}>
        Framework breakdown
      </Typography>

      <Paper
        sx={{
          mb: 4,
          overflow: "hidden",
          border: `1px solid ${ST.colors.border}`,
        }}
      >
        <Tabs
          value={rankingTab}
          onChange={(_, v) => setRankingTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          className="no-print"
          sx={{
            px: 1,
            borderBottom: `1px solid ${ST.colors.border}`,
            minHeight: 48,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: 14,
              minHeight: 48,
              minWidth: 120,
            },
            "& .Mui-selected": { fontWeight: 700, color: ST.colors.primary },
            "& .MuiTabs-indicator": { bgcolor: ST.colors.primary, height: 3 },
          }}
        >
          {rankingTabs.map((tab) => (
            <Tab
              key={tab.id}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: tab.badgeColor,
                      flexShrink: 0,
                    }}
                  />
                  {tab.tabLabel}
                  {tab.type === "single" && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ color: ST.colors.textSecondary, fontWeight: 600 }}
                    >
                      {formatScorePct(systemReadiness(tab.systems[0]))}
                    </Typography>
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>

        {rankingTabs.map((tab, index) => {
          const isGroup = tab.type === "group";
          const selectedSystem = isGroup
            ? tab.systems.find((system) => system.id === arabSystemId) || tab.systems[0]
            : tab.systems[0];
          const tabActive = rankingTab === index;

          return (
            <Box
              key={tab.id}
              className={`ranking-tab-panel${
                tab.systems.some((system) => system.id === printSystemId)
                  ? " print-export-target"
                  : ""
              }`}
              sx={{
                display: tabActive ? "block" : "none",
              }}
            >
              {isGroup && (
                <GroupRankingPicker
                  systems={tab.systems}
                  selectedId={selectedSystem.id}
                  onSelect={setArabSystemId}
                />
              )}
              {(isGroup ? tab.systems : [selectedSystem]).map((system) => {
                const isSelected = system.id === selectedSystem.id;
                return (
                  <Box
                    key={system.id}
                    className={`ranking-system-report${
                      system.id === printSystemId ? " print-export-target" : ""
                    }`}
                    sx={{
                      display: isSelected ? "block" : "none",
                    }}
                  >
                    <RankingCard
                      badge={system.badge}
                      badgeColor={system.badgeColor}
                      title={system.title}
                      subtitle={system.subtitle}
                      overallReadiness={system.overallReadiness}
                      indicators={system.indicators}
                      criteria={system.criteria}
                      totalWeightLabel={system.totalWeightLabel}
                      methodology={system.methodology}
                      system={system}
                      institutionalData={institutionalData}
                      institutionName={institutionName}
                      active={(tabActive && isSelected) || system.id === printSystemId}
                      hideHeader={isGroup && system.id !== printSystemId}
                      embedded
                    />
                  </Box>
                );
              })}
              {tab.id === "india" && (
                <>
                  {tab.systems.some((s) => s.id === "nirf") && (
                    <>
                      <IaqriGapAnalysisPanel nirfSystem={tab.systems.find((s) => s.id === "nirf")} />
                      <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1 }}>
                          Scenario planner: NIRF (National Institutional Ranking Framework, India)
                        </Typography>
                        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mb: 2 }}>
                          Move the sliders to model an intervention. Projections use the same weighting as the NIRF
                          scores above and are illustrative, not a forecast.
                        </Typography>
                        <ScenarioPlanner
                          nirfSystem={tab.systems.find((s) => s.id === "nirf")}
                          values={scenario}
                          onChange={setScenario}
                        />
                      </Box>
                    </>
                  )}
                  <IaqriEarlyWarningPanel
                    naacSystem={tab.systems.find((s) => s.id === "naac")}
                    nirfSystem={tab.systems.find((s) => s.id === "nirf")}
                  />
                  <IaqriActionTrackerPanel
                    naacSystem={tab.systems.find((s) => s.id === "naac")}
                    nirfSystem={tab.systems.find((s) => s.id === "nirf")}
                  />
                  <IaqriCommandCentrePanel
                    naacSystem={tab.systems.find((s) => s.id === "naac")}
                    nirfSystem={tab.systems.find((s) => s.id === "nirf")}
                  />
                </>
              )}
            </Box>
          );
        })}
      </Paper>

      {/* Methodology note - page bottom */}
      <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 1, mb: 2 }}>
        <Typography variant="body2" fontWeight={600} gutterBottom>
          Methodology note:
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Score estimates are proxies derived from institutional LMS/SIS data available in the TemplumIS dataset.
          Indicators requiring external data (Scopus, Web of Science, employer surveys, reputation surveys) cannot be
          fully evaluated from internal records alone. Scores represent current data readiness relative to each
          ranking&apos;s criteria, not projected ranking positions.
        </Typography>
        <Typography variant="body2">
          Open bibliometric infrastructure - including{" "}
          <Box
            component="a"
            href="https://openalex.org"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: "inherit",
              fontWeight: 600,
              textDecorationColor: "currentColor",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.3,
              verticalAlign: "middle",
            }}
          >
            OpenAlex
            <OpenInNewIcon sx={{ fontSize: 12 }} />
          </Box>
          , which indexes over 250 million scholarly works and provides free DOI-level citation tracking - offers a
          supplementary pathway to assess research output where commercial indexing (Scopus, WoS) is unavailable or
          cost-prohibitive. Institutions can register DOIs through any journal publisher and verify coverage via the
          OpenAlex API at no cost.
        </Typography>
      </Alert>
    </Box>
  );
}

function IndicatorStatusChip({ status, sx }) {
  if (!status) return null;
  const positive = status === "Good" || status === "Excellent";
  const missing = status === "No data" || status === "Not applicable";
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        mt: 0.5,
        height: 20,
        fontSize: 10,
        bgcolor: positive ? `${ST.colors.success}20` : missing ? `${ST.colors.error}20` : `${ST.colors.warning}20`,
        color: positive ? ST.colors.success : missing ? ST.colors.error : ST.colors.warning,
        ...sx,
      }}
    />
  );
}


const clickableCellSx = {
  cursor: "pointer",
  verticalAlign: "top",
  transition: "background-color 0.15s ease",
  "&:hover": { bgcolor: `${ST.colors.primary}0A` },
  "&:focus-visible": {
    outline: `2px solid ${ST.colors.primary}`,
    outlineOffset: -2,
  },
};

function ClickableCell({ children, onClick, tooltip }) {
  return (
    <TableCell
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(e);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={tooltip}
      sx={clickableCellSx}
    >
      <Tooltip title={tooltip} placement="top">
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={0.5}>
          <Box sx={{ minWidth: 0, flex: 1 }}>{children}</Box>
          <KeyboardArrowRightIcon
            className="ranking-detail-hint no-print"
            sx={{ fontSize: 18, color: ST.colors.textSecondary, mt: 0.25, flexShrink: 0 }}
          />
        </Box>
      </Tooltip>
    </TableCell>
  );
}

function IndicatorRows({ indicators, onOpenDetail }) {
  return indicators.map((indicator, index) => {
    const score = effectiveScore(indicator);
    return (
    <TableRow key={index} hover>
      <TableCell>
        <Typography variant="body2" fontWeight={600}>
          {indicator.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
          {indicator.description}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={600}>
          {indicator.weight}
        </Typography>
      </TableCell>
      <ClickableCell tooltip="View institution performance details" onClick={() => onOpenDetail?.(indicator, 0)}>
        <Typography variant="body2">{indicator.performance}</Typography>
        <IndicatorStatusChip status={indicator.status} />
      </ClickableCell>
      <ClickableCell tooltip="View score breakdown" onClick={() => onOpenDetail?.(indicator, 1)}>
        <LinearProgress
          variant="determinate"
          value={score}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: `${ST.colors.textSecondary}20`,
            "& .MuiLinearProgress-bar": {
              bgcolor: getScoreBarColor(score),
              borderRadius: 4,
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          {formatScorePct(score)}
        </Typography>
      </ClickableCell>
    </TableRow>
    );
  });
}

function ReadinessBar({ value, color, height = 10, label }) {
  return (
    <Box>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height,
          borderRadius: 4,
          bgcolor: `${ST.colors.textSecondary}20`,
          "& .MuiLinearProgress-bar": {
            bgcolor: color,
            borderRadius: 4,
          },
        }}
      />
      <Typography
        variant="caption"
        fontWeight={700}
        sx={{ mt: 0.5, display: "block", color: color || ST.colors.textSecondary }}
      >
        {label || `${Math.round(value)}%`}
      </Typography>
    </Box>
  );
}

function IndicatorTableHead() {
  return (
    <TableHead>
      <TableRow>
        <TableCell sx={{ fontWeight: 600, width: "25%" }}>Indicator</TableCell>
        <TableCell sx={{ fontWeight: 600, width: "10%" }}>Weight</TableCell>
        <TableCell sx={{ fontWeight: 600, width: "40%" }}>
          Institution performance
          <Typography variant="caption" display="block" color="text.secondary" className="no-print">
            Click for details
          </Typography>
        </TableCell>
        <TableCell sx={{ fontWeight: 600, width: "25%" }}>
          Score estimate
          <Typography variant="caption" display="block" color="text.secondary" className="no-print">
            Click for breakdown
          </Typography>
        </TableCell>
      </TableRow>
    </TableHead>
  );
}

function DetailList({ items }) {
  if (!items?.length) return null;
  return (
    <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
      {items.map((item) => (
        <Typography key={item} component="li" variant="body2" sx={{ mb: 0.75 }}>
          {item}
        </Typography>
      ))}
    </Box>
  );
}

function RankingDetailDialog({ detail, onClose, onTabChange, badgeColor }) {
  const open = Boolean(detail);
  const tab = detail?.tab ?? 0;
  const isGroup = detail?.kind === "group";
  const indicator = !isGroup ? detail?.indicator : null;
  const resolved = indicator ? resolveDetail(indicator) : null;
  const contribution = indicator ? contributionFor(indicator) : null;
  const items = isGroup ? detail.items || [] : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6, fontWeight: 800, position: "relative", pb: 1 }}>
        {isGroup ? detail.title : indicator?.name}
        <IconButton
          aria-label="Close details"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8, color: ST.colors.textSecondary }}
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
          {isGroup
            ? `${items.length} indicators · ${detail.weightLabel || "composite readiness"}`
            : indicator?.description}
        </Typography>
        {!isGroup && indicator && (
          <Box display="flex" alignItems="center" gap={1} mt={1} flexWrap="wrap">
            {indicator.weight && (
              <Chip label={`Weight ${indicator.weight}`} size="small" variant="outlined" />
            )}
            <IndicatorStatusChip status={indicator.status} sx={{ mt: 0 }} />
          </Box>
        )}
      </DialogTitle>
      <Tabs
        value={tab}
        onChange={(_, v) => onTabChange(v)}
        sx={{
          px: 2,
          borderBottom: `1px solid ${ST.colors.border}`,
          "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 44 },
          "& .Mui-selected": { color: badgeColor || ST.colors.primary },
          "& .MuiTabs-indicator": { bgcolor: badgeColor || ST.colors.primary },
        }}
      >
        <Tab label="Institution performance" />
        <Tab label="Score breakdown" />
      </Tabs>
      <DialogContent sx={{ pt: 2.5 }}>
        {isGroup && tab === 0 && (
          <Box>
            {items.map((item) => (
              <Box
                key={item.name}
                sx={{
                  mb: 1.5,
                  pb: 1.5,
                  borderBottom: `1px solid ${ST.colors.border}`,
                  "&:last-child": { borderBottom: 0, mb: 0, pb: 0 },
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} mb={0.5}>
                  <Typography variant="body2" fontWeight={700}>
                    {item.name}
                  </Typography>
                  <IndicatorStatusChip status={item.status} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {item.performance}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {isGroup && tab === 1 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Overall readiness ({formatScorePct(detail.readiness)}) is the weighted average of indicator scores.
              Indicators with no data or not applicable contribute 0%. The rows below show each score and its
              weighted contribution.
            </Typography>
            {items.map((item) => {
              const score = effectiveScore(item);
              const contrib = contributionFor(item);
              return (
                <Box key={item.name} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" gap={1} mb={0.5}>
                    <Typography variant="body2" fontWeight={600}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.weight} · {formatScorePct(score)}
                      {contrib ? ` · ${contrib.value.toFixed(1)} pts` : ""}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={score}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: `${ST.colors.textSecondary}20`,
                      "& .MuiLinearProgress-bar": {
                        bgcolor: getScoreBarColor(score),
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              );
            })}
            <Divider sx={{ my: 2 }} />
            <ReadinessBar
              value={detail.readiness}
              color={badgeColor}
              label={`${formatScorePct(detail.readiness)} overall readiness`}
            />
          </Box>
        )}

        {!isGroup && indicator && tab === 0 && (
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
              Current assessment
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {indicator.performance}
            </Typography>
            {resolved.source && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Source: {resolved.source}
              </Typography>
            )}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
              Evidence on record
            </Typography>
            <Box sx={{ mb: 2 }}>
              {resolved.evidence.map((row) => (
                <Box key={row.label} sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {row.label}
                  </Typography>
                  <Typography variant="body2">{row.value}</Typography>
                </Box>
              ))}
            </Box>
            {resolved.gaps.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                  Data gaps
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <DetailList items={resolved.gaps} />
                </Box>
              </>
            )}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
              Recommended next steps
            </Typography>
            <DetailList items={resolved.actions} />
          </Box>
        )}

        {!isGroup && indicator && tab === 1 && (
          <Box>
            <ReadinessBar
              value={effectiveScore(indicator)}
              color={getScoreBarColor(effectiveScore(indicator))}
              label={`${formatScorePct(effectiveScore(indicator))} score`}
            />
            <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
              {scoreInterpretation(effectiveScore(indicator), indicator.status)}
            </Typography>
            {contribution && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: `${badgeColor || ST.colors.primary}10`,
                  border: `1px solid ${ST.colors.border}`,
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  Weighted contribution
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {contribution.value.toFixed(1)} pts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatScorePct(contribution.score)} of {contribution.scaleLabel}
                </Typography>
              </Box>
            )}
            {resolved.factors.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                  What moves this score
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {resolved.factors.map((factor) => (
                    <Box key={factor.label} sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {factor.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {factor.note}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
              How to raise it
            </Typography>
            <DetailList items={resolved.actions} />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
              Scores are TemplumIS data-readiness estimates, not an official ranking position.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Ranking Card Component
function criterionWeightLabel(criterion) {
  if (criterion.weightLabel) return criterion.weightLabel;
  if (criterion.points != null) return `${criterion.points} pts`;
  return "";
}

const METHODOLOGY_LINK_SX = {
  color: ST.colors.primary,
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 0.3,
  verticalAlign: "middle",
  "&:hover": { textDecoration: "underline" },
};

function MethodologyDialogShell({ open, onClose, title, officialUrl, children }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6, fontWeight: 800, position: "relative" }}>
        {title}
        <IconButton
          aria-label="Close methodology"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8, color: ST.colors.textSecondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
        >
          Full methodology
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function WebometricsMethodologyDialog({ open, onClose }) {
  const officialUrl = "https://www.webometrics.org/methodology";

  return (
    <MethodologyDialogShell
      open={open}
      onClose={onClose}
      title="Webometrics methodology"
      officialUrl={officialUrl}
    >
      <Typography variant="body2" sx={{ mb: 2, color: ST.colors.textPrimary }}>
        Webometrics ranks universities - not websites - on digital visibility, academic openness, and research
        excellence. Scores on this page are TemplumIS data-readiness estimates against those indicators, not a
        predicted league-table position.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        How institutions are scored
      </Typography>
      <Box component="ul" sx={{ pl: 2.5, m: 0, mb: 1 }}>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Visibility (50%)</strong> - external referring domains to the university website (Ahrefs)
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Transparency (10%)</strong> - citations of the institution's top researchers on Google Scholar
          (top 310 profiles, excluding the top 20 outliers)
        </Typography>
        <Typography component="li" variant="body2">
          <strong>Excellence (40%)</strong> - papers in the top 10% most cited (Scopus / Scimago)
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ mb: 2, fontStyle: "italic", color: ST.colors.textSecondary }}>
        The former Presence indicator (indexed web pages) has been discontinued.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        What this means in practice
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Practical levers for an institution are a single well-managed web domain, complete Google Scholar
        profiles, and open, citable research output. Website design, visitor traffic, and marketing activity are
        not ranked.
      </Typography>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
        Rankings are updated twice a year (January and July). For the full official methodology, see{" "}
        <Box component="a" href={officialUrl} target="_blank" rel="noopener noreferrer" sx={METHODOLOGY_LINK_SX}>
          Webometrics.org
          <OpenInNewIcon sx={{ fontSize: 12 }} />
        </Box>
        .
      </Typography>
    </MethodologyDialogShell>
  );
}

function TheMethodologyDialog({ open, onClose }) {
  const officialUrl = "https://www.timeshighereducation.com/world-university-rankings/methodology";

  return (
    <MethodologyDialogShell
      open={open}
      onClose={onClose}
      title="THE World University Rankings 2026"
      officialUrl={officialUrl}
    >
      <Typography variant="body2" sx={{ mb: 2, color: ST.colors.textPrimary }}>
        Times Higher Education ranks research-intensive universities across teaching, research, knowledge transfer,
        and international outlook. The 2026 tables use 18 indicators in five pillars. Scores on this page are
        TemplumIS data-readiness estimates against those indicators, not a predicted THE position.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        How institutions are scored
      </Typography>
      <Box component="ul" sx={{ pl: 2.5, m: 0, mb: 1.5 }}>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Teaching (29.5%)</strong> - reputation survey, staff-to-student ratio, doctorate mix, and
          PPP-adjusted institutional income
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Research environment (29%)</strong> - research reputation, research income, and Scopus papers per
          scholar
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Research quality (30%)</strong> - citation impact, strength, excellence (top 10% FWCI), and
          influence; Elsevier Scopus, publications 2020–2024
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>International outlook (7.5%)</strong> - international students, staff, and co-authorship,
          country-population normalised
        </Typography>
        <Typography component="li" variant="body2">
          <strong>Industry (4%)</strong> - industry research income and patents citing the university's research
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ mb: 2, fontStyle: "italic", color: ST.colors.textSecondary }}>
        Study abroad is listed but currently weighted at 0% until THE is satisfied with data quality.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        Eligibility
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        THE excludes institutions that do not teach undergraduates, that published fewer than 1,000 relevant papers
        in 2020–2024 (minimum 100 a year), or that concentrate 80% or more of output in a single subject area.
        Institutions that submit data but miss those thresholds may appear as reporters, unranked.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        What this means in practice
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        The SIS already supports staff-to-student ratio and international enrolment. Reputation, citations, research
        income, and patents need external survey and Scopus evidence. Indexed publication volume is also the main
        eligibility gate.
      </Typography>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
        For the full official methodology, see{" "}
        <Box component="a" href={officialUrl} target="_blank" rel="noopener noreferrer" sx={METHODOLOGY_LINK_SX}>
          timeshighereducation.com
          <OpenInNewIcon sx={{ fontSize: 12 }} />
        </Box>
        .
      </Typography>
    </MethodologyDialogShell>
  );
}

function SsaMethodologyDialog({ open, onClose }) {
  const officialUrl =
    "https://www.timeshighereducation.com/world-university-rankings/sub-saharan-africa-university-rankings-2024-methodology";

  return (
    <MethodologyDialogShell
      open={open}
      onClose={onClose}
      title="Sub-Saharan Africa University Rankings 2024"
      officialUrl={officialUrl}
    >
      <Typography variant="body2" sx={{ mb: 2, color: ST.colors.textPrimary }}>
        THE's SSA ranking is built for universities in sub-Saharan Africa. It is a hybrid of teaching, impact, and
        research - not a Global North research-intensity table. Scores on this page are TemplumIS data-readiness
        estimates against those indicators, not a predicted THE position.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        How institutions are scored
      </Typography>
      <Box component="ul" sx={{ pl: 2.5, m: 0, mb: 1.5 }}>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Resources and finance (22%)</strong> - income per student, faculty-to-student ratio, funding-source
          diversity, facilities, staff CPD, and student counselling
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Access and fairness (24%)</strong> - first-generation and low-income students, female graduates,
          disability access, and affordability
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Student engagement (22%)</strong> - experiential learning, employability and careers, course quality,
          and student–faculty interaction
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Ethical leadership (10%)</strong> - leadership, innovation and entrepreneurship skills, student union,
          and a published code of ethics (new in 2024)
        </Typography>
        <Typography component="li" variant="body2">
          <strong>Africa impact (22%)</strong> - African citations, African co-authorship, and African heritage in
          teaching and campus life
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ mb: 2, color: ST.colors.textSecondary }}>
        Data comes from the university, a student survey (2023 and 2024 combined), and Elsevier bibliometrics. At least
        50 valid student responses are required to be ranked.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        Eligibility
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Any SSA institution that teaches undergraduates can participate. In 2024, 171 universities submitted data and
        129 had enough survey responses to appear in the tables.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        What this means in practice
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        The SIS already supports faculty-to-student ratio, gender mix, and aid workflows. Ranked participation still
        needs a THE data submission, a student survey with 50+ responses, and documented evidence for counselling,
        accessibility, ethics, careers, and African heritage.
      </Typography>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
        For the full official methodology, see{" "}
        <Box component="a" href={officialUrl} target="_blank" rel="noopener noreferrer" sx={METHODOLOGY_LINK_SX}>
          timeshighereducation.com
          <OpenInNewIcon sx={{ fontSize: 12 }} />
        </Box>
        .
      </Typography>
    </MethodologyDialogShell>
  );
}

function AurMethodologyDialog({ open, onClose }) {
  const officialUrl = "https://www.auranking.aaru.edu.jo/methodology/";

  return (
    <MethodologyDialogShell
      open={open}
      onClose={onClose}
      title="Arab Ranking for Universities (AAUR)"
      officialUrl={officialUrl}
    >
      <Typography variant="body2" sx={{ mb: 2, color: ST.colors.textPrimary }}>
        The Arab Ranking for Universities (AARU) uses four criteria aligned with Arab higher-education priorities:
        teaching quality, research, innovation, and collaboration. Each criterion has nine indicators (36 in total,
        1,000 points). Scores on this page are TemplumIS data-readiness estimates against those indicators, not a
        predicted AARU position.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        How institutions are scored
      </Typography>
      <Box component="ul" sx={{ pl: 2.5, m: 0, mb: 2 }}>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Education and learning (300 pts)</strong> - faculty-to-student ratios, PhD staff, digital/AI teaching,
          interdisciplinary programmes, Scopus H-index ≥ 10, visiting experts, programmatic accreditation, undergraduate
          co-authorship, and recognised awards
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Scientific research (400 pts)</strong> - Scopus output, Q1/Q2 share, citations, top 10% papers,
          international and industry co-authorship, FWCI, research-budget share, and Arabic-indexed Q1/Q2 papers
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Creativity, entrepreneurship, and innovation (150 pts)</strong> - SDG 9 publications, funded innovation
          projects, incubators, patents, and startups
        </Typography>
        <Typography component="li" variant="body2">
          <strong>International and local collaboration (150 pts)</strong> - international faculty and students, visiting
          professors, joint degrees, exchanges, community engagement, and open science
        </Typography>
      </Box>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        What this means in practice
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        The SIS already supports faculty-to-student ratio, LMS use, and international enrolment. Most of the 1,000-point
        scale still needs Scopus author profiles, indexed publications, accreditation records, innovation contracts, and
        documented community and exchange activity.
      </Typography>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
        For the full official methodology, see{" "}
        <Box component="a" href={officialUrl} target="_blank" rel="noopener noreferrer" sx={METHODOLOGY_LINK_SX}>
          auranking.aaru.edu.jo
          <OpenInNewIcon sx={{ fontSize: 12 }} />
        </Box>
        .
      </Typography>
    </MethodologyDialogShell>
  );
}

function TheArabMethodologyDialog({ open, onClose }) {
  const officialUrl =
    "https://www.timeshighereducation.com/world-university-rankings/arab-university-rankings-2026-methodology";

  return (
    <MethodologyDialogShell
      open={open}
      onClose={onClose}
      title="THE Arab University Rankings 2026"
      officialUrl={officialUrl}
    >
      <Typography variant="body2" sx={{ mb: 2, color: ST.colors.textPrimary }}>
        THE Arab 2026 uses the same World University Rankings 2026 data cycle, with weightings recalibrated for Arab
        institutions. Reputation now comes from the global Academic Reputation Survey, not a region-only survey. Scores
        on this page are TemplumIS data-readiness estimates, not a predicted THE position.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        How institutions are scored
      </Typography>
      <Box component="ul" sx={{ pl: 2.5, m: 0, mb: 1.5 }}>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Teaching (29.5%)</strong> - teaching reputation, doctorates per academic staff, staff-to-student
          ratio, doctorates per undergraduate degrees awarded, and PPP-adjusted income per staff
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Research environment (29%)</strong> - research reputation, Scopus papers per scholar, and research
          income per staff
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Research quality (30%)</strong> - research strength (75th-percentile FWCI, 15%), excellence (7.5%),
          and influence (7.5%). Unlike the world table, citation impact is not a separate 15% metric
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>International outlook (7.5%)</strong> - international students, staff, and co-authorship,
          country-population normalised
        </Typography>
        <Typography component="li" variant="body2">
          <strong>Industry (4%)</strong> - industry income per staff and patents citing the university (patents are new
          to THE Arab in 2026)
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ mb: 2, fontStyle: "italic", color: ST.colors.textSecondary }}>
        Study abroad is listed but currently weighted at 0%.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        Eligibility
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Institutions must submit data and have published more than 500 research publications between 2020 and 2024.
        Only universities based in listed Arab League countries and territories are considered. Those that submit data
        but miss the thresholds may appear as reporters, unranked.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        What this means in practice
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        The SIS already supports staff-to-student ratio and international enrolment. Reputation, Scopus output, citations,
        research income, and patents still need THE/Elsevier evidence. The 500-paper gate is lower than the world
        ranking's 1,000-paper rule, but still requires indexed publications.
      </Typography>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
        For the full official methodology, see{" "}
        <Box component="a" href={officialUrl} target="_blank" rel="noopener noreferrer" sx={METHODOLOGY_LINK_SX}>
          timeshighereducation.com
          <OpenInNewIcon sx={{ fontSize: 12 }} />
        </Box>
        .
      </Typography>
    </MethodologyDialogShell>
  );
}

function ArwuMethodologyDialog({ open, onClose }) {
  const officialUrl = "https://www.shanghairanking.com/methodology/arwu/2025";

  return (
    <MethodologyDialogShell
      open={open}
      onClose={onClose}
      title="Shanghai Rankings (ARWU) 2025"
      officialUrl={officialUrl}
    >
      <Typography variant="body2" sx={{ mb: 2, color: ST.colors.textPrimary }}>
        ShanghaiRanking's Academic Ranking of World Universities is a research-output ranking. More than 2,500
        universities are scored; the top 1,000 are published. Scores on this page are TemplumIS data-readiness
        estimates against those indicators, not a predicted ARWU position.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        How institutions are scored
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Each indicator is scaled so the world leader scores 100; other institutions are a percentage of that top
        score. Weighted indicators then sum to an overall score, which is rescaled the same way.
      </Typography>
      <Box component="ul" sx={{ pl: 2.5, m: 0, mb: 2 }}>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Alumni (10%)</strong> - graduates who won Nobel Prizes or Fields Medals (degree-year weighted)
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Award (20%)</strong> - staff who won Nobel Prizes or Fields Medals while at the institution
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>HiCi (20%)</strong> - Clarivate Highly Cited Researchers (November 2024 list; primary affiliation
          only)
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>N&amp;S (20%)</strong> - Nature and Science articles, 2020–2024, weighted by author affiliation
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>PUB (20%)</strong> - Web of Science SCIE/SSCI articles in 2024 (SSCI papers count double)
        </Typography>
        <Typography component="li" variant="body2">
          <strong>PCP (10%)</strong> - the five scores above, divided by FTE academic staff
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ mb: 2, fontStyle: "italic", color: ST.colors.textSecondary }}>
        For humanities- and social-science specialists (e.g. LSE), N&amp;S is dropped and its weight is redistributed.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        Who is ranked
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Candidates must have Nobel/Fields alumni or staff, Highly Cited Researchers, Nature or Science papers, or a
        substantial Web of Science article count. TemplumIS currently has none of those signals in SIS data.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        What this means in practice
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        ARWU is almost entirely external: prizes, Clarivate, Nature/Science, and Web of Science. The SIS can only
        support staff headcount for PCP. Indexed articles and highly cited researchers are the realistic first steps;
        Nobel/Fields indicators are structural constraints for a new university.
      </Typography>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
        For the full official methodology, see{" "}
        <Box component="a" href={officialUrl} target="_blank" rel="noopener noreferrer" sx={METHODOLOGY_LINK_SX}>
          shanghairanking.com
          <OpenInNewIcon sx={{ fontSize: 12 }} />
        </Box>
        .
      </Typography>
    </MethodologyDialogShell>
  );
}

function QsMethodologyDialog({ open, onClose }) {
  const officialUrl = "https://www.topuniversities.com/world-university-rankings/methodology";

  return (
    <MethodologyDialogShell
      open={open}
      onClose={onClose}
      title="QS World University Rankings methodology"
      officialUrl={officialUrl}
    >
      <Typography variant="body2" sx={{ mb: 2, color: ST.colors.textPrimary }}>
        QS groups indicators into five lenses. Each lens is a theme; indicators are scored and then combined into the
        overall rank. Scores on this page are TemplumIS data-readiness estimates against those indicators, not a
        predicted QS position.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        How institutions are scored
      </Typography>
      <Box component="ul" sx={{ pl: 2.5, m: 0, mb: 1.5 }}>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Research and discovery (50%)</strong> - Academic Reputation 30% (global academic survey) and Citations
          per Faculty 20% (citations divided by academic staff)
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Employability and outcomes (20%)</strong> - Employer Reputation 15% (global employer survey) and
          Employment Outcomes 5% (graduate employability and alumni impact)
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Learning experience (10%)</strong> - Faculty-Student Ratio 10%
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Global engagement (15%)</strong> - International Faculty 5%, International Research Network 5%
          (sustained partnerships: three or more joint papers in five years), International Student Ratio 5%.
          International Student Diversity is listed at 0%
        </Typography>
        <Typography component="li" variant="body2">
          <strong>Sustainability (5%)</strong> - environmental, social, and governance commitment, including research
          related to the UN SDGs
        </Typography>
      </Box>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        What this means in practice
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        The SIS already supports faculty-student ratio and international enrolment. Academic and employer reputation
        need QS survey presence. Citations and the research network need Scopus-indexed papers. Employment outcomes need
        graduate tracking; sustainability needs documented ESG and SDG activity.
      </Typography>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
        For the full official methodology, see{" "}
        <Box component="a" href={officialUrl} target="_blank" rel="noopener noreferrer" sx={METHODOLOGY_LINK_SX}>
          topuniversities.com
          <OpenInNewIcon sx={{ fontSize: 12 }} />
        </Box>
        .
      </Typography>
    </MethodologyDialogShell>
  );
}

function NaacMethodologyDialog({ open, onClose }) {
  const officialUrl = "https://www.naac.gov.in/";

  return (
    <MethodologyDialogShell
      open={open}
      onClose={onClose}
      title="NAAC accreditation methodology"
      officialUrl={officialUrl}
    >
      <Typography variant="body2" sx={{ mb: 2, color: ST.colors.textPrimary }}>
        NAAC (National Assessment and Accreditation Council) certifies institutional quality on a 0-4.0 CGPA scale -
        it does not rank institutions against each other. Scores on this page are TemplumIS data-readiness estimates
        against NAAC's published criteria, not an official NAAC assessment or grade.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        The seven criteria
      </Typography>
      <Box component="ul" sx={{ pl: 2.5, m: 0, mb: 1.5 }}>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Curricular Aspects (10%)</strong> - curriculum design, academic flexibility, feedback systems
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Teaching-Learning & Evaluation (20%)</strong> - student profile, teaching methods, faculty quality,
          learning outcomes
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Research, Innovations & Extension (30%)</strong> - publications, citations, patents, consultancy,
          extension activity
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Infrastructure & Learning Resources (10%)</strong> - labs, libraries, ICT, digital infrastructure
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Student Support & Progression (10%)</strong> - scholarships, placements, progression, alumni
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Governance, Leadership & Management (10%)</strong> - strategic planning, financial management, IQAC
          activity
        </Typography>
        <Typography component="li" variant="body2">
          <strong>Institutional Values & Best Practices (10%)</strong> - gender equity, sustainability, ethics,
          inclusion
        </Typography>
      </Box>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        Grade bands (current framework)
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        A++ (3.51-4.00) · A+ (3.26-3.50) · A (3.01-3.25) · B++ (2.76-3.00) · B+ (2.51-2.75) · B (2.01-2.50) · C
        (1.51-2.00) · D (≤1.50, not accredited). NAAC announced a move to a binary Accredited/Not-Accredited outcome
        plus optional five-level Maturity-Based Graded Accreditation in February 2025; as of this dashboard's last
        update that framework had not fully replaced the CGPA model, so both are tracked here.
      </Typography>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
        For the full official methodology, see{" "}
        <Box component="a" href={officialUrl} target="_blank" rel="noopener noreferrer" sx={METHODOLOGY_LINK_SX}>
          naac.gov.in
          <OpenInNewIcon sx={{ fontSize: 12 }} />
        </Box>
        .
      </Typography>
    </MethodologyDialogShell>
  );
}

function NirfMethodologyDialog({ open, onClose }) {
  const officialUrl = "https://www.nirfindia.org/";

  return (
    <MethodologyDialogShell
      open={open}
      onClose={onClose}
      title="NIRF ranking methodology"
      officialUrl={officialUrl}
    >
      <Typography variant="body2" sx={{ mb: 2, color: ST.colors.textPrimary }}>
        NIRF (National Institutional Ranking Framework) ranks Indian institutions against peers across five
        parameters. NIRF's own methodology treats scores as relative to a peer cohort in a given ranking year, not an
        absolute or portable mark - scores here are TemplumIS data-readiness estimates, not a predicted NIRF rank.
      </Typography>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        The five parameters
      </Typography>
      <Box component="ul" sx={{ pl: 2.5, m: 0, mb: 1.5 }}>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Teaching, Learning & Resources - TLR (30%)</strong> - student strength, faculty-student ratio,
          faculty qualifications, financial resources, online education
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Research & Professional Practice - RP (30%)</strong> - publications, citations, patents/IPR,
          funded projects, professional practice
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Graduation Outcomes - GO (20%)</strong> - university examination outcomes, PhD graduates,
          placement and higher-study progression
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 0.75 }}>
          <strong>Outreach & Inclusivity - OI (10%)</strong> - regional and gender diversity, economically/socially
          challenged students, accessibility
        </Typography>
        <Typography component="li" variant="body2">
          <strong>Perception - PR (10%)</strong> - academic peer perception and employer perception
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
        For the full official methodology, see{" "}
        <Box component="a" href={officialUrl} target="_blank" rel="noopener noreferrer" sx={METHODOLOGY_LINK_SX}>
          nirfindia.org
          <OpenInNewIcon sx={{ fontSize: 12 }} />
        </Box>
        .
      </Typography>
    </MethodologyDialogShell>
  );
}


function IaqriGapAnalysisPanel({ nirfSystem }) {
  const criteria = nirfSystem?.criteria || [];
  const scored = criteria.map((c) => ({ ...c, readiness: weightedReadiness(c.indicators) }));
  const lowest = scored.reduce(
    (min, c) => (min == null || c.readiness < min.readiness ? c : min),
    null
  );
  const [selectedId, setSelectedId] = useState(null);
  const selected = scored.find((c) => c.id === selectedId) || lowest;
  if (!selected) return null;

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1, mb: 0.5 }}>
        AI Gap &amp; Root-Cause Analysis
      </Typography>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mb: 1.5 }}>
        Select a pillar to see why it&apos;s underperforming, not just its score.
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
        {scored.map((c) => {
          const active = c.id === selected.id;
          return (
            <Chip
              key={c.id}
              label={criterionTabLabel(c) || c.id.toUpperCase()}
              onClick={() => setSelectedId(c.id)}
              sx={{
                fontWeight: 700,
                bgcolor: active ? ST.colors.primary : "transparent",
                color: active ? "#fff" : ST.colors.textSecondary,
                border: `1px solid ${active ? ST.colors.primary : ST.colors.border}`,
                "&:hover": { bgcolor: active ? ST.colors.primary : `${ST.colors.primary}0A` },
              }}
            />
          );
        })}
      </Box>
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: ST.colors.bg, borderColor: ST.colors.border, height: "100%" }}>
            <Typography variant="overline" sx={{ color: ST.colors.error, fontWeight: 700, lineHeight: 1.4 }}>
              Primary constraint
            </Typography>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.5 }}>
              {selected.name}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: ST.colors.textSecondary }}>
              {formatScorePct(selected.readiness)} readiness
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography
            variant="overline"
            sx={{ color: ST.colors.textSecondary, fontWeight: 700, lineHeight: 1.4, display: "block", mb: 0.5 }}
          >
            Likely causes
          </Typography>
          <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
            {causesForCriterion(selected).map((cause, i) => (
              <Typography key={i} component="li" variant="body2" sx={{ mb: 0.75, color: ST.colors.textSecondary }}>
                {cause}
              </Typography>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}


function IaqriEarlyWarningPanel({ naacSystem, nirfSystem }) {
  const flagged = flagIndicators(naacSystem, nirfSystem, 5);
  if (!flagged.length) return null;
  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1, mb: 0.5 }}>
        Predictive Early-Warning
      </Typography>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mb: 1.5 }}>
        Flagged automatically from indicators currently scoring Limited or No data, ranked by how much weight each
        carries in its framework.
      </Typography>
      {flagged.map((f) => {
        const critical = f.weight >= 10;
        return (
          <Box
            key={f.key}
            sx={{
              display: "flex",
              gap: 1.5,
              p: 1.75,
              mb: 1,
              borderRadius: 2,
              border: `1px solid ${ST.colors.border}`,
              bgcolor: ST.colors.surface,
            }}
          >
            <Box sx={{ width: 3, borderRadius: 1, bgcolor: critical ? ST.colors.error : ST.colors.warning, flexShrink: 0 }} />
            <Box>
              <Typography variant="body2" fontWeight={700}>
                {f.name}{" "}
                <Typography component="span" variant="caption" sx={{ color: ST.colors.textSecondary, fontWeight: 600 }}>
                  ({f.framework} · {f.criterionTitle} · {f.weight}% weight)
                </Typography>
              </Typography>
              <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.25 }}>
                {f.performance}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

const IAQRI_ACTION_CYCLE = ["Not started", "In progress", "Done"];
const IAQRI_ACTION_COLOR = { "Not started": "#64748B", "In progress": ST.colors.warning, Done: ST.colors.success };

function IaqriActionTrackerPanel({ naacSystem, nirfSystem }) {
  const flagged = useMemo(() => flagIndicators(naacSystem, nirfSystem, 4), [naacSystem, nirfSystem]);
  const [statusByKey, setStatusByKey] = useState({});
  if (!flagged.length) return null;

  const cycle = (key) => {
    setStatusByKey((prev) => {
      const current = prev[key] || "Not started";
      const next = IAQRI_ACTION_CYCLE[(IAQRI_ACTION_CYCLE.indexOf(current) + 1) % IAQRI_ACTION_CYCLE.length];
      return { ...prev, [key]: next };
    });
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1, mb: 0.5 }}>
        Action &amp; Accountability
      </Typography>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mb: 1.5 }}>
        Generated from the same flagged indicators above - every weakness becomes a tracked intervention. Click a
        status pill to cycle it.
      </Typography>
      {flagged.map((f) => {
        const status = statusByKey[f.key] || "Not started";
        const actionText = defaultActions(f)[0];
        const owner = IAQRI_CRITERION_OWNER[f.criterionId] || "Institution Admin";
        const target = f.status === "No data" ? "Establish baseline evidence" : "Move from Limited to Good";
        return (
          <Box key={f.key} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, p: 2, mb: 1.25 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, alignItems: "flex-start" }}>
              <Typography variant="body2" fontWeight={700}>
                {f.name}
              </Typography>
              <Chip
                label={status}
                onClick={() => cycle(f.key)}
                size="small"
                sx={{
                  fontWeight: 700,
                  textTransform: "uppercase",
                  fontSize: 11,
                  cursor: "pointer",
                  bgcolor: `${IAQRI_ACTION_COLOR[status]}1A`,
                  color: IAQRI_ACTION_COLOR[status],
                  border: `1px solid ${IAQRI_ACTION_COLOR[status]}`,
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>
              {actionText}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
                <b>Owner:</b> {owner}
              </Typography>
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
                <b>Target:</b> {target}
              </Typography>
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
                <b>Impact:</b> {f.framework} · {f.criterionTitle} ↑
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function IaqriCommandCentrePanel({ naacSystem, nirfSystem }) {
  const naacReadiness = systemReadiness(naacSystem || {});
  const nirfReadiness = systemReadiness(nirfSystem || {});
  const nirfCriteria = (nirfSystem?.criteria || []).map((c) => ({ ...c, readiness: weightedReadiness(c.indicators) }));
  const lowest = nirfCriteria.reduce((min, c) => (min == null || c.readiness < min.readiness ? c : min), null);
  const causes = lowest ? causesForCriterion(lowest) : [];
  const actionCount = flagIndicators(naacSystem, nirfSystem, 4).length;

  const qa = [
    {
      q: "Where are we now?",
      a: `${formatScorePct(naacReadiness)} NAAC readiness, ${formatScorePct(nirfReadiness)} NIRF composite - computed live from the current institutional data feed.`,
    },
    {
      q: "Where are the gaps?",
      a: lowest ? `${lowest.name}, the lowest-scoring pillar across both frameworks right now.` : "No pillar data available yet.",
    },
    { q: "Why are we underperforming?", a: causes[0] || "No specific cause flagged yet." },
    {
      q: "How do we compare?",
      a: "Peer benchmarking isn't wired to a live external data source yet - see the roadmap for that phase.",
    },
    {
      q: "What happens if we intervene?",
      a: "Use the scenario model above - it recalculates projected pillar scores from the same live baseline as you move the sliders.",
    },
    {
      q: "What should we do next?",
      a: `${actionCount} tracked action${actionCount === 1 ? "" : "s"} above, each generated from a currently flagged indicator.`,
    },
  ];

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1, mb: 0.5 }}>
        Executive Command Centre
      </Typography>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mb: 1.5 }}>
        What this dashboard exists to answer.
      </Typography>
      <Grid container spacing={1.5}>
        {qa.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.q}>
            <Paper variant="outlined" sx={{ p: 1.75, height: "100%" }}>
              <Typography variant="caption" sx={{ color: ST.colors.primary, fontWeight: 700, display: "block", mb: 0.5 }}>
                {item.q}
              </Typography>
              <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
                {item.a}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Box
        sx={{
          mt: 2.5,
          p: 2.5,
          borderRadius: 2,
          textAlign: "center",
          color: ST.colors.primary,
          bgcolor: ST.colors.primaryLight,
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Collect Once. Validate Once. Improve Continuously. Report Everywhere.
        </Typography>
        <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
          TemplumIS India Accreditation, Quality &amp; Ranking Intelligence (IAQRI)
        </Typography>
      </Box>
    </Box>
  );
}

function RankingMethodologyDialog({ type, open, onClose }) {
  if (type === "the") return <TheMethodologyDialog open={open} onClose={onClose} />;
  if (type === "ssa") return <SsaMethodologyDialog open={open} onClose={onClose} />;
  if (type === "the-arab") return <TheArabMethodologyDialog open={open} onClose={onClose} />;
  if (type === "webometrics") return <WebometricsMethodologyDialog open={open} onClose={onClose} />;
  if (type === "aur") return <AurMethodologyDialog open={open} onClose={onClose} />;
  if (type === "arwu") return <ArwuMethodologyDialog open={open} onClose={onClose} />;
  if (type === "qs") return <QsMethodologyDialog open={open} onClose={onClose} />;
  if (type === "naac") return <NaacMethodologyDialog open={open} onClose={onClose} />;
  if (type === "nirf") return <NirfMethodologyDialog open={open} onClose={onClose} />;
  return null;
}

function GroupRankingPicker({ systems, selectedId, onSelect }) {
  const [methodologyType, setMethodologyType] = useState(null);

  return (
    <>
      <Box
        className="no-print"
        sx={{
          display: "flex",
          borderBottom: `1px solid ${ST.colors.border}`,
        }}
      >
        {systems.map((system, index) => {
          const selected = system.id === selectedId;
          return (
            <Box
              key={system.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(system.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(system.id);
                }
              }}
              sx={{
                flex: 1,
                p: 2,
                cursor: "pointer",
                bgcolor: selected ? `${system.badgeColor}12` : "transparent",
                borderBottom: selected ? `3px solid ${system.badgeColor}` : "3px solid transparent",
                borderRight: index < systems.length - 1 ? `1px solid ${ST.colors.border}` : "none",
                "&:hover": { bgcolor: selected ? `${system.badgeColor}18` : `${ST.colors.primary}06` },
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <Chip
                  label={system.badge}
                  sx={{
                    bgcolor: system.badgeColor,
                    color: "white",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                      {system.title}
                    </Typography>
                    {system.methodology && (
                      <Tooltip title="Methodology">
                        <IconButton
                          size="small"
                          aria-label={`${system.title} methodology`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMethodologyType(system.methodology);
                          }}
                          sx={{ color: ST.colors.textSecondary }}
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {system.subtitle}
                    {" · "}
                    {formatScorePct(systemReadiness(system))}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
      <RankingMethodologyDialog
        type={methodologyType}
        open={Boolean(methodologyType)}
        onClose={() => setMethodologyType(null)}
      />
    </>
  );
}

function PlatformInsightsPanel({ institutionName, system, institutionalData, badgeColor }) {
  const insights = buildPlatformInsights({
    inst: institutionalData,
    system,
    institutionName,
  });

  const renderItems = (items, withArrow = false) => (
    <Box component="ul" sx={{ pl: 2, m: 0 }}>
      {items.map((item, idx) => (
        <Typography
          component="li"
          variant="body2"
          key={`${item.title}-${idx}`}
          sx={{ mb: idx < items.length - 1 ? 1.25 : 0, color: ST.colors.textPrimary }}
        >
          <strong>{item.title}</strong>
          {withArrow ? " → " : " - "}
          {item.link ? (
            <>
              {item.text.split(item.link.label)[0]}
              <Box
                component="a"
                href={item.link.href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: ST.colors.primary,
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.3,
                  verticalAlign: "middle",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {item.link.label}
                <OpenInNewIcon sx={{ fontSize: 11 }} />
              </Box>
              {item.text.split(item.link.label).slice(1).join(item.link.label)}
            </>
          ) : (
            item.text
          )}
        </Typography>
      ))}
    </Box>
  );

  return (
    <Box sx={{ p: 2, borderTop: `1px solid ${ST.colors.border}`, bgcolor: ST.colors.bg || "#fafbfc" }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: badgeColor }}>
        {system.tabLabel || system.badge} insights for {institutionName}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
            <Box display="flex" alignItems="center" gap={1} mb={1.25}>
              <TrendingUpIcon sx={{ color: ST.colors.success, fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700}>
                Where {institutionName} performs well
              </Typography>
            </Box>
            {renderItems(insights.strengths)}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
            <Box display="flex" alignItems="center" gap={1} mb={1.25}>
              <TrendingDownIcon sx={{ color: ST.colors.error, fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700}>
                Where critical gaps exist
              </Typography>
            </Box>
            {renderItems(insights.gaps)}
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: ST.colors.surface,
              borderColor: ST.colors.border,
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={1.25}>
              <CheckCircleIcon sx={{ color: ST.colors.success, fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700}>
                Quick wins for {system.tabLabel || system.badge}
              </Typography>
            </Box>
            {renderItems(insights.quickWins, true)}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function OverallReadinessBanner({
  badge,
  badgeColor,
  value,
  totalWeightLabel,
  indicatorCount,
  onOpenAssessments,
  onOpenBreakdown,
}) {
  return (
    <Box
      sx={{
        mx: 2,
        mt: 2,
        mb: 1,
        p: 2.5,
        borderRadius: 2,
        border: `1px solid ${ST.colors.border}`,
        bgcolor: ST.colors.surface,
      }}
    >
      <Box
        display="flex"
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={2}
        flexWrap="wrap"
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ color: ST.colors.textSecondary, fontWeight: 700, letterSpacing: 1, display: "block" }}
          >
            Overall readiness
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color: ST.colors.textPrimary, lineHeight: 1.1 }}>
            {formatScorePct(value)}
          </Typography>
          <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>
            {badge} framework{totalWeightLabel ? ` · ${totalWeightLabel} total weight` : ""}
            {indicatorCount != null ? ` · ${indicatorCount} indicators` : ""}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 200, maxWidth: 420 }}>
          <ReadinessBar value={value} color={badgeColor} height={14} label={formatScorePct(value)} />
          <Box display="flex" gap={1} mt={1.25} flexWrap="wrap" className="no-print">
            <Button
              size="small"
              variant="outlined"
              onClick={onOpenAssessments}
              sx={{ textTransform: "none", fontWeight: 600, borderColor: badgeColor, color: badgeColor }}
            >
              View assessments
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={onOpenBreakdown}
              endIcon={<KeyboardArrowRightIcon />}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                bgcolor: badgeColor,
                "&:hover": { bgcolor: badgeColor, filter: "brightness(0.92)" },
              }}
            >
              Score breakdown
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function RankingCard({
  badge,
  badgeColor,
  title,
  subtitle,
  overallReadiness,
  indicators,
  criteria,
  totalWeightLabel,
  methodology,
  system,
  institutionalData,
  institutionName,
  active = true,
  hideHeader = false,
  embedded,
}) {
  const [criterionTab, setCriterionTab] = useState(0);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const hasCriteria = Array.isArray(criteria) && criteria.length > 0;
  const allIndicators = hasCriteria
    ? criteria.flatMap((criterion) => criterion.indicators || [])
    : indicators || [];
  const computedOverall = weightedReadiness(allIndicators);
  const Wrapper = embedded ? Box : Paper;

  useEffect(() => {
    if (!active) {
      setDetail(null);
      setMethodologyOpen(false);
    }
  }, [active]);

  const openIndicator = (indicator, tab) => setDetail({ kind: "indicator", indicator, tab });
  const openGroup = (titleText, items, tab, weightLabel) =>
    setDetail({
      kind: "group",
      title: titleText,
      items,
      readiness: weightedReadiness(items),
      tab,
      weightLabel,
    });

  return (
    <Wrapper sx={{ overflow: "hidden" }}>
      <Box
        sx={{
          p: 2,
          bgcolor: `${badgeColor}10`,
          borderBottom: `2px solid ${badgeColor}`,
          display: hideHeader ? "none" : "block",
          "@media print": { display: "block" },
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              label={badge}
              sx={{
                bgcolor: badgeColor,
                color: "white",
                fontWeight: 700,
                fontSize: 12,
              }}
            />
            <Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography variant="h6" fontWeight={600}>
                  {title}
                </Typography>
                {methodology && (
                  <Tooltip title="Methodology">
                    <IconButton
                      size="small"
                      className="no-print"
                      aria-label={`${title} methodology`}
                      onClick={() => setMethodologyOpen(true)}
                      sx={{ color: ST.colors.textSecondary }}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      {methodology && (
        <RankingMethodologyDialog
          type={methodology}
          open={methodologyOpen}
          onClose={() => setMethodologyOpen(false)}
        />
      )}
      <RankingDetailDialog
        detail={detail}
        badgeColor={badgeColor}
        onClose={() => setDetail(null)}
        onTabChange={(tab) => setDetail((current) => (current ? { ...current, tab } : current))}
      />

      <OverallReadinessBanner
        badge={badge}
        badgeColor={badgeColor}
        value={computedOverall}
        totalWeightLabel={totalWeightLabel}
        indicatorCount={allIndicators.length}
        onOpenAssessments={() =>
          openGroup(`${badge} overall readiness`, allIndicators, 0, totalWeightLabel)
        }
        onOpenBreakdown={() =>
          openGroup(`${badge} overall readiness`, allIndicators, 1, totalWeightLabel)
        }
      />

      {hasCriteria && (
        <Tabs
          value={criterionTab}
          onChange={(_, v) => setCriterionTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          className="no-print"
          sx={{
            px: 1,
            borderBottom: `1px solid ${ST.colors.border}`,
            minHeight: 44,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: 13,
              minHeight: 44,
              minWidth: 110,
            },
            "& .Mui-selected": { fontWeight: 700, color: badgeColor },
            "& .MuiTabs-indicator": { bgcolor: badgeColor, height: 3 },
          }}
        >
          {criteria.map((criterion) => (
            <Tab
              key={criterion.id}
              label={
                <Box display="flex" alignItems="center" gap={0.75}>
                  {criterionTabLabel(criterion)}
                  <Typography component="span" variant="caption" sx={{ color: ST.colors.textSecondary, fontWeight: 600 }}>
                    {criterionWeightLabel(criterion)}
                  </Typography>
                </Box>
              }
            />
          ))}
        </Tabs>
      )}

      {hasCriteria ? (
        <>
          {criteria.map((criterion, index) => (
            <Box
              key={criterion.id}
              className="ranking-tab-panel"
              sx={{
                display: criterionTab === index ? "block" : "none",
                "@media print": { display: "block", pageBreakInside: "avoid" },
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.25,
                  bgcolor: `${badgeColor}08`,
                  borderBottom: `1px solid ${ST.colors.border}`,
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
                  {criterion.name} ({criterionWeightLabel(criterion)})
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <IndicatorTableHead />
                  <TableBody>
                    <IndicatorRows indicators={criterion.indicators} onOpenDetail={openIndicator} />
                    <TableRow sx={{ bgcolor: ST.colors.bg }}>
                      <TableCell colSpan={2}>
                        <Typography variant="body2" fontWeight={700}>
                          Total
                        </Typography>
                      </TableCell>
                      <ClickableCell
                        tooltip="View criterion assessments"
                        onClick={() =>
                          openGroup(criterion.name, criterion.indicators, 0, criterionWeightLabel(criterion))
                        }
                      >
                        <Typography variant="body2" fontWeight={700} sx={{ color: badgeColor }}>
                          {criterionWeightLabel(criterion)}
                        </Typography>
                      </ClickableCell>
                      <ClickableCell
                        tooltip="View criterion score breakdown"
                        onClick={() =>
                          openGroup(criterion.name, criterion.indicators, 1, criterionWeightLabel(criterion))
                        }
                      >
                        <ReadinessBar
                          value={weightedReadiness(criterion.indicators)}
                          color={badgeColor}
                          height={8}
                          label={`${formatScorePct(weightedReadiness(criterion.indicators))} criterion readiness`}
                        />
                      </ClickableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </>
      ) : (
        <TableContainer>
          <Table size="small">
            <IndicatorTableHead />
            <TableBody>
              <IndicatorRows indicators={indicators || []} onOpenDetail={openIndicator} />
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {system && (
        <PlatformInsightsPanel
          institutionName={institutionName}
          system={system}
          institutionalData={institutionalData}
          badgeColor={badgeColor}
        />
      )}
    </Wrapper>
  );
}

function getScoreBarColor(score) {
  if (score >= 60) return ST.colors.success;
  if (score >= 40) return ST.colors.warning;
  if (score >= 20) return "#EA580C";
  return ST.colors.error;
}
