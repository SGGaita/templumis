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
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { buildPlatformInsights } from "@/lib/rankingInsights";
import { withInstitutionDomains } from "@/lib/webometricsVisibility";

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

const RANKING_SYSTEMS = [
  {
    id: "web",
    badge: "WEB",
    badgeColor: "#4CAF50",
    tabLabel: "Webometrics",
    title: "Webometrics Ranking of World Universities",
    subtitle: "Visibility, transparency & excellence",
    overallReadiness: 1,
    totalWeightLabel: "100%",
    methodology: "webometrics",
    indicators: [
      {
        name: "Visibility / Impact",
        description: "Impact based on number of external referring domains (Ahrefs.com)",
        weight: "50%",
        performance:
          "No data - SIS confirms an email domain (@templumis.ac) but the institutional website is not publicly indexed, so referring domains cannot be counted",
        score: 0,
        status: "No data",
        detail: {
          source: "Ahrefs referring domains · Webometrics Visibility",
          evidence: [
            { label: "Official domain index", value: "Institutional site is not publicly indexed in the current dataset" },
            { label: "Referring domains (Ahrefs)", value: "0 - cannot be measured until a public canonical domain is indexed" },
            { label: "Web identity", value: "Student/staff email domain (@templumis.ac) is confirmed; public web footprint is not" },
          ],
          gaps: [
            "No verified canonical university domain in the ranking dataset",
            "Inbound link profile cannot be measured until the site is public and crawlable",
          ],
          actions: [
            "Publish one official, crawlable institutional domain and keep it as the single web identity",
            "Earn genuine inbound links from partners, government, and scholarly sites - Visibility is referring domains, not traffic",
            "Avoid split or conflicting domains that dilute the impact score",
          ],
          factors: [
            { label: "Score from SIS", note: "0% - referring domains cannot be counted without a public indexed domain. Email (@templumis.ac) is not a Visibility score." },
            { label: "Domain identity", note: "A single canonical domain is required for Visibility to accumulate." },
            { label: "Inbound links", note: "The 50% weight is unique referring domains (Ahrefs), not page count or analytics." },
            { label: "Presence removed", note: "Indexed web-page count is no longer part of the ranking." },
          ],
        },
      },
      {
        name: "Transparency / Openness",
        description: "Citations from top 310 cited researchers, excluding top 20 outliers (Google Scholar profiles)",
        weight: "10%",
        performance:
          "SIS records 6 research theses among 15 academic staff. No Google Scholar profiles or open repository - the inputs this indicator actually counts - are in the dataset",
        score: 10,
        status: "Limited",
        detail: {
          source: "Google Scholar profiles · Webometrics Transparency",
          evidence: [
            { label: "Research students", value: "6 active students with thesis titles recorded" },
            { label: "Open-access repository", value: "No institutional repository evidence in SIS/LMS data" },
            { label: "Google Scholar profiles", value: "0 of 15 academic staff confirmed" },
          ],
          gaps: [
            "Faculty Google Scholar profiles are not yet a complete, public set",
            "Theses and publications are not deposited in an open repository that ranking crawlers can see",
          ],
          actions: [
            "Create and maintain public Google Scholar profiles for academic staff",
            "Deposit theses and publications in an open-access repository with stable URLs",
            "Keep citation profiles free of duplicate or inflated entries - outliers are excluded",
          ],
          factors: [
            { label: "Score from SIS", note: "10% - 6 theses among 15 staff show a research pipeline, but Google Scholar citations (the actual metric) are not in the dataset." },
            { label: "Profile coverage", note: "Transparency uses citations from the institution's top 310 cited researchers." },
            { label: "Outlier rule", note: "The top 20 most-cited names are excluded to limit manipulation." },
            { label: "Open records", note: "Public profiles and repositories are what this 10% weight can actually see." },
          ],
        },
      },
      {
        name: "Excellence / Scholarly output",
        description: "Research papers in the top 10% most cited (2019–2023) (Scopus / Scimago)",
        weight: "40%",
        performance:
          "No data - 6 dissertations are underway (malaria, AI/UAV, NLP) but no Scopus/Scimago-indexed papers are confirmed, so top-10% citation share is 0",
        score: 0,
        status: "No data",
        detail: {
          source: "Scopus / Scimago top 10% most cited papers (2019–2023)",
          evidence: [
            { label: "Active research topics", value: "Malaria, AI/UAV, and NLP dissertations are underway" },
            { label: "Indexed publications", value: "Journal articles are not yet confirmed in Scopus / Scimago" },
            { label: "Top 10% cited papers", value: "0 - none identified in the current dataset" },
          ],
          gaps: [
            "No confirmed Scopus-indexed papers in the ranking window",
            "Citation performance in the global top 10% cannot be measured without indexed output",
          ],
          actions: [
            "Convert active dissertations into peer-reviewed, indexed publications",
            "Assign DOIs at publication so papers can be tracked in Scopus/Scimago and OpenAlex",
            "Target recognised journals in each field - Excellence is highly cited papers, not website content",
          ],
          factors: [
            { label: "Score from SIS", note: "0% - no Scopus/Scimago-indexed papers, so the top-10% citation share cannot be above zero." },
            { label: "Index coverage", note: "Only Scopus/Scimago papers in the 2019–2023 window count." },
            { label: "Citation threshold", note: "The 40% weight is papers in the world's top 10% most cited, not total output." },
            { label: "Pipeline", note: "Current dissertations are a pipeline, not yet ranking-visible excellence." },
          ],
        },
      },
    ],
  },
  {
    id: "the",
    badge: "THE",
    badgeColor: "#9C27B0",
    tabLabel: "THE",
    title: "Times Higher Education World University Rankings",
    subtitle: "Five pillars · 18 indicators · 100%",
    overallReadiness: 13,
    totalWeightLabel: "100%",
    methodology: "the",
    criteria: [
      {
        id: "teaching",
        shortLabel: "Teaching",
        name: "Teaching (the learning environment)",
        points: 29.5,
        weightLabel: "29.5%",
        readiness: 23,
        indicators: [
          {
            name: "Teaching reputation",
            description:
              "Academic Reputation Survey (Nov 2024–Jan 2025 combined with 2024; 108,000+ responses), weighted for a balanced global distribution of scholars and institutions",
            weight: "15%",
            performance: "No data - institution is not yet visible in the global teaching-reputation survey",
            score: 8,
            status: "No data",
          },
          {
            name: "Staff-to-student ratio",
            description: "Academic staff relative to student headcount",
            weight: "4.5%",
            performance: "SFR = 2.5:1 (15 instructors / 37 students) - well within top-tier global teaching-capacity benchmarks",
            score: 88,
            status: "Excellent",
          },
          {
            name: "Doctorate-to-bachelor's ratio",
            description:
              "Share of postgraduate research students as a signal of high-level teaching; normalised for subject mix",
            weight: "2%",
            performance: "25 UG · 12 PG, including 6 research students (16.2% of enrolment); doctoral awards not separately evidenced",
            score: 35,
            status: "Limited",
          },
          {
            name: "Doctorates-awarded-to-academic-staff ratio",
            description:
              "Doctoral awards relative to academic staff, normalised because doctoral volume varies by discipline",
            weight: "5.5%",
            performance: "5 graduates recorded; doctoral awards per academic staff cannot be confirmed from SIS data",
            score: 15,
            status: "Limited",
          },
          {
            name: "Institutional income",
            description:
              "Institutional income scaled against academic staff and normalised for purchasing-power parity (PPP); a proxy for infrastructure and facilities available to students and staff",
            weight: "2.5%",
            performance: "No data - income, infrastructure spend, and PPP-adjusted figures are not in the SIS dataset",
            score: 5,
            status: "No data",
          },
        ],
      },
      {
        id: "research-environment",
        shortLabel: "Research env.",
        name: "Research environment (volume, income and reputation)",
        points: 29,
        weightLabel: "29%",
        readiness: 7,
        indicators: [
          {
            name: "Research reputation",
            description:
              "University reputation for research excellence among peers, from the annual Academic Reputation Survey - the largest indicator in this pillar",
            weight: "18%",
            performance: "No data - no survey presence; institution is not yet globally known for research",
            score: 8,
            status: "No data",
          },
          {
            name: "Research income",
            description:
              "Research income scaled against academic staff, adjusted for PPP, and normalised for subject mix (science grants are typically larger than those in social sciences, arts, and humanities)",
            weight: "5.5%",
            performance: "No data - research grant and income records are not in the institutional dataset",
            score: 5,
            status: "No data",
          },
          {
            name: "Research productivity",
            description:
              "Scopus-indexed publications per scholar, scaled for institutional size and normalised for subject. Since 2018, credit is given for papers in subjects where a university declares no staff",
            weight: "5.5%",
            performance: "6 active research dissertations (health, CS, engineering); journal publications not yet confirmed as Scopus-indexed",
            score: 8,
            status: "No data",
          },
        ],
      },
      {
        id: "research-quality",
        shortLabel: "Research quality",
        name: "Research quality (citation impact, strength, excellence and influence)",
        points: 30,
        weightLabel: "30%",
        readiness: 3,
        indicators: [
          {
            name: "Citation impact",
            description:
              "Average citations of published work. Elsevier Scopus data: publications 2020–2024, citations 2020–2025 (~18.7 million works, ~174.9 million citations). Field-normalised; the score blends equal country-adjusted and non-country-adjusted measures",
            weight: "15%",
            performance: "No data - no Scopus citation records in the institutional dataset",
            score: 3,
            status: "No data",
          },
          {
            name: "Research strength",
            description: "75th percentile of field-weighted citation impact (added in 2023)",
            weight: "5%",
            performance: "Requires indexed, cited output - none confirmed",
            score: 3,
            status: "No data",
          },
          {
            name: "Research excellence",
            description:
              "Number of publications in the worldwide top 10% by field-weighted citation impact, normalised by year, subject, and staff numbers (added in 2023)",
            weight: "5%",
            performance: "Requires Scopus-indexed papers in the global top 10% FWCI - none confirmed",
            score: 3,
            status: "No data",
          },
          {
            name: "Research influence",
            description:
              "Iterative measure of paper importance: citations weighted by the importance of citing papers, accounting for disciplinary citation patterns (added in 2023)",
            weight: "5%",
            performance: "No citation network data available until publications are indexed",
            score: 3,
            status: "No data",
          },
        ],
      },
      {
        id: "international",
        shortLabel: "International",
        name: "International outlook (staff, students and research)",
        points: 7.5,
        weightLabel: "7.5%",
        readiness: 35,
        indicators: [
          {
            name: "Proportion of international students",
            description:
              "Share of international students, with country-population normalisation so large countries are not disadvantaged versus smaller ones",
            weight: "2.5%",
            performance: "35.1% international students (13 of 37) across 10 nationalities - strong Pan-African mix",
            score: 72,
            status: "Good",
          },
          {
            name: "Proportion of international staff",
            description: "Share of international academic staff, also normalised for country population",
            weight: "2.5%",
            performance: "All 15 named instructors appear local; international faculty cannot be distinguished from the dataset",
            score: 22,
            status: "Limited",
          },
          {
            name: "International collaboration",
            description:
              "Share of relevant publications with at least one international co-author, over a five-year window, normalised for subject mix and country population",
            weight: "2.5%",
            performance: "Multi-national student body could support collaboration; no co-authorship data on indexed papers",
            score: 10,
            status: "Limited",
          },
          {
            name: "Study abroad",
            description:
              "International learning opportunities for domestic students. Currently weighted at 0% because of Covid-19 travel disruption; may receive a non-zero weight in a future cycle",
            weight: "0%",
            performance: "Not scored in the current methodology - no outbound mobility records in the SIS",
            score: 0,
            status: "Not applicable",
          },
        ],
      },
      {
        id: "industry",
        shortLabel: "Industry",
        name: "Industry (income and patents)",
        points: 4,
        weightLabel: "4%",
        readiness: 4,
        indicators: [
          {
            name: "Industry income",
            description:
              "Research income from industry (PPP-adjusted) scaled against academic staff - a measure of knowledge transfer and the ability to attract commercial funding",
            weight: "2%",
            performance: "No data - no industry research-income or partnership records in the dataset",
            score: 5,
            status: "No data",
          },
          {
            name: "Patents",
            description:
              "Patents from any source that cite the university's research (introduced 2023). Elsevier data, patents published 2020–2024, 100+ patent offices; subject-weighted and scaled for institutional size",
            weight: "2%",
            performance: "No patent or patent-citation records in the institutional dataset",
            score: 3,
            status: "No data",
          },
        ],
      },
    ],
  },
  {
    id: "ssa",
    badge: "SSA",
    badgeColor: "#FF9800",
    tabLabel: "THE Africa",
    title: "THE Africa Universities Summit (Sub-Saharan Africa)",
    subtitle: "Five pillars · 20 metrics · 100%",
    overallReadiness: 28,
    totalWeightLabel: "100%",
    methodology: "ssa",
    criteria: [
      {
        id: "resources",
        shortLabel: "Resources",
        name: "Resources and finances",
        points: 22,
        weightLabel: "22%",
        readiness: 23,
        indicators: [
          {
            name: "Faculty-to-student ratio",
            description: "Academic staff relative to student headcount",
            weight: "3%",
            performance: "SFR = 2.5:1 (15 instructors / 37 students) - world-class teaching capacity",
            score: 88,
            status: "Excellent",
          },
          {
            name: "Finance per student",
            description: "Institutional spending relative to student numbers",
            weight: "3%",
            performance: "No data - per-student finance figures are not in the SIS dataset",
            score: 5,
            status: "No data",
          },
          {
            name: "Funding sources",
            description: "Diversity and composition of institutional funding",
            weight: "4%",
            performance: "No data - funding-mix records are not in the institutional dataset",
            score: 5,
            status: "No data",
          },
          {
            name: "Continuous professional development",
            description: "Staff development and training provision",
            weight: "4%",
            performance: "No documented CPD programme or staff-development records in the dataset",
            score: 5,
            status: "No data",
          },
          {
            name: "Mental health counselling",
            description: "Availability of student mental-health and counselling services",
            weight: "4%",
            performance: "Student Support processes are visible (probation, academic standing); dedicated counselling provision is not evidenced",
            score: 35,
            status: "Limited",
          },
          {
            name: "Facilities",
            description: "Standard of accommodation; facilities and resources",
            weight: "4%",
            performance: "No accommodation-standard or campus-facilities evidence in the SIS dataset",
            score: 10,
            status: "No data",
          },
        ],
      },
      {
        id: "access",
        shortLabel: "Access",
        name: "Access and fairness",
        points: 24,
        weightLabel: "24%",
        readiness: 27,
        indicators: [
          {
            name: "Low-income students receiving financial aid",
            description: "Share of low-income students who receive institutional financial aid",
            weight: "5%",
            performance: "Scholarship and aid workflows exist in TemplumIS; the share of low-income students receiving aid is not reported",
            score: 40,
            status: "Limited",
          },
          {
            name: "Proportion of first-generation students",
            description: "Share of students who are the first in their family to attend university",
            weight: "5%",
            performance: "First-generation status is not captured in the SIS dataset",
            score: 5,
            status: "No data",
          },
          {
            name: "Proportion of female graduates",
            description: "Share of graduates who are female",
            weight: "4%",
            performance: "48.6% female enrolment (18 of 37); graduate-cohort gender split is not separately recorded among 5 graduates",
            score: 65,
            status: "Good",
          },
          {
            name: "Affordability",
            description: "Cost of study relative to ability to pay",
            weight: "4%",
            performance: "Fee levels and household-affordability metrics are not in the dataset; aid processes exist",
            score: 25,
            status: "Limited",
          },
          {
            name: "Accessibility",
            description: "Disability support services; accessible facilities",
            weight: "6%",
            performance: "No disability-support or accessible-facilities records in the institutional dataset",
            score: 10,
            status: "No data",
          },
        ],
      },
      {
        id: "engagement",
        shortLabel: "Engagement",
        name: "Student engagement",
        points: 22,
        weightLabel: "22%",
        readiness: 45,
        indicators: [
          {
            name: "Experiential learning",
            description: "Experience; practical courses",
            weight: "8%",
            performance: "20 courses across 9 schools; applied dissertations (health, desalination, NLP) but practical/experiential course flags are not catalogued",
            score: 45,
            status: "Limited",
          },
          {
            name: "Employability",
            description: "Career guidance; ability to secure a job",
            weight: "6%",
            performance: "5 graduates recorded; no career-guidance programme or employment-outcome tracking in the dataset",
            score: 20,
            status: "Limited",
          },
          {
            name: "Course quality",
            description: "Curriculum; quality of teaching",
            weight: "4%",
            performance: "Avg GPA 3.32/4.0; avg grade 77.6%; 20 courses across 9 schools",
            score: 60,
            status: "Good",
          },
          {
            name: "Teaching engagement",
            description: "Critical thinking; making connections; interaction with faculty",
            weight: "4%",
            performance: "2.5:1 staff-to-student ratio supports frequent faculty interaction; survey evidence of critical thinking is not recorded",
            score: 70,
            status: "Good",
          },
        ],
      },
      {
        id: "ethics",
        shortLabel: "Leadership",
        name: "Ethical leadership",
        points: 10,
        weightLabel: "10%",
        readiness: 13,
        indicators: [
          {
            name: "Leadership",
            description: "Students' union; own business; innovation; developing leadership skills",
            weight: "6%",
            performance: "No students' union, student-enterprise, or leadership-development programme is documented",
            score: 15,
            status: "Limited",
          },
          {
            name: "Ethics",
            description: "Code of conduct / ethics code; evidence of a university code of ethics",
            weight: "4%",
            performance: "No published code of conduct or institutional ethics code is evidenced in the dataset",
            score: 10,
            status: "No data",
          },
        ],
      },
      {
        id: "africa-impact",
        shortLabel: "Africa impact",
        name: "Africa impact",
        points: 22,
        weightLabel: "22%",
        readiness: 24,
        indicators: [
          {
            name: "African research citations",
            description: "Citations of the university's Africa-related research",
            weight: "8%",
            performance: "Dissertations address African topics (malaria, maternal health, Swahili NLP); none are confirmed as cited, indexed output",
            score: 12,
            status: "Limited",
          },
          {
            name: "African research co-authorship",
            description: "Research co-authored with African partners or institutions",
            weight: "8%",
            performance: "10 African nationalities in the student body; no documented African co-authorship on indexed papers",
            score: 20,
            status: "Limited",
          },
          {
            name: "African heritage",
            description: "African work or achievements; evidence of African cultural heritage",
            weight: "6%",
            performance: "Pan-African enrolment and research on Swahili NLP and local health challenges; cultural-heritage programmes are not documented",
            score: 45,
            status: "Limited",
          },
        ],
      },
    ],
  },
  {
    id: "arwu",
    badge: "ARWU",
    badgeColor: "#F44336",
    tabLabel: "Shanghai",
    title: "Shanghai Rankings (Academic Ranking of World Universities)",
    subtitle: "Research output & Nobel alumni",
    overallReadiness: 5,
    methodology: "arwu",
    indicators: [
      {
        name: "Alumni as Nobel / Fields Medal winners (Alumni)",
        description: "Weighted by year of award",
        weight: "10%",
        performance: "Not applicable - No alumni Nobel/Fields data; 5 graduates recorded",
        score: 0,
        status: "Not applicable",
      },
      {
        name: "Staff as Nobel / Fields Medal winners (Award)",
        description: "",
        weight: "20%",
        performance: "Not applicable - No data on faculty awards of this calibre",
        score: 0,
        status: "Not applicable",
      },
      {
        name: "Highly Cited Researchers (HiCi)",
        description: "Clarivate list of highly-cited academics",
        weight: "20%",
        performance: "No data - Citation records not in institutional dataset",
        score: 0,
        status: "No data",
      },
      {
        name: "Papers in Nature & Science (N&S)",
        description: "",
        weight: "20%",
        performance: "No data - Research still in dissertation phase; no publications confirmed",
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
    ],
  },
  {
    id: "qs",
    badge: "QS",
    badgeColor: "#00BCD4",
    tabLabel: "QS",
    title: "QS World University Rankings",
    subtitle: "Five lenses · nine indicators · 100%",
    overallReadiness: 22,
    methodology: "qs",
    indicators: [
      {
        name: "Academic Reputation",
        description: "Global survey of academics on teaching and research quality - the largest QS lens",
        weight: "30%",
        performance: "No data - no survey presence; institution is not yet globally known among academics",
        score: 10,
        status: "No data",
      },
      {
        name: "Employer Reputation",
        description: "Global survey of employers on which universities produce the most capable, innovative, and effective graduates",
        weight: "15%",
        performance: "5 graduates recorded (nursing, biochemistry, engineering, economics, law); no employer-survey presence",
        score: 10,
        status: "No data",
      },
      {
        name: "Faculty Student Ratio",
        description: "Teaching capacity: academic staff relative to student headcount. A lower ratio is scored more highly",
        weight: "10%",
        performance: "2.5:1 ratio (15 instructors / 37 students) - well within top-tier global benchmarks (<10:1 is considered strong)",
        score: 88,
        status: "Excellent",
      },
      {
        name: "Citations per Faculty",
        description: "Research impact: Scopus citations of published papers, normalised for faculty size and subject mix",
        weight: "20%",
        performance: "No data - no Scopus citation records in the institutional dataset",
        score: 5,
        status: "No data",
      },
      {
        name: "International Faculty Ratio",
        description: "Share of academic staff who are international",
        weight: "5%",
        performance: "All 15 named instructors appear local; international faculty cannot be distinguished from the dataset",
        score: 25,
        status: "Limited",
      },
      {
        name: "International Student Ratio",
        description: "Share of students who are international",
        weight: "5%",
        performance: "35.1% international students (13 of 37) from 9 non-Kenyan countries - strong Pan-African mix",
        score: 72,
        status: "Good",
      },
      {
        name: "International Research Network",
        description:
          "Richness and diversity of international research partnerships",
        weight: "5%",
        performance: "Multi-national student body could support partnerships; no documented international co-authorship or research-network index",
        score: 10,
        status: "Limited",
      },
      {
        name: "Employment Outcomes",
        description:
          "Employability of graduates: employment rate and alumni impact",
        weight: "5%",
        performance: "5 graduates across nursing, biochemistry, engineering, economics, and law - no employment or alumni-outcome tracking",
        score: 20,
        status: "Limited",
      },
      {
        name: "Sustainability",
        description:
          "How the institution tackles environmental and social issues",
        weight: "5%",
        performance: "Community-focused research topics noted (maternal health, desalination); formal ESG or sustainability reporting is not in the dataset",
        score: 20,
        status: "Limited",
      },
    ],
  },
  {
    id: "cwts",
    badge: "CWTS",
    badgeColor: "#2196F3",
    tabLabel: "CWTS Leiden",
    title: "CWTS Leiden Ranking",
    subtitle: "Bibliometric research performance",
    overallReadiness: 8,
    indicators: [
      {
        name: "P (Scientific output)",
        description: "Total number of Web of Science publications",
        weight: "Core",
        performance: "6 active research theses; publications pipeline in malaria, AI, NLP - none confirmed indexed",
        score: 8,
        status: "No data",
      },
      {
        name: "PP(top 10%) - Citation impact",
        description: "% papers in top 10% most-cited globally",
        weight: "Core",
        performance: "No data - No Web of Science citation records available",
        score: 3,
        status: "No data",
      },
      {
        name: "MCS - Mean citation score",
        description: "Average citations per paper (field-normalised)",
        weight: "Core",
        performance: "No data - Citation tracking requires published, indexed output",
        score: 3,
        status: "No data",
      },
      {
        name: "PP(collab) - International collaboration",
        description: "% papers with international co-authors",
        weight: "Core",
        performance: "Multi-national student body could support collaboration; no co-authorship data recorded",
        score: 10,
        status: "Limited",
      },
      {
        name: "PP(gender) - Gender diversity in authorship",
        description: "% papers with female authors",
        weight: "Supplementary",
        performance: "48.6% female students (3 of 6 research students female); potential strong performance if published",
        score: 45,
        status: "Good",
      },
      {
        name: "PP(OA) - Open Access publications",
        description: "% papers freely available online",
        weight: "Supplementary",
        performance: "Unknown - No open access or repository infrastructure evidenced",
        score: 10,
        status: "No data",
      },
    ],
  },
  {
    id: "aur",
    badge: "AUR",
    badgeColor: "#007A3D",
    tabLabel: "AAUR",
    title: "Arab Ranking for Universities (AAUR)",
    subtitle: "Four criteria · 36 indicators · 1,000 points",
    overallReadiness: 16,
    totalWeightLabel: "1,000 points",
    methodology: "aur",
    group: "arab",
    groupLabel: "Arab Rankings",
    groupColor: "#007A3D",
    criteria: [
      {
        id: "education",
        shortLabel: "Education",
        name: "Education and Learning (Quality of Teaching)",
        points: 300,
        readiness: 32,
        indicators: [
          {
            name: "Faculty (FTE) : students (Head Count)",
            description:
              "Ratio of faculty members (FTE) to the total number of students (Head Count) during the ranking year",
            weight: "80 pts",
            performance:
              "SFR = 2.5:1 (15 instructors / 37 students) - well above typical 1:15–1:20 teaching-capacity benchmarks",
            score: 85,
            status: "Excellent",
          },
          {
            name: "PhD faculty (FTE) : students (Head Count)",
            description:
              "Ratio of faculty members (FTE) holding a PhD to the number of students (Head Count) during the ranking year",
            weight: "30 pts",
            performance: "Doctoral qualifications of the 15 instructors are not distinguished in the SIS dataset",
            score: 20,
            status: "Limited",
          },
          {
            name: "Digital platforms and AI in teaching",
            description: "Rate of utilization of digital platforms and artificial intelligence tools in teaching",
            weight: "20 pts",
            performance: "TemplumIS LMS is in use; systematic measurement of AI-tool utilisation in teaching is not recorded",
            score: 40,
            status: "Limited",
          },
          {
            name: "Interdisciplinary academic programmes",
            description:
              "Number of programmes integrating two or more disciplines, granting multidisciplinary, interdisciplinary, or transdisciplinary degrees",
            weight: "20 pts",
            performance: "20 courses across 9 schools; multidisciplinary degree awards are not separately catalogued",
            score: 25,
            status: "Limited",
          },
          {
            name: "Faculty with Scopus H-index ≥ 10",
            description: "Number of faculty members (Head Count) with an H-index of at least 10 in Scopus",
            weight: "60 pts",
            performance: "No Scopus author profiles are linked to the 15 instructors in the institutional dataset",
            score: 5,
            status: "No data",
          },
          {
            name: "External experts seconded to teach or consult",
            description:
              "Experts fully or partly seconded to teach, supervise theses from outside the university (excluding hospital medical training), or provide scientific consultancy, holding at least a bachelor's degree, during the ranking year",
            weight: "15 pts",
            performance: "No secondment, visiting-expert, or external-consultancy teaching records in the SIS",
            score: 5,
            status: "No data",
          },
          {
            name: "Programmatic accreditations",
            description: "Number of regional or international programmatic accreditations during the ranking year",
            weight: "30 pts",
            performance: "Programme-level regional or international accreditations are not recorded for the ranking year",
            score: 5,
            status: "No data",
          },
          {
            name: "Indexed papers with undergraduate authors",
            description:
              "Papers in internationally indexed journals with undergraduate students listed as authors during the ranking year, with the research link provided",
            weight: "30 pts",
            performance: "Research is still in dissertation phase; undergraduate co-authorship on indexed papers is not evidenced",
            score: 8,
            status: "No data",
          },
          {
            name: "Prestigious scientific and academic awards",
            description:
              "Number of recipients of prestigious scientific and academic awards with international or Arab relevance",
            weight: "15 pts",
            performance: "No award recipients of international or Arab relevance are recorded",
            score: 0,
            status: "Not applicable",
          },
        ],
      },
      {
        id: "research",
        shortLabel: "Research",
        name: "Scientific Research",
        points: 400,
        readiness: 4,
        indicators: [
          {
            name: "Scopus-indexed publications (5 years)",
            description: "Number of scientific research publications indexed in Scopus during the last five years",
            weight: "100 pts",
            performance: "6 active research theses; no Scopus-indexed institutional output confirmed in the dataset",
            score: 5,
            status: "No data",
          },
          {
            name: "Q1 and Q2 share of Scopus output (5 years)",
            description:
              "University research publications in Q1 and Q2 journals as a share of total Scopus-indexed output over the last five years",
            weight: "50 pts",
            performance: "Cannot be assessed until Scopus-indexed publications exist",
            score: 3,
            status: "No data",
          },
          {
            name: "Average citations per Scopus paper (6 years)",
            description: "Average citations per Scopus-indexed research paper during the last six years",
            weight: "50 pts",
            performance: "No citation records in the institutional dataset",
            score: 3,
            status: "No data",
          },
          {
            name: "Top 10% most-cited publications (6 years)",
            description:
              "Percentage of the university's research publications ranked among the top 10% most cited globally during the last six years",
            weight: "40 pts",
            performance: "Requires indexed, cited output - none confirmed",
            score: 3,
            status: "No data",
          },
          {
            name: "International co-authored Scopus papers (5 years)",
            description:
              "Scopus-indexed publications co-authored with international universities during the last five years",
            weight: "40 pts",
            performance: "Multi-national student body could support collaboration; no co-authorship data recorded",
            score: 8,
            status: "Limited",
          },
          {
            name: "Non-academic co-authored Scopus papers (5 years)",
            description:
              "Scopus-indexed publications co-authored with non-academic institutions during the last five years",
            weight: "25 pts",
            performance: "No industry or non-academic co-authorship recorded",
            score: 3,
            status: "No data",
          },
          {
            name: "Field-Weighted Citation Impact (FWCI)",
            description: "FWCI across all university disciplines according to Scopus during the last five years",
            weight: "40 pts",
            performance: "Scopus FWCI is not available without indexed publications",
            score: 3,
            status: "No data",
          },
          {
            name: "Research budget as % of university budget",
            description:
              "Percentage of the approved research budget out of the university's total budget during the ranking year",
            weight: "30 pts",
            performance: "Budget composition is not in the SIS dataset",
            score: 5,
            status: "No data",
          },
          {
            name: "Arabic Q1/Q2 papers (ARCI / EKB / Arcif)",
            description:
              "Scientific papers published in Arabic and indexed in ARCI/EKB/Arcif Clarivate, classified Q1/Q2, during the last five years",
            weight: "25 pts",
            performance: "No Arabic-indexed Q1/Q2 output recorded",
            score: 3,
            status: "No data",
          },
        ],
      },
      {
        id: "innovation",
        shortLabel: "Innovation",
        name: "Creativity, Entrepreneurship, and Innovation",
        points: 150,
        readiness: 5,
        indicators: [
          {
            name: "SDG 9 share of Scopus output (5 years)",
            description:
              "Scopus-indexed publications related to industry, innovation, and infrastructure (SDG 9) out of total research output during the last five years",
            weight: "50 pts",
            performance:
              "Dissertation topics include applied infrastructure and AI; none are confirmed as Scopus-indexed SDG 9 output",
            score: 8,
            status: "No data",
          },
          {
            name: "SDG 9 publications in Q1 and Q2 (5 years)",
            description:
              "Percentage of Scopus-indexed SDG 9 publications in Q1 and Q2 journals out of total SDG 9 research output during the last five years",
            weight: "50 pts",
            performance: "Requires indexed SDG 9 publications - none confirmed",
            score: 3,
            status: "No data",
          },
          {
            name: "Funded innovation projects with beneficiaries",
            description:
              "Funded research projects in development and innovation conducted with beneficiary entities during the last five years",
            weight: "5 pts",
            performance:
              "Applied dissertations address local challenges (maternal health, desalination); no funded-project contracts recorded",
            score: 15,
            status: "Limited",
          },
          {
            name: "Creativity, entrepreneurship, and TT events",
            description:
              "Documented activities and events in creativity, entrepreneurship, innovation, and technology transfer during the ranking year",
            weight: "5 pts",
            performance: "No documented innovation or technology-transfer events in the dataset",
            score: 5,
            status: "No data",
          },
          {
            name: "Active consultancy and product-development contracts",
            description:
              "Contracts between the university, incubators, or technology-transfer offices and industry, research institutions, or beneficiaries to develop or manufacture a product during the ranking year",
            weight: "5 pts",
            performance: "No incubator, TTO, or product-development contracts recorded",
            score: 5,
            status: "No data",
          },
          {
            name: "Innovation and entrepreneurship centre",
            description:
              "Availability of an Innovation and Entrepreneurship Centre or supporting units such as incubators, accelerators, or technology-transfer offices",
            weight: "5 pts",
            performance: "No centre, incubator, accelerator, or TTO is evidenced in institutional records",
            score: 5,
            status: "No data",
          },
          {
            name: "Patents citing university research (5 years)",
            description: "Number of patents citing the university's published research outputs (Patents Count)",
            weight: "15 pts",
            performance: "No patent or patent-citation records in the dataset",
            score: 3,
            status: "No data",
          },
          {
            name: "Patent citations per 1,000 publications (5 years)",
            description:
              "Average patent citations received per 1,000 scholarly publications (Patent Citations per Scholarly Output)",
            weight: "10 pts",
            performance: "Requires scholarly output and patent citations - neither is recorded",
            score: 3,
            status: "No data",
          },
          {
            name: "Startups and spin-offs from incubators",
            description:
              "Number of startup and spin-off companies emerging from the university's technology and business incubators",
            weight: "5 pts",
            performance: "No incubator pipeline or spin-off companies recorded",
            score: 0,
            status: "No data",
          },
        ],
      },
      {
        id: "collaboration",
        shortLabel: "Collaboration",
        name: "International and Local Collaboration and Community Service",
        points: 150,
        readiness: 25,
        indicators: [
          {
            name: "International faculty (full academic year)",
            description:
              "International faculty appointed, contracted, or physically participating in teaching for a full academic year or its equivalent",
            weight: "30 pts",
            performance:
              "All 15 named instructors appear local; international faculty cannot be distinguished from the dataset",
            score: 20,
            status: "Limited",
          },
          {
            name: "Visiting professors (documented contribution)",
            description:
              "Visiting professors from other countries with a documented academic or research contribution during the ranking year (teaching, supervision, lectures, training, consultancy, or joint research)",
            weight: "10 pts",
            performance: "No visiting-professor records for the ranking year",
            score: 5,
            status: "No data",
          },
          {
            name: "International students enrolled",
            description: "Number of international students enrolled for study during the ranking year",
            weight: "30 pts",
            performance: "35.1% international students (13 of 37) across 10 nationalities - strong Pan-African mix",
            score: 78,
            status: "Good",
          },
          {
            name: "Joint or dual degrees with ranked universities",
            description:
              "Active academic programmes offering joint or dual degrees with globally ranked universities, including international branch programmes hosted by or at the university",
            weight: "20 pts",
            performance: "No joint, dual-degree, or international branch programmes recorded",
            score: 5,
            status: "No data",
          },
          {
            name: "International conferences, forums, and training",
            description:
              "Documented international conferences, forums, and training programmes organized by the university during the ranking year",
            weight: "20 pts",
            performance: "No documented international conferences or training programmes in the dataset",
            score: 5,
            status: "No data",
          },
          {
            name: "Faculty in academic exchange programmes",
            description:
              "Faculty members who participated in documented local or international academic exchange programmes during the ranking year",
            weight: "10 pts",
            performance: "Faculty exchange participation is not recorded",
            score: 5,
            status: "No data",
          },
          {
            name: "Student exchange (incoming and outgoing)",
            description:
              "Students participating in local or international academic exchange programmes, incoming or outgoing, relative to total students during the ranking year",
            weight: "10 pts",
            performance: "Multi-national enrolment is strong; formal exchange programmes are not evidenced",
            score: 15,
            status: "Limited",
          },
          {
            name: "Off-campus community engagement",
            description:
              "Documented community engagement activities organized by the university to serve the community outside the campus during the ranking year",
            weight: "10 pts",
            performance:
              "Research topics address community challenges; off-campus engagement events are not documented",
            score: 20,
            status: "Limited",
          },
          {
            name: "Open Science - resources open to non-affiliates",
            description:
              "Provision of the university's educational and research resources, activities, and facilities to non-university affiliates, industry, and beneficiary entities",
            weight: "10 pts",
            performance: "No open-science policy or external facility-access programme is evidenced",
            score: 10,
            status: "No data",
          },
        ],
      },
    ],
  },
  {
    id: "the-arab",
    badge: "ARAB",
    badgeColor: "#5E35B1",
    tabLabel: "THE Arab Ranking",
    title: "THE Arab University Rankings 2026",
    subtitle: "Five pillars · 16 indicators · 100%",
    overallReadiness: 13,
    totalWeightLabel: "100%",
    methodology: "the-arab",
    group: "arab",
    criteria: [
      {
        id: "teaching",
        shortLabel: "Teaching",
        name: "Teaching (the learning environment)",
        points: 29.5,
        weightLabel: "29.5%",
        readiness: 23,
        indicators: [
          {
            name: "Teaching reputation",
            description:
              "Academic Reputation Survey (Nov 2024–Jan 2025 combined with 2024; 108,000+ global responses). Universities with no votes score zero. THE Arab now uses the same global teaching-reputation scores as the World University Rankings",
            weight: "15%",
            performance: "No data - institution is not yet visible in the global teaching-reputation survey",
            score: 0,
            status: "No data",
          },
          {
            name: "Doctorates awarded-to-academic-staff ratio",
            description:
              "Subject-weighted doctorates divided by subject-weighted academic staff, then normalised - a signal of teaching at the highest level",
            weight: "5.5%",
            performance: "5 graduates recorded; doctoral awards per academic staff cannot be confirmed from SIS data",
            score: 15,
            status: "Limited",
          },
          {
            name: "Academic staff-to-student ratio",
            description:
              "FTE staff in an academic post divided by FTE students on programmes that lead to a degree, certificate, credit, or other qualification",
            weight: "4.5%",
            performance: "SFR = 2.5:1 (15 instructors / 37 students) - well within top-tier teaching-capacity benchmarks",
            score: 88,
            status: "Excellent",
          },
          {
            name: "Doctorates awarded-to-undergraduate-degrees-awarded ratio",
            description:
              "Doctoral awards relative to undergraduate degrees awarded; normalised after calculation",
            weight: "2%",
            performance: "25 UG · 12 PG, including 6 research students (16.2% of enrolment); doctoral vs undergraduate awards are not separately evidenced",
            score: 35,
            status: "Limited",
          },
          {
            name: "Institutional income per academic staff",
            description:
              "PPP-adjusted institutional income divided by academic staff; a proxy for infrastructure and facilities",
            weight: "2.5%",
            performance: "No data - income, infrastructure spend, and PPP-adjusted figures are not in the SIS dataset",
            score: 0,
            status: "No data",
          },
        ],
      },
      {
        id: "research-environment",
        shortLabel: "Research env.",
        name: "Research environment (volume, income and reputation)",
        points: 29,
        weightLabel: "29%",
        readiness: 7,
        indicators: [
          {
            name: "Research reputation",
            description:
              "Reputation for research excellence from the same global Academic Reputation Survey used in the World University Rankings (not a region-only survey)",
            weight: "18%",
            performance: "No data - no survey presence; institution is not yet globally known for research",
            score: 0,
            status: "No data",
          },
          {
            name: "Research productivity",
            description:
              "Scopus-indexed publications per scholar, scaled for size and weighted by subject, including credit for papers in subjects where the university declares no staff",
            weight: "5.5%",
            performance: "6 active research dissertations (health, CS, engineering); journal publications not yet confirmed as Scopus-indexed",
            score: 0,
            status: "No data",
          },
          {
            name: "Research income per academic staff",
            description:
              "Research income scaled against academic staff, PPP-adjusted, and normalised for subject mix",
            weight: "5.5%",
            performance: "No data - research grant and income records are not in the institutional dataset",
            score: 0,
            status: "No data",
          },
        ],
      },
      {
        id: "research-quality",
        shortLabel: "Research quality",
        name: "Research quality (research strength, excellence and influence)",
        points: 30,
        weightLabel: "30%",
        readiness: 0,
        indicators: [
          {
            name: "Research strength",
            description:
              "75th percentile field-weighted citation impact (FWCI) of the institution's papers; Elsevier Scopus publications 2020–2024, citations 2020–2025",
            weight: "15%",
            performance: "No data - no Scopus citation records; 75th-percentile FWCI cannot be calculated",
            score: 0,
            status: "No data",
          },
          {
            name: "Research excellence",
            description:
              "Publications in the worldwide top 10% by FWCI, adjusted by year, subject, and academic/research staff",
            weight: "7.5%",
            performance: "Requires Scopus-indexed papers in the global top 10% FWCI - none confirmed",
            score: 0,
            status: "No data",
          },
          {
            name: "Research influence",
            description:
              "Importance of publications based on the importance of citing papers, adjusted by year, subject, and staff numbers",
            weight: "7.5%",
            performance: "No citation-network data available until publications are indexed",
            score: 0,
            status: "No data",
          },
        ],
      },
      {
        id: "international",
        shortLabel: "International",
        name: "International outlook (staff, students and research)",
        points: 7.5,
        weightLabel: "7.5%",
        readiness: 35,
        indicators: [
          {
            name: "Proportion of international students",
            description:
              "FTE international students divided by FTE students; country-population normalised so large countries are not disadvantaged",
            weight: "2.5%",
            performance: "35.1% international students (13 of 37) across 10 nationalities - strong Pan-African mix",
            score: 72,
            status: "Good",
          },
          {
            name: "Proportion of international staff",
            description: "FTE international academic staff divided by FTE staff; also country-population normalised",
            weight: "2.5%",
            performance: "All 15 named instructors appear local; international faculty cannot be distinguished from the dataset",
            score: 22,
            status: "Limited",
          },
          {
            name: "International co-authorship",
            description:
              "Share of research journal publications with at least one international co-author, subject-weighted, over the same five-year window as research quality",
            weight: "2.5%",
            performance: "Multi-national student body could support collaboration; no co-authorship data on indexed papers",
            score: 10,
            status: "Limited",
          },
          {
            name: "Study abroad",
            description:
              "International learning opportunities for domestic students. Currently weighted at 0% until THE is satisfied with data quality",
            weight: "0%",
            performance: "Not scored in the current methodology - no outbound mobility records in the SIS",
            score: 0,
            status: "Not applicable",
          },
        ],
      },
      {
        id: "industry",
        shortLabel: "Industry",
        name: "Industry (income and patents)",
        points: 4,
        weightLabel: "4%",
        readiness: 0,
        indicators: [
          {
            name: "Industry income per academic staff",
            description:
              "PPP-adjusted research income from industry, scaled against academic staff - a knowledge-transfer measure",
            weight: "2%",
            performance: "No data - no industry research-income or partnership records in the dataset",
            score: 0,
            status: "No data",
          },
          {
            name: "Patents",
            description:
              "Patents from any source that cite the university's research (new to THE Arab in 2026). Elsevier data, patents published 2020–2024; subject-weighted and scaled for size",
            weight: "2%",
            performance: "No patent or patent-citation records in the institutional dataset",
            score: 0,
            status: "No data",
          },
        ],
      },
    ],
  },
];

function buildRankingTabs(systems) {
  const tabs = [];
  const groups = {};
  for (const system of systems) {
    if (!system.group) {
      tabs.push({
        type: "single",
        id: system.id,
        tabLabel: system.tabLabel,
        badgeColor: system.badgeColor,
        systems: [system],
      });
      continue;
    }
    if (!groups[system.group]) {
      const tab = {
        type: "group",
        id: system.group,
        tabLabel: system.groupLabel || "Arab Rankings",
        badgeColor: system.groupColor || system.badgeColor,
        systems: [],
      };
      groups[system.group] = tab;
      tabs.push(tab);
    }
    groups[system.group].systems.push(system);
  }
  return tabs;
}

function getRatioNote(ratio) {
  if (ratio === "N/A") return "";
  const numericRatio = parseFloat(String(ratio).split(":")[0]);
  if (numericRatio < 5) return "world-class";
  if (numericRatio < 10) return "very low";
  if (numericRatio < 15) return "good";
  return "moderate";
}

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
  const rankingTabs = useMemo(() => {
    const systems = withInstitutionDomains(RANKING_SYSTEMS, {
      domains: user?.institution_domains || [],
      primaryDomain: user?.institution_primary_domain || null,
      liveAssessment: visibilityLive,
    });
    return buildRankingTabs(systems);
  }, [user?.institution_domains, user?.institution_primary_domain, visibilityLive]);

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

    const ws = new WebSocket("ws://localhost:8000/ws/rankings");

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
              {institutionName} - Global ranking indicators
            </Typography>
            <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
              Academic Year {institutionalData.academicYear} · {institutionalData.semester} · Based on institutional data from the LMS/SIS
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1.5} className="no-print">
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

