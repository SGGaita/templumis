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
  CircularProgress,
  Button,
  GlobalStyles,
  Tooltip,
  Tabs,
  Tab,
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
        .ranking-tab-panel {
          display: block !important;
          page-break-inside: avoid;
          margin-bottom: 24px;
        }
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
    subtitle: "Web presence & openness",
    overallReadiness: 22,
    indicators: [
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
            performance: "No data — institution is not yet visible in the global teaching-reputation survey",
            score: 8,
            status: "No data",
          },
          {
            name: "Staff-to-student ratio",
            description: "Academic staff relative to student headcount",
            weight: "4.5%",
            performance: "SFR = 2.5:1 (15 instructors / 37 students) — well within top-tier global teaching-capacity benchmarks",
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
            performance: "No data — income, infrastructure spend, and PPP-adjusted figures are not in the SIS dataset",
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
              "University reputation for research excellence among peers, from the annual Academic Reputation Survey — the largest indicator in this pillar",
            weight: "18%",
            performance: "No data — no survey presence; institution is not yet globally known for research",
            score: 8,
            status: "No data",
          },
          {
            name: "Research income",
            description:
              "Research income scaled against academic staff, adjusted for PPP, and normalised for subject mix (science grants are typically larger than those in social sciences, arts, and humanities)",
            weight: "5.5%",
            performance: "No data — research grant and income records are not in the institutional dataset",
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
            performance: "No data — no Scopus citation records in the institutional dataset",
            score: 3,
            status: "No data",
          },
          {
            name: "Research strength",
            description: "75th percentile of field-weighted citation impact (added in 2023)",
            weight: "5%",
            performance: "Requires indexed, cited output — none confirmed",
            score: 3,
            status: "No data",
          },
          {
            name: "Research excellence",
            description:
              "Number of publications in the worldwide top 10% by field-weighted citation impact, normalised by year, subject, and staff numbers (added in 2023)",
            weight: "5%",
            performance: "Requires Scopus-indexed papers in the global top 10% FWCI — none confirmed",
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
            performance: "35.1% international students (13 of 37) across 10 nationalities — strong Pan-African mix",
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
            performance: "Not scored in the current methodology — no outbound mobility records in the SIS",
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
              "Research income from industry (PPP-adjusted) scaled against academic staff — a measure of knowledge transfer and the ability to attract commercial funding",
            weight: "2%",
            performance: "No data — no industry research-income or partnership records in the dataset",
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
            performance: "SFR = 2.5:1 (15 instructors / 37 students) — world-class teaching capacity",
            score: 88,
            status: "Excellent",
          },
          {
            name: "Finance per student",
            description: "Institutional spending relative to student numbers",
            weight: "3%",
            performance: "No data — per-student finance figures are not in the SIS dataset",
            score: 5,
            status: "No data",
          },
          {
            name: "Funding sources",
            description: "Diversity and composition of institutional funding",
            weight: "4%",
            performance: "No data — funding-mix records are not in the institutional dataset",
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
    indicators: [
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
    ],
  },
  {
    id: "qs",
    badge: "QS",
    badgeColor: "#00BCD4",
    tabLabel: "QS",
    title: "QS World University Rankings 2024",
    subtitle: "Nine performance lenses · 1,500 institutions · 100%",
    overallReadiness: 22,
    indicators: [
      {
        name: "Academic Reputation",
        description: "Global survey of academics on teaching and research quality — the largest QS lens",
        weight: "30%",
        performance: "No data — no survey presence; institution is not yet globally known among academics",
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
        performance: "2.5:1 ratio (15 instructors / 37 students) — well within top-tier global benchmarks (<10:1 is considered strong)",
        score: 88,
        status: "Excellent",
      },
      {
        name: "Citations per Faculty",
        description: "Research impact: Scopus citations of published papers, normalised for faculty size and subject mix",
        weight: "20%",
        performance: "No data — no Scopus citation records in the institutional dataset",
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
        performance: "35.1% international students (13 of 37) from 9 non-Kenyan countries — strong Pan-African mix",
        score: 72,
        status: "Good",
      },
      {
        name: "International Research Network",
        description:
          "Richness and diversity of international research partnerships (introduced in the 2024 20th edition)",
        weight: "5%",
        performance: "Multi-national student body could support partnerships; no documented international co-authorship or research-network index",
        score: 10,
        status: "Limited",
      },
      {
        name: "Employment Outcomes",
        description:
          "Employability of graduates: employment rate and alumni impact (introduced at 5% in the 2024 edition)",
        weight: "5%",
        performance: "5 graduates across nursing, biochemistry, engineering, economics, and law — no employment or alumni-outcome tracking",
        score: 20,
        status: "Limited",
      },
      {
        name: "Sustainability",
        description:
          "How the institution tackles environmental and social issues (introduced at 5% in the 2024 edition)",
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
    ],
  },
  {
    id: "aur",
    badge: "AUR",
    badgeColor: "#007A3D",
    tabLabel: "Arab Rankings",
    title: "Arab University Rankings",
    subtitle: "Four criteria · 36 indicators · 1,000 points",
    overallReadiness: 16,
    totalWeightLabel: "1,000 points",
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
              "SFR = 2.5:1 (15 instructors / 37 students) — well above typical 1:15–1:20 teaching-capacity benchmarks",
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
            performance: "Requires indexed, cited output — none confirmed",
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
            performance: "Requires indexed SDG 9 publications — none confirmed",
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
            performance: "Requires scholarly output and patent citations — neither is recorded",
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
            performance: "35.1% international students (13 of 37) across 10 nationalities — strong Pan-African mix",
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
            name: "Open Science — resources open to non-affiliates",
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
];

export default function UniversityRankingsPage() {
  const [loading, setLoading] = useState(true);
  const [institutionalData, setInstitutionalData] = useState(null);
  const [institutionId, setInstitutionId] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [rankingTab, setRankingTab] = useState(0);

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
          {RANKING_SYSTEMS.map((system) => (
            <Tab
              key={system.id}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: system.badgeColor,
                      flexShrink: 0,
                    }}
                  />
                  {system.tabLabel}
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ color: ST.colors.textSecondary, fontWeight: 600 }}
                  >
                    ~{system.overallReadiness}%
                  </Typography>
                </Box>
              }
            />
          ))}
        </Tabs>

        {RANKING_SYSTEMS.map((system, index) => (
          <Box
            key={system.id}
            className="ranking-tab-panel"
            sx={{
              display: rankingTab === index ? "block" : "none",
              "@media print": { display: "block" },
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
              embedded
            />
          </Box>
        ))}
      </Paper>

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
                <strong>International students</strong> — 35.1% from 10 nationalities scores well on QS and THE
                diversity indicators
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                <strong>Gender equity</strong> — 48.6% female enrolment and 50% female among research students is
                strong for CWTS Leiden's PP(gender) metric and THE Africa's female-graduates indicator
              </Typography>
              <Typography component="li" variant="body2">
                <strong>THE Africa student engagement</strong> is the strongest SSA pillar (~45% readiness): faculty
                access at 2.5:1, course quality (GPA 3.32), and applied African research topics. Overall SSA readiness
                is ~28% because finance, facilities, accessibility, ethics, and citation metrics still lack data
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
                <strong>Start tracking graduate employment outcomes</strong> → unlocks QS Employment Outcomes (5%) and
                Employer Reputation
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function IndicatorStatusChip({ status }) {
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
      }}
    />
  );
}

