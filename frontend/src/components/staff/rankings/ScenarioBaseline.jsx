"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Slider from "@mui/material/Slider";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { ST } from "@/lib/staffTheme";
import { IAQRI_SCENARIO_DRIVERS } from "@/lib/rankings/readiness";
import { emptyScenario, projectScenario, scenarioIsEmpty } from "@/lib/rankings/executive";
import { MutedNote, ReadinessBar, SectionCard, StatTile } from "./ui";

/** Small outlined code tag, e.g. "TLR", shown next to the full pillar name. */
function PillarCode({ code }) {
  return (
    <Box
      component="span"
      sx={{
        px: 0.6,
        py: 0.1,
        border: `1px solid ${ST.colors.border}`,
        borderRadius: 0.75,
        fontSize: 11,
        fontWeight: 700,
        color: ST.colors.textSecondary,
        lineHeight: 1.4,
        flexShrink: 0,
      }}
    >
      {code}
    </Box>
  );
}

function baselineItems(d) {
  if (!d) return [];
  return [
    { label: "Total students", value: d.totalStudents, caption: d.totalStudentsBreakdown },
    { label: "International students", value: d.internationalStudents, caption: d.internationalStudentsCount },
    { label: "Female students", value: d.femaleRatio, caption: d.femaleCount },
    { label: "Average GPA", value: d.avgGPA, caption: "institution-wide" },
    { label: "Faculty (instructors)", value: d.faculty, caption: d.facultySchools },
    { label: "Student : faculty ratio", value: d.studentFacultyRatio, caption: d.ratioNote },
    { label: "Research students", value: d.researchStudents, caption: d.researchBreakdown },
    { label: "Nationalities", value: d.activeNationalities, caption: d.nationalitiesRegion },
  ];
}

function Baseline({ data }) {
  return (
    <Grid container spacing={1.5}>
      {baselineItems(data).map((item) => (
        <Grid item xs={6} sm={4} md={3} key={item.label}>
          <StatTile label={item.label} value={item.value ?? "-"} caption={item.caption} />
        </Grid>
      ))}
    </Grid>
  );
}

function Methodology() {
  return (
    <Box sx={{ "& p": { mb: 1.25 } }}>
      <Typography variant="body2" component="p">
        Readiness is an estimate of how well current institutional evidence covers each framework&apos;s published
        indicators, weighted the way that framework weights them. It is not a predicted rank or an official score.
      </Typography>
      <Typography variant="body2" component="p">
        NAAC and NIRF are scored live from the SIS/LMS data feed. Other frameworks use a fixed evidence review until
        they are connected to live sources. Indicators that need external data (Scopus, Web of Science, employer and
        reputation surveys) show &quot;No data&quot; until that evidence exists, and count as 0%.
      </Typography>
      <Typography variant="body2" component="p">
        Where commercial indexing is unavailable, open bibliometric sources such as OpenAlex (250M+ scholarly works,
        free DOI-level citation tracking) can evidence research output.
      </Typography>
    </Box>
  );
}