function parseWeightPercent(weight) {
  if (!weight || !String(weight).includes("%")) return null;
  const n = parseFloat(weight);
  return Number.isFinite(n) ? n : null;
}

function parseWeightPoints(weight) {
  if (!weight) return null;
  const match = String(weight).match(/([\d.]+)\s*pts?/i);
  return match ? parseFloat(match[1]) : null;
}

function indicatorWeight(indicator) {
  const pct = parseWeightPercent(indicator?.weight);
  if (pct != null) return pct;
  const pts = parseWeightPoints(indicator?.weight);
  if (pts != null) return pts;
  return 1;
}

function effectiveScore(indicator) {
  if (!indicator) return 0;
  if (indicator.status === "No data" || indicator.status === "Not applicable") return 0;
  const n = Number(indicator.score);
  return Number.isFinite(n) ? n : 0;
}

function weightedReadiness(indicators = []) {
  let weightSum = 0;
  let scored = 0;
  for (const indicator of indicators) {
    const weight = indicatorWeight(indicator);
    if (!weight) continue;
    weightSum += weight;
    scored += effectiveScore(indicator) * weight;
  }
  if (!weightSum) return 0;
  return Math.round(scored / weightSum);
}

function systemReadiness(system) {
  const items = system.criteria?.length
    ? system.criteria.flatMap((criterion) => criterion.indicators || [])
    : system.indicators || [];
  return weightedReadiness(items);
}

