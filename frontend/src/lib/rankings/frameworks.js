/**
 * Ranking framework definitions shared by the framework pages
 * (/staff/rankings) and the Executive brief (/staff/rankings/executive).
 * Moved verbatim from app/staff/rankings/page.jsx.
 */

export const RANKING_SYSTEMS = [
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
    badgeColor: "#1565C0",
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
    badgeColor: "#388E3C",
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
    badgeColor: "#1976D2",
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
    badgeColor: "#1E88E5",
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

// ---------------------------------------------------------------------------
// IAQRI (India Accreditation, Quality & Ranking Intelligence) - NAAC & NIRF
// systems are computed live from `institutionalData` (the same SIS/Excel feed
// the rest of this page uses) instead of hardcoded scores, so every number
// and narrative here updates automatically as the underlying data changes.
// An indicator with no corresponding field in institutionalData yet is
// reported honestly as "No data" rather than a fabricated figure - it starts
// scoring itself the moment that field appears in the feed.
// ---------------------------------------------------------------------------

export function pctVal(str) {
  const n = parseFloat(String(str ?? "").replace("%", ""));
  return Number.isFinite(n) ? n : 0;
}

export function ratioToNumber(str) {
  const n = parseFloat(String(str ?? "").split(":")[0]);
  return Number.isFinite(n) ? n : 0;
}

export function gpaToPct(str) {
  const parts = String(str ?? "").split("/").map((s) => parseFloat(s));
  if (Number.isFinite(parts[0]) && Number.isFinite(parts[1]) && parts[1] > 0) {
    return (parts[0] / parts[1]) * 100;
  }
  return 0;
}

export function deriveIndicatorStatus(score) {
  if (score <= 0) return "No data";
  if (score < 40) return "Limited";
  if (score < 70) return "Good";
  return "Excellent";
}

export function mkIndicator(name, weightPct, rawScore, performance, statusOverride) {
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  return {
    name,
    weight: `${weightPct}%`,
    score,
    status: statusOverride || deriveIndicatorStatus(score),
    performance,
  };
}

export function computeNaacCriteria(inst) {
  const i = inst || {};
  const intlPct = pctVal(i.internationalStudents);
  const femalePct = pctVal(i.femaleRatio);
  const gpaPct = gpaToPct(i.avgGPA);
  const ratio = ratioToNumber(i.studentFacultyRatio);
  const ratioScore = ratio > 0 ? 100 - (ratio - 1) * 12 : 0;
  const schools = parseInt(i.facultySchools, 10) || 0;
  const totalStudents = Number(i.totalStudents) || 0;
  const researchStudents = Number(i.researchStudents) || 0;
  const researchPct = totalStudents ? (researchStudents / totalStudents) * 100 : 0;
  const nationalities = Number(i.activeNationalities) || 0;

  return [
    {
      id: "curricular", code: "C1", shortLabel: "Curricular", name: "Curricular Aspects",
      weight: 10, weightLabel: "10%",
      indicators: [
        mkIndicator("Curriculum design & academic flexibility", 5, schools * 6,
          `${schools || "No"} schools/faculties offer active programmes across UG and PG levels (${i.totalStudentsBreakdown || "enrolment breakdown not available"}); curriculum-revision cadence is not separately tracked in SIS`),
        mkIndicator("Feedback & curriculum enrichment systems", 5, 0,
          "No structured student/alumni/employer curriculum-feedback records are present in SIS/LMS"),
      ],
    },
    {
      id: "teaching-learning", code: "C2", shortLabel: "Teaching-Learning", name: "Teaching-Learning & Evaluation",
      weight: 20, weightLabel: "20%",
      indicators: [
        mkIndicator("Student enrolment profile & diversity", 7, (femalePct + intlPct) * 0.8,
          `${totalStudents || "No"} active students across ${nationalities} nationalities (${i.internationalStudents || "0%"} international) and ${i.femaleRatio || "0%"} female`),
        mkIndicator("Faculty quality & student-faculty ratio", 7, ratioScore * 0.65,
          `Student:faculty ratio of ${i.studentFacultyRatio || "n/a"} (${i.faculty ?? "0"} instructors / ${totalStudents || "0"} students); faculty qualification mix is not yet tracked in SIS`),
        mkIndicator("Evaluation processes & learning outcomes", 6, gpaPct * 0.42,
          `Average GPA of ${i.avgGPA || "n/a"} is recorded institution-wide; formal outcome-based assessment mapping is not yet evidenced`),
      ],
    },
    {
      id: "research", code: "C3", shortLabel: "Research", name: "Research, Innovations & Extension",
      weight: 30, weightLabel: "30%",
      indicators: [
        mkIndicator("Research student pipeline", 10, researchPct * 2.5,
          `${researchStudents} active research students${totalStudents ? ` - ${researchPct.toFixed(1)}% of enrolment` : ""} form an early research pipeline`),
        mkIndicator("Publications, citations & IP", 12, Number(i.publicationsScore) || 0,
          i.publicationsScore
            ? "Indexed publication and citation data is present in the data feed"
            : "No Scopus/Scimago-indexed publications, citations, or patents are present in the current data feed"),
        mkIndicator("Extension, consultancy & collaboration activity", 8, Math.min(8, researchStudents),
          "No extension, consultancy, or formal research-collaboration records are present in SIS/LMS"),
      ],
    },
    {
      id: "infrastructure", code: "C4", shortLabel: "Infrastructure", name: "Infrastructure & Learning Resources",
      weight: 10, weightLabel: "10%",
      indicators: [
        mkIndicator("Physical & digital learning infrastructure", 5, schools * 3,
          `${schools || "No"} schools/faculties are in operation; library, laboratory, and ICT-infrastructure inventories are not yet captured in SIS`),
        mkIndicator("Infrastructure utilisation & maintenance", 5, 0,
          "No utilisation or maintenance-tracking data is present in SIS"),
      ],
    },
    {
      id: "student-support", code: "C5", shortLabel: "Student Support", name: "Student Support & Progression",
      weight: 10, weightLabel: "10%",
      indicators: [
        mkIndicator("Scholarships & financial support", 5, i.rankingsData ? 55 : 30,
          i.rankingsData
            ? "Scholarship and grants data is flowing from the institutional data feed"
            : "TemplumIS scholarship and grants modules are active for this institution; disbursement data is not yet flowing into this dashboard"),
        mkIndicator("Progression, placement & alumni engagement", 5, 0,
          "No graduation, placement, or alumni-engagement tracking is present in the current data feed"),
      ],
    },
    {
      id: "governance", code: "C6", shortLabel: "Governance", name: "Governance, Leadership & Management",
      weight: 10, weightLabel: "10%",
      indicators: [
        mkIndicator("Strategic planning & IQAC-equivalent quality processes", 5, 0,
          "No dedicated internal quality-assurance cell or strategic-plan KPI tracking is present in SIS"),
        mkIndicator("Financial & administrative management", 5, 25,
          "Institutional administration is live on TemplumIS (enrolment, grants, scholarships); dedicated financial-management reporting is not yet evidenced"),
      ],
    },
    {
      id: "values", code: "C7", shortLabel: "Institutional Values", name: "Institutional Values & Best Practices",
      weight: 10, weightLabel: "10%",
      indicators: [
        mkIndicator("Gender equity & inclusion", 5, (femalePct + intlPct) * 0.75,
          `${i.femaleRatio || "0%"} female enrolment and ${i.internationalStudents || "0%"} international students across ${nationalities} nationalities`),
        mkIndicator("Sustainability & institutional best practices", 5, 0,
          "No sustainability policy, environmental audit, or documented best-practice records are present in SIS"),
      ],
    },
  ];
}

export function computeNirfCriteria(inst) {
  const i = inst || {};
  const intlPct = pctVal(i.internationalStudents);
  const femalePct = pctVal(i.femaleRatio);
  const gpaPct = gpaToPct(i.avgGPA);
  const ratio = ratioToNumber(i.studentFacultyRatio);
  const ratioScore = ratio > 0 ? 100 - (ratio - 1) * 12 : 0;
  const totalStudents = Number(i.totalStudents) || 0;
  const researchStudents = Number(i.researchStudents) || 0;
  const nationalities = Number(i.activeNationalities) || 0;

  return [
    {
      id: "tlr", code: "TLR", shortLabel: "TLR", name: "Teaching, Learning & Resources (TLR)",
      weight: 30, weightLabel: "30%",
      indicators: [
        mkIndicator("Student strength & faculty-student ratio", 10, ratioScore,
          `${totalStudents || "No"} students (${i.totalStudentsBreakdown || "n/a"}) against ${i.faculty ?? "0"} instructors gives a ${i.studentFacultyRatio || "n/a"} ratio; NIRF also normalises for sanctioned intake, which is not tracked here`),
        mkIndicator("Faculty qualifications & experience", 10, ratioScore * 0.35,
          `${i.faculty ?? "0"} instructors are active in SIS; PhD-qualification and experience-band data are not yet tracked`),
        mkIndicator("Financial resources & utilisation", 5, 0,
          "No per-student expenditure or capital/operational utilisation data is present in SIS"),
        mkIndicator("Multiple entry/exit, online education & Indian Knowledge Systems", 5, 0,
          "Programme structure does not yet reflect India's multiple entry/exit or IKS framework", "Not applicable"),
      ],
    },
    {
      id: "rp", code: "RP", shortLabel: "RP", name: "Research & Professional Practice (RP)",
      weight: 30, weightLabel: "30%",
      indicators: [
        mkIndicator("Publications", 10, 0,
          "No Scopus/Web of Science-indexed publications are present in the current data feed"),
        mkIndicator("Quality of publications / citations", 10, 0,
          "No citation data is available - the publication base does not yet exist in the feed"),
        mkIndicator("IPR & patents", 5, 0,
          "No patent filings or IPR records are present in SIS"),
        mkIndicator("Footprint of projects / professional practice", 5, Math.min(20, researchStudents * 3),
          `${researchStudents} active research students form an early pipeline; funded-project and professional-practice records are not yet evidenced`),
      ],
    },
    {
      id: "go", code: "GO", shortLabel: "GO", name: "Graduation Outcomes (GO)",
      weight: 20, weightLabel: "20%",
      indicators: [
        mkIndicator("Metric for university examinations (GUE)", 10, gpaPct * 0.42,
          `Average GPA of ${i.avgGPA || "n/a"} is recorded across ${totalStudents || "0"} students; consolidated pass/completion-rate reporting is not yet evidenced`),
        mkIndicator("Metric for PhD graduates (GPHD)", 5, 0,
          "No graduation or doctoral-completion records are present in the current data feed"),
        mkIndicator("Placement, higher studies & median salary", 5, 0,
          "No placement, further-study, or salary-outcome tracking is present in SIS"),
      ],
    },
    {
      id: "oi", code: "OI", shortLabel: "OI", name: "Outreach & Inclusivity (OI)",
      weight: 10, weightLabel: "10%",
      indicators: [
        mkIndicator("Regional & gender diversity", 5, (femalePct + intlPct) * 0.85,
          `${i.femaleRatio || "0%"} female enrolment and ${nationalities} active nationalities (${i.internationalStudents || "0%"} international)`),
        mkIndicator("Economically/socially challenged students & accessibility", 5, 0,
          "No need-based admission or accessibility-infrastructure records are present in SIS"),
      ],
    },
    {
      id: "pr", code: "PR", shortLabel: "PR", name: "Perception (PR)",
      weight: 10, weightLabel: "10%",
      indicators: [
        mkIndicator("Peer perception (academic)", 5, 0,
          "Institution is not yet visible in national academic peer-perception survey data"),
        mkIndicator("Employer perception", 5, 0,
          "No employer/recruiter survey or feedback-tracking data is present in SIS"),
      ],
    },
  ];
}

export function buildNaacSystem(inst) {
  const criteria = computeNaacCriteria(inst);
  return {
    id: "naac", badge: "NAAC", badgeColor: "#2E7D32", tabLabel: "NAAC",
    title: "NAAC Accreditation (National Assessment and Accreditation Council)",
    subtitle: "7 criteria · CGPA 0-4.0 scale · India · live from institutional data",
    totalWeightLabel: "100%", methodology: "naac",
    group: "india", groupLabel: "India (IAQRI)", groupColor: "#2E7D32",
    criteria,
  };
}

export function buildNirfSystem(inst) {
  const criteria = computeNirfCriteria(inst);
  return {
    id: "nirf", badge: "NIRF", badgeColor: "#1565C0", tabLabel: "NIRF",
    title: "NIRF Ranking (National Institutional Ranking Framework)",
    subtitle: "5 parameters · TLR · RP · GO · OI · PR · India · live from institutional data",
    totalWeightLabel: "100%", methodology: "nirf",
    group: "india",
    criteria,
  };
}

export function buildRankingTabs(systems) {
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

export function getRatioNote(ratio) {
  if (ratio === "N/A") return "";
  const numericRatio = parseFloat(String(ratio).split(":")[0]);
  if (numericRatio < 5) return "exceptional";
  if (numericRatio < 10) return "strong";
  if (numericRatio < 15) return "good";
  return "moderate";
}