function IndicatorRows({ indicators }) {
  return indicators.map((indicator, index) => (
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
        <IndicatorStatusChip status={indicator.status} />
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
  ));
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
        <TableCell sx={{ fontWeight: 600, width: "40%" }}>TemplumIS performance</TableCell>
        <TableCell sx={{ fontWeight: 600, width: "25%" }}>Score estimate</TableCell>
      </TableRow>
    </TableHead>
  );
}

// Ranking Card Component
function criterionWeightLabel(criterion) {
  if (criterion.weightLabel) return criterion.weightLabel;
  if (criterion.points != null) return `${criterion.points} pts`;
  return "";
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
  embedded,
}) {
  const [criterionTab, setCriterionTab] = useState(0);
  const hasCriteria = Array.isArray(criteria) && criteria.length > 0;
  const Wrapper = embedded ? Box : Paper;

  return (
    <Wrapper sx={{ overflow: "hidden" }}>
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
                    <IndicatorRows indicators={criterion.indicators} />
                    <TableRow sx={{ bgcolor: "#FFF8E1" }}>
                      <TableCell colSpan={2}>
                        <Typography variant="body2" fontWeight={700}>
                          Total
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ color: badgeColor }}>
                          {criterionWeightLabel(criterion)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <ReadinessBar
                          value={criterion.readiness}
                          color={badgeColor}
                          height={8}
                          label={`~${criterion.readiness}% criterion readiness`}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
          <Box sx={{ px: 2, py: 2, bgcolor: `${badgeColor}08`, borderTop: `1px solid ${ST.colors.border}` }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
              <Typography variant="body2" fontWeight={700}>
                {badge} overall readiness{totalWeightLabel ? ` · ${totalWeightLabel}` : ""}
              </Typography>
              <Box sx={{ minWidth: 220, flex: 1, maxWidth: 360 }}>
                <ReadinessBar value={overallReadiness} color={badgeColor} />
              </Box>
            </Box>
          </Box>
        </>
      ) : (
        <TableContainer>
          <Table size="small">
            <IndicatorTableHead />
            <TableBody>
              <IndicatorRows indicators={indicators || []} />
              <TableRow sx={{ bgcolor: `${badgeColor}08` }}>
                <TableCell colSpan={3}>
                  <Typography variant="body2" fontWeight={700}>
                    {badge} overall readiness
                  </Typography>
                </TableCell>
                <TableCell>
                  <ReadinessBar value={overallReadiness} color={badgeColor} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
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