function formatScorePct(score) {
  const n = Math.round(Number(score) || 0);
  return n === 0 ? "0%" : `~${n}%`;
}

function contributionFor(indicator) {
  const score = effectiveScore(indicator);
  const pct = parseWeightPercent(indicator?.weight);
  if (pct != null) {
    return { value: (score / 100) * pct, scaleLabel: `${pct}% weight`, score };
  }
  const pts = parseWeightPoints(indicator?.weight);
  if (pts != null) {
    return { value: (score / 100) * pts, scaleLabel: `${pts} pts`, score };
  }
  return null;
}

function scoreInterpretation(score, status) {
  if (status === "Not applicable") {
    return "This indicator does not currently apply to the institution.";
  }
  if (status === "No data") {
    return "Score is 0% because the required evidence is not in the SIS/LMS or the relevant external index. This is not a ranking-agency result - the indicator cannot be scored until the data exists.";
  }
  if (status === "Limited") {
    return "Some relevant records exist, but coverage is still incomplete relative to how this indicator is measured.";
  }
  if (status === "Good" || status === "Excellent") {
    return "Institutional data already supports a strong position on this indicator relative to typical ranking requirements.";
  }
  if (score >= 60) return "Readiness is relatively strong on this indicator.";
  if (score >= 40) return "Readiness is moderate; targeted evidence or output would move this score.";
  return "Readiness is currently low on this indicator.";
}

