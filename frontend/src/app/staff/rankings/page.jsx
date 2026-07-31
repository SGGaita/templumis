"use client";

import { useState, useEffect } from "react";
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
  Divider,
  CircularProgress,
  Button,
  GlobalStyles,
  Tooltip,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";

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
      }
    `}
  />
);

export default function UniversityRankingsPage() {
  const [loading, setLoading] = useState(true);
  const [institutionalData, setInstitutionalData] = useState(null);
  const [institutionId, setInstitutionId] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    fetchInstitutionalData();
    
    // Setup WebSocket for live updates
    const ws = new WebSocket('ws://localhost:8000/ws/rankings');
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected for live rankings updates');
      setWsConnected(true);
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'rankings_update') {
        console.log('📊 Received live update from Excel file');
        // Update institutional data with new values
        const inst = message.data.institutional_data;
        setInstitutionalData(prev => ({
          ...prev,
          totalStudents: inst.total_students,
          totalStudentsBreakdown: `${inst.ug_students} UG · ${inst.pg_students} PG`,
          internationalStudents: inst.international_students,
          internationalStudentsCount: `${Math.round(parseFloat(inst.international_students) / 100 * inst.total_students)} of ${inst.total_students}`,
          femaleRatio: inst.female_ratio,
          femaleCount: `${Math.round(parseFloat(inst.female_ratio) / 100 * inst.total_students)} of ${inst.total_students}`,
          avgGPA: inst.avg_gpa,
          faculty: inst.faculty,
          researchStudents: inst.research_students,
          activeNationalities: inst.nationalities,
        }));
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setWsConnected(false);
    };
    
    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setWsConnected(false);
    };
    
    // Ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping');
      }
    }, 30000);
    
    // Cleanup on unmount
    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, []);

  const fetchInstitutionalData = async () => {
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
        institutionName: "TemplumIS University",
        rankingsData: excelData.rankings, // Store rankings data for use in cards
      });
    } catch (error) {
      console.error("Error fetching institutional data:", error);
      // Fallback to default values
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
        institutionName: "TemplumIS University",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRatioNote = (ratio) => {
    if (ratio === "N/A") return "";
    const numericRatio = parseFloat(ratio.split(":")[0]);
    if (numericRatio < 5) return "world-class";
    if (numericRatio < 10) return "very low";
    if (numericRatio < 15) return "good";
    return "moderate";
  };

  const handleExportPDF = () => {
    window.print();
  };

  const getScoreColor = (score) => {
    if (score >= 60) return ST.colors.success;
    if (score >= 40) return "#FFA726";
    if (score >= 20) return "#FF7043";
    return "#EF5350";
  };

  const getScoreBarColor = (score) => {
    if (score >= 60) return ST.colors.success;
    if (score >= 40) return "#FFA726";
    if (score >= 20) return "#FF7043";
    return "#EF5350";
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
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary, mb: 0.5 }}>
              {institutionalData.institutionName} — Global ranking indicators
            </Typography>
            <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
              Academic Year {institutionalData.academicYear} · {institutionalData.semester} · Based on institutional data from the LMS/SIS
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1.5} className="no-print">
            {/* Live Connection Indicator */}
            <Chip
              label={wsConnected ? "Live Updates Active" : "Connecting..."}
              size="small"
              icon={
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: wsConnected ? ST.colors.success : ST.colors.warning,
                    animation: wsConnected ? "pulse 2s infinite" : "none",
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 1 },
                      "50%": { opacity: 0.5 },
                    },
                  }}
                />
              }
              sx={{
                bgcolor: wsConnected ? `${ST.colors.success}20` : `${ST.colors.warning}20`,
                color: wsConnected ? ST.colors.success : ST.colors.warning,
                fontWeight: 600,
              }}
            />
            <Tooltip title="Downloads a PDF of the full ranking readiness report via the browser print dialog">
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
                Export PDF
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Institutional Overview Cards */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Total students
              </Typography>
              <Typography variant="h4" fontWeight={700}>
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
              <Typography variant="h4" fontWeight={700}>
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
              <Typography variant="h4" fontWeight={700}>
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
              <Typography variant="h4" fontWeight={700}>
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
              <Typography variant="h4" fontWeight={700}>
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
              <Typography variant="h4" fontWeight={700}>
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
              <Typography variant="h4" fontWeight={700}>
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
              <Typography variant="h4" fontWeight={700}>
                {institutionalData.activeNationalities}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {institutionalData.nationalitiesRegion}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Ranking Framework Breakdown Section */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Ranking framework breakdown
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Webometrics Card */}
        <Grid item xs={12}>
          <RankingCard
            badge="WEB"
            badgeColor="#4CAF50"
            title="Webometrics Ranking of World Universities"
            subtitle="Web presence & openness"
            overallReadiness={22}
            indicators={[
              {
                name: "Visibility / Impact",
                description: "External inlinks to university domain",
                weight: "50%",
                performance: "Limited data — Institutional site not publicly indexed in dataset",
                score: 20,
                status: "No data",
              },
              {
                name: "Openness / Transparency",
                description: "Open access publications & repositories",
                weight: "10%",
                performance: "6 active research students with thesis titles recorded; no repository evidence in data",
                score: 25,
                status: "Limited",
              },
              {
                name: "Excellence / Scholarly output",
                description: "Presence in Google Scholar top publications",
                weight: "10%",
                performance: "Research underway (Malaria, AI/UAV, NLP topics) — publications not yet confirmed",
                score: 15,
                status: "No data",
              },
              {
                name: "Presence",
                description: "Number of web pages indexed under domain",
                weight: "5%",
                performance: "Student/staff email domain (@templumis.ac) confirmed; web footprint unknown",
                score: 30,
                status: "Limited",
              },
            ]}
          />
        </Grid>

        {/* THE Card */}
        <Grid item xs={12}>
          <RankingCard
            badge="THE"
            badgeColor="#9C27B0"
            title="Times Higher Education World University Rankings"
            subtitle="Research, teaching & citations"
            overallReadiness={26}
            indicators={[
              {
                name: "Teaching (Learning Environment)",
                description: "Reputation survey, staff-to-student ratio, PhDs awarded",
                weight: "29.5%",
                performance: "SFR = 2.5:1 (excellent), avg GPA 3.32/4.0, 9 schools; reputation survey N/A",
                score: 62,
                status: "Good",
              },
              {
                name: "Research Environment",
                description: "Reputation, income, productivity",
                weight: "29%",
                performance: "6 research students; active dissertations in health, CS, engineering; no income data",
                score: 18,
                status: "No data",
              },
              {
                name: "Citations (Research Influence)",
                description: "Citations per faculty member (Scopus)",
                weight: "30%",
                performance: "No data — No citation records in institutional dataset",
                score: 5,
                status: "No data",
              },
              {
                name: "International Outlook",
                description: "Intl students, intl staff, intl collaborations",
                weight: "7.5%",
                performance: "35.1% international students across 10 nationalities; strong Pan-African mix",
                score: 58,
                status: "Good",
              },
              {
                name: "Industry Income",
                description: "Research income from industry per academic",
                weight: "4%",
                performance: "No data — No industry partnership data recorded",
                score: 5,
                status: "No data",
              },
            ]}
          />
        </Grid>

        {/* THE SSA Card */}
        <Grid item xs={12}>
          <RankingCard
            badge="SSA"
            badgeColor="#FF9800"
            title="THE Africa Universities Summit (Sub-Saharan Africa)"
            subtitle="Regionally adapted THE criteria"
            overallReadiness={50}
            indicators={[
              {
                name: "Teaching & Learning",
                description: "Staff-student ratio, courses, student outcomes",
                weight: "25%",
                performance: "SFR 2.5:1 excellent; 20 courses across 9 schools; 5 graduates confirmed; avg grade 77.6%",
                score: 70,
                status: "Good",
              },
              {
                name: "Research",
                description: "Papers, citations, research student enrolment",
                weight: "30%",
                performance: "6 active research students (16.2% of all); 5 dissertations in progress on applied African topics",
                score: 35,
                status: "Limited",
              },
              {
                name: "Knowledge Transfer",
                description: "Industry ties, community engagement",
                weight: "20%",
                performance: "Research topics address local challenges (maternal health, Swahili NLP, desalination)",
                score: 40,
                status: "Limited",
              },
              {
                name: "International Outlook",
                description: "Intl student diversity, cross-border programmes",
                weight: "15%",
                performance: "10 nationalities (Kenya, Nigeria, Uganda, Ghana, Ethiopia, Senegal, Cameroon, S.Africa, Somalia, Eswatini)",
                score: 65,
                status: "Good",
              },
              {
                name: "Access & Inclusion",
                description: "Gender equity, fee accessibility, student support",
                weight: "10%",
                performance: "48.6% female students; support processes visible (probation, academic standing reviews)",
                score: 68,
                status: "Good",
              },
            ]}
          />
        </Grid>

        {/* Shanghai ARWU Card */}
        <Grid item xs={12}>
          <RankingCard
            badge="ARWU"
            badgeColor="#F44336"
            title="Shanghai Rankings (Academic Ranking of World Universities)"
            subtitle="Research output & Nobel alumni"
            overallReadiness={5}
            indicators={[
              {
                name: "Alumni as Nobel / Fields Medal winners (Alumni)",
                description: "Weighted by year of award",
                weight: "10%",
                performance: "Not applicable — No alumni Nobel/Fields data; 5 graduates recorded",
                score: 0,
                status: "Not applicable",
              },
              {
                name: "Staff as Nobel / Fields Medal winners (Award)",
                description: "",
                weight: "20%",
                performance: "Not applicable — No data on faculty awards of this calibre",
                score: 0,
                status: "Not applicable",
              },
              {
                name: "Highly Cited Researchers (HiCi)",
                description: "Clarivate list of highly-cited academics",
                weight: "20%",
                performance: "No data — Citation records not in institutional dataset",
                score: 0,
                status: "No data",
              },
              {
                name: "Papers in Nature & Science (N&S)",
                description: "",
                weight: "20%",
                performance: "No data — Research still in dissertation phase; no publications confirmed",
                score: 0,
                status: "No data",
              },
              {
                name: "Papers indexed in SCI / SSCI (PUB)",
                description: "",
                weight: "20%",
                performance: "6 research dissertations in progress; journal publications not evidenced",
                score: 5,
                status: "No data",
              },
              {
                name: "Per capita academic performance (PCP)",
                description: "Above indicators normalised by FTE academic staff",
                weight: "10%",
                performance: "15 instructors; if any research published, per-capita could be meaningful at small scale",
                score: 8,
                status: "Limited",
              },
            ]}
          />
        </Grid>

        {/* QS Card */}
        <Grid item xs={12}>
          <RankingCard
            badge="QS"
            badgeColor="#00BCD4"
            title="QS World University Rankings"
            subtitle="Reputation, faculty, citations, diversity"
            overallReadiness={32}
            indicators={[
              {
                name: "Academic Reputation",
                description: "Global academic survey responses",
                weight: "30%",
                performance: "No data — No survey presence; institution not yet globally known",
                score: 10,
                status: "No data",
              },
              {
                name: "Employer Reputation",
                description: "Employer survey on graduate employability",
                weight: "15%",
                performance: "5 graduates; 3 BSc, 1 MA PG confirmed; no employment tracking data in dataset",
                score: 10,
                status: "No data",
              },
              {
                name: "Faculty/Student Ratio",
                description: "Lower ratio = better teaching capacity",
                weight: "10%",
                performance: "2.5:1 ratio — well within top-tier benchmarks (<10:1 considered strong globally)",
                score: 88,
                status: "Excellent",
              },
              {
                name: "Citations per Faculty",
                description: "Scopus citations normalised per faculty",
                weight: "20%",
                performance: "No data — No Scopus citation records in dataset",
                score: 5,
                status: "No data",
              },
              {
                name: "International Faculty Ratio",
                description: "% of academic staff who are non-nationals",
                weight: "5%",
                performance: "All 15 named instructors appear to be local; international faculty not distinguishable from data",
                score: 25,
                status: "Limited",
              },
              {
                name: "International Student Ratio",
                description: "% of non-national students enrolled",
                weight: "5%",
                performance: "35.1% international students — strong; 13 students from 9 non-Kenyan countries",
                score: 72,
                status: "Good",
              },
              {
                name: "Sustainability",
                description: "Environmental & social governance metrics (from 2024)",
                weight: "5%",
                performance: "Community-focused research topics noted; formal sustainability reporting not in dataset",
                score: 20,
                status: "Limited",
              },
              {
                name: "Employment Outcomes (EO)",
                description: "Graduate employment rate & alumni outcomes",
                weight: "10%",
                performance: "5 graduates across nursing, biochemistry, engineering, economics, law — no tracking data",
                score: 20,
                status: "Limited",
              },
            ]}
          />
        </Grid>

        {/* CWTS Leiden Card */}
        <Grid item xs={12}>
          <RankingCard
            badge="CWTS"
            badgeColor="#2196F3"
            title="CWTS Leiden Ranking"
            subtitle="Bibliometric research performance"
            overallReadiness={8}
            indicators={[
              {
                name: "P (Scientific output)",
                description: "Total number of Web of Science publications",
                weight: "Core",
                performance: "6 active research theses; publications pipeline in malaria, AI, NLP — none confirmed indexed",
                score: 8,
                status: "No data",
              },
              {
                name: "PP(top 10%) — Citation impact",
                description: "% papers in top 10% most-cited globally",
                weight: "Core",
                performance: "No data — No Web of Science citation records available",
                score: 3,
                status: "No data",
              },
              {
                name: "MCS — Mean citation score",
                description: "Average citations per paper (field-normalised)",
                weight: "Core",
                performance: "No data — Citation tracking requires published, indexed output",
                score: 3,
                status: "No data",
              },
              {
                name: "PP(collab) — International collaboration",
                description: "% papers with international co-authors",
                weight: "Core",
                performance: "Multi-national student body could support collaboration; no co-authorship data recorded",
                score: 10,
                status: "Limited",
              },
              {
                name: "PP(gender) — Gender diversity in authorship",
                description: "% papers with female authors",
                weight: "Supplementary",
                performance: "48.6% female students (3 of 6 research students female); potential strong performance if published",
                score: 45,
                status: "Good",
              },
              {
                name: "PP(OA) — Open Access publications",
                description: "% papers freely available online",
                weight: "Supplementary",
                performance: "Unknown — No open access or repository infrastructure evidenced",
                score: 10,
                status: "No data",
              },
            ]}
          />
        </Grid>
      </Grid>

      {/* Methodology Note */}
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 4 }}>
        <Typography variant="body2" fontWeight={600} gutterBottom>
          Methodology note:
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Score estimates are proxies derived from institutional LMS/SIS data available in the TemplumIS dataset.
          Indicators requiring external data (Scopus, Web of Science, employer surveys, reputation surveys) cannot be
          fully evaluated from internal records alone. Scores represent current data readiness relative to each
          ranking's criteria, not projected ranking positions.
        </Typography>
        <Typography variant="body2">
          Open bibliometric infrastructure — including{" "}
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
          , which indexes over 250 million scholarly works and provides free DOI-level citation tracking — offers a
          supplementary pathway to assess research output where commercial indexing (Scopus, WoS) is unavailable or
          cost-prohibitive. Institutions can register DOIs through any journal publisher and verify coverage via the
          OpenAlex API at no cost.
        </Typography>
      </Alert>

      {/* Analysis Sections */}
      <Grid container spacing={3}>
        {/* Where TemplumIS performs well */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TrendingUpIcon sx={{ color: ST.colors.success }} />
              <Typography variant="h6" fontWeight={700}>
                Where TemplumIS performs well
              </Typography>
            </Box>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                <strong>Faculty/Student Ratio (QS)</strong> — at 2.5:1, this is world-class; top global universities
                typically aim for under 10:1
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                <strong>International students</strong> — 35.1% from 10 nationalities scores well on QS, THE, and SSA
                diversity indicators
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                <strong>Gender equity</strong> — 48.6% female enrolment and 50% female among research students is
                strong for CWTS Leiden's PP(gender) metric
              </Typography>
              <Typography component="li" variant="body2">
                <strong>THE SSA is the most favourable framework</strong> at ~50% readiness, as it rewards teaching
                quality, African relevance, and inclusion — areas where TemplumIS has real data to show
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Where critical gaps exist */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TrendingDownIcon sx={{ color: ST.colors.error }} />
              <Typography variant="h6" fontWeight={700}>
                Where critical gaps exist
              </Typography>
            </Box>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                <strong>Citations (Scopus/WoS)</strong> — the single biggest blocker for THE, QS, CWTS Leiden, and
                Shanghai. None of the 6 research dissertations appear to have generated indexed publications yet
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                <strong>Shanghai ARWU</strong> — the lowest readiness (~5%) because it is almost entirely built around
                Nobel laureates and high-impact journal papers, which are structural constraints for any emerging
                university
              </Typography>
              <Typography component="li" variant="body2">
                <strong>Reputation surveys</strong> — QS (30% weight) and THE both rely on global academic/employer
                surveys that require years of brand-building to gain traction
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Quick wins */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: `${ST.colors.success}10`, border: `1px solid ${ST.colors.success}` }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <CheckCircleIcon sx={{ color: ST.colors.success }} />
              <Typography variant="h6" fontWeight={700}>
                Quick wins to improve ranking readiness
              </Typography>
            </Box>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                <strong>Publish the 6 active dissertations in peer-reviewed journals</strong> → immediately unlocks
                Scopus/WoS indicators; assigning a DOI at publication enables automatic indexing in{" "}
                <Box
                  component="a"
                  href="https://openalex.org"
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
                  OpenAlex
                  <OpenInNewIcon sx={{ fontSize: 11 }} />
                </Box>
                , providing free citation and author disambiguation tracking across 250M+ scholarly works before
                Scopus coverage is established
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                <strong>Build an open-access repository</strong> → improves Webometrics Openness and CWTS PP(OA)
              </Typography>
              <Typography component="li" variant="body2">
                <strong>Start tracking graduate employment outcomes</strong> → unlocks QS Employment Outcomes (10%) and
                Employer Reputation
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Ranking Card Component
function RankingCard({ badge, badgeColor, title, subtitle, overallReadiness, indicators }) {
  return (
    <Paper sx={{ overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: `${badgeColor}10`, borderBottom: `2px solid ${badgeColor}` }}>
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
              <Typography variant="h6" fontWeight={600}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, width: "25%" }}>Indicator</TableCell>
              <TableCell sx={{ fontWeight: 600, width: "10%" }}>Weight</TableCell>
              <TableCell sx={{ fontWeight: 600, width: "40%" }}>TemplumIS performance</TableCell>
              <TableCell sx={{ fontWeight: 600, width: "25%" }}>Score estimate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {indicators.map((indicator, index) => (
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
                <TableCell>
                  <Typography variant="body2">{indicator.performance}</Typography>
                  {indicator.status && (
                    <Chip
                      label={indicator.status}
                      size="small"
                      sx={{
                        mt: 0.5,
                        height: 20,
                        fontSize: 10,
                        bgcolor:
                          indicator.status === "Good" || indicator.status === "Excellent"
                            ? `${ST.colors.success}20`
                            : indicator.status === "No data" || indicator.status === "Not applicable"
                            ? `${ST.colors.error}20`
                            : `${ST.colors.warning}20`,
                        color:
                          indicator.status === "Good" || indicator.status === "Excellent"
                            ? ST.colors.success
                            : indicator.status === "No data" || indicator.status === "Not applicable"
                            ? ST.colors.error
                            : ST.colors.warning,
                      }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Box>
                    <LinearProgress
                      variant="determinate"
                      value={indicator.score}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: `${ST.colors.textSecondary}20`,
                        "& .MuiLinearProgress-bar": {
                          bgcolor: getScoreBarColor(indicator.score),
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      ~{indicator.score}%
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {/* Overall readiness row */}
            <TableRow sx={{ bgcolor: `${badgeColor}08` }}>
              <TableCell colSpan={3}>
                <Typography variant="body2" fontWeight={700}>
                  {badge} overall readiness
                </Typography>
              </TableCell>
              <TableCell>
                <Box>
                  <LinearProgress
                    variant="determinate"
                    value={overallReadiness}
                    sx={{
                      height: 10,
                      borderRadius: 4,
                      bgcolor: `${ST.colors.textSecondary}20`,
                      "& .MuiLinearProgress-bar": {
                        bgcolor: badgeColor,
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Typography variant="caption" fontWeight={700} sx={{ mt: 0.5, display: "block", color: badgeColor }}>
                    ~{overallReadiness}%
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function getScoreBarColor(score) {
  if (score >= 60) return "#4CAF50";
  if (score >= 40) return "#FFA726";
  if (score >= 20) return "#FF7043";
  return "#EF5350";
}