function ScenarioResultsTable({ results }) {
  return (
    <Table size="small" sx={{ "& td, & th": { borderColor: ST.colors.border } }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 600, color: ST.colors.textSecondary }}>NIRF pillar (National Institutional Ranking Framework)</TableCell>
          <TableCell sx={{ fontWeight: 600, color: ST.colors.textSecondary }} align="right">
            Today
          </TableCell>
          <TableCell sx={{ fontWeight: 600, color: ST.colors.textSecondary }} align="right">
            Projected
          </TableCell>
          <TableCell sx={{ fontWeight: 600, color: ST.colors.textSecondary }} align="right">
            Change
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {results.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
                <Typography variant="body2" fontWeight={600}>
                  {r.fullName}
                </Typography>
                <PillarCode code={r.label} />
              </Box>
            </TableCell>
            <TableCell align="right">{r.base}%</TableCell>
            <TableCell align="right">{r.projected}%</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              {r.delta > 0 ? `+${r.delta}` : r.delta} pts
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ScenarioPlanner({ nirfSystem, values, onChange }) {
  const results = projectScenario(nirfSystem, values);
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            columnGap: 3,
            rowGap: 1,
          }}
        >
          {IAQRI_SCENARIO_DRIVERS.map((d) => (
            <Box key={d.key}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {d.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {values[d.key]}
                  {d.suffix || ""}
                </Typography>
              </Box>
              <Slider
                size="small"
                value={values[d.key]}
                min={0}
                max={d.max}
                step={1}
                onChange={(_, v) => onChange({ ...values, [d.key]: v })}
                aria-label={d.label}
                sx={{ color: ST.colors.primary }}
              />
            </Box>
          ))}
        </Box>
        <Button
          size="small"
          onClick={() => onChange(emptyScenario())}
          disabled={scenarioIsEmpty(values)}
          sx={{ textTransform: "none", mt: 0.5 }}
        >
          Reset scenario
        </Button>
      </Grid>
      <Grid item xs={12} md={5}>
        <Typography variant="subtitle2" fontWeight={700}>
          Projected NIRF pillar scores
        </Typography>
        <MutedNote sx={{ mb: 1.5 }}>NIRF: National Institutional Ranking Framework (India)</MutedNote>
        {results.map((r) => (
          <Box key={r.id} sx={{ mb: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={r.fullName}>
                  {r.fullName}
                </Typography>
                <PillarCode code={r.label} />
              </Box>
              <MutedNote sx={{ whiteSpace: "nowrap" }}>
                Today {r.base}%{r.delta ? ` · ${r.delta > 0 ? "+" : ""}${r.delta} pts` : ""}
              </MutedNote>
            </Box>
            <ReadinessBar value={r.projected} height={6} />
          </Box>
        ))}
        <MutedNote sx={{ mt: 1 }}>
          Bars show the projected score. Illustrative estimates using the same weighting as the NIRF scores, not a
          forecast.
        </MutedNote>
      </Grid>
    </Grid>
  );
}

export default function ScenarioBaseline({
  institutionalData,
  nirfSystem,
  scenario,
  onScenarioChange,
  printMode = false,
}) {
  const tabs = [
    { id: "baseline", label: "Institutional baseline" },
    ...(nirfSystem ? [{ id: "scenario", label: "Scenario planner (NIRF, India)" }] : []),
    { id: "method", label: "Methodology" },
  ];
  const [tab, setTab] = useState("baseline");
  const active = tabs.some((t) => t.id === tab) ? tab : "baseline";

  if (printMode) {
    return (
      <SectionCard number="4 · Context" title="Scenario & baseline">
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Institutional baseline
        </Typography>
        <Baseline data={institutionalData} />
        {nirfSystem && (
          <Box sx={{ mt: 3, breakInside: "avoid" }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Scenario results (NIRF)
            </Typography>
            {scenarioIsEmpty(scenario) ? (
              <MutedNote>No scenario was modelled for this report.</MutedNote>
            ) : (
              <>
                <MutedNote sx={{ mb: 1 }}>
                  Assumptions:{" "}
                  {IAQRI_SCENARIO_DRIVERS.filter((d) => scenario[d.key] > 0)
                    .map((d) => `${d.label} ${scenario[d.key]}${d.suffix || ""}`)
                    .join(" · ")}
                </MutedNote>
                <ScenarioResultsTable results={projectScenario(nirfSystem, scenario)} />
              </>
            )}
          </Box>
        )}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Methodology
          </Typography>
          <Methodology />
        </Box>
      </SectionCard>
    );
  }

  return (
    <SectionCard number="4 · Context" title="Scenario & baseline">
      <Tabs
        value={active}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          minHeight: 40,
          borderBottom: `1px solid ${ST.colors.border}`,
          "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 40 },
          "& .MuiTabs-indicator": { bgcolor: ST.colors.primary },
        }}
      >
        {tabs.map((t) => (
          <Tab key={t.id} value={t.id} label={t.label} />
        ))}
      </Tabs>
      {active === "baseline" && <Baseline data={institutionalData} />}
      {active === "scenario" && nirfSystem && (
        <ScenarioPlanner nirfSystem={nirfSystem} values={scenario} onChange={onScenarioChange} />
      )}
      {active === "method" && <Methodology />}
    </SectionCard>
  );
}