function defaultActions(indicator) {
  if (indicator.status === "Excellent" || indicator.status === "Good") {
    return ["Keep current records complete and refresh them each ranking cycle."];
  }
  if (indicator.status === "Not applicable") {
    return ["Revisit this indicator if the institution's mission or programme mix changes."];
  }
  if (indicator.status === "No data") {
    return [
      `Capture evidence for "${indicator.name}" in SIS/LMS or the relevant external index.`,
      "Assign an owner to update this indicator before the next ranking cycle.",
    ];
  }
  return [
    "Close the remaining data gaps noted in the current assessment.",
    "Document evidence so it can be reused across ranking frameworks that share this metric.",
  ];
}

function resolveDetail(indicator) {
  const custom = indicator.detail || {};
  return {
    source: custom.source || indicator.description,
    evidence: custom.evidence?.length
      ? custom.evidence
      : [{ label: "Current assessment", value: indicator.performance }],
    gaps:
      custom.gaps ||
      (indicator.status === "Excellent" || indicator.status === "Good" || indicator.status === "Not applicable"
        ? []
        : ["Evidence is incomplete relative to the ranking's published definition of this indicator."]),
    actions: custom.actions || defaultActions(indicator),
    factors: custom.factors || [],
  };
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
        {label || `~${value}%`}
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

function RankingMethodologyDialog({ type, open, onClose }) {
  if (type === "the") return <TheMethodologyDialog open={open} onClose={onClose} />;
  if (type === "ssa") return <SsaMethodologyDialog open={open} onClose={onClose} />;
  if (type === "the-arab") return <TheArabMethodologyDialog open={open} onClose={onClose} />;
  if (type === "webometrics") return <WebometricsMethodologyDialog open={open} onClose={onClose} />;
  if (type === "aur") return <AurMethodologyDialog open={open} onClose={onClose} />;
  if (type === "arwu") return <ArwuMethodologyDialog open={open} onClose={onClose} />;
  if (type === "qs") return <QsMethodologyDialog open={open} onClose={onClose} />;
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
              bgcolor: `${ST.colors.success}10`,
              borderColor: ST.colors.success,
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
        border: `2px solid ${badgeColor}`,
        bgcolor: `${badgeColor}12`,
        boxShadow: `0 8px 24px ${badgeColor}22`,
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
            sx={{ color: badgeColor, fontWeight: 800, letterSpacing: 1.1, display: "block" }}
          >
            Overall readiness
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ color: ST.colors.textPrimary, lineHeight: 1.1 }}>
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
                  {criterion.shortLabel}
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
                    <TableRow sx={{ bgcolor: "#FFF8E1" }}>
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
  if (score >= 60) return "#4CAF50";
  if (score >= 40) return "#FFA726";
  if (score >= 20) return "#FF7043";
  return "#EF5350";
}
