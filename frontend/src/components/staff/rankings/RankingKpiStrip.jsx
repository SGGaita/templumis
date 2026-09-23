"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { ST } from "@/lib/staffTheme";
import { frameworkMeta } from "@/lib/rankings/catalog";
import { criterionTitle, pct, rankPriorities, systemIndicators } from "@/lib/rankings/readiness";
import { buildExecutiveSummary, frameworkRows } from "@/lib/rankings/executive";

function Kpi({ label, value, caption }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: ST.colors.textSecondary, fontWeight: 600, display: "block" }}>
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: ST.colors.textPrimary, mt: 0.25, fontVariantNumeric: "tabular-nums" }}
        noWrap
      >
        {value}
      </Typography>
      {caption && (
        <Typography
          variant="caption"
          sx={{ color: ST.colors.textSecondary, display: "block" }}
          noWrap
          title={typeof caption === "string" ? caption : undefined}
        >
          {caption}
        </Typography>
      )}
    </Box>
  );
}

function Group({ title, children }) {
  return (
    <Box sx={{ height: "100%" }}>
      <Typography
        variant="overline"
        sx={{ color: ST.colors.textSecondary, fontWeight: 700, letterSpacing: 0.8, display: "block", mb: 1 }}
        noWrap
      >
        {title}
      </Typography>
      <Grid container spacing={2}>
        {children.map((child, i) => (
          <Grid item xs={6} sm={3} key={i}>
            {child}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

/**
 * Ranking KPIs for the framework page:
 *  - left: across every framework the institution has enabled
 *  - right: the framework open in the tabs below (updates as tabs change)
 */
export default function RankingKpiStrip({ systems, selectedSystem }) {
  const overall = useMemo(() => {
    const priorities = rankPriorities(systems);
    const rows = frameworkRows(systems, priorities);
    return { rows, summary: buildExecutiveSummary(rows, priorities) };
  }, [systems]);

  const selected = useMemo(() => {
    if (!selectedSystem) return null;
    const row = overall.rows.find((r) => r.id === selectedSystem.id);
    if (!row) return null;
    const indicators = systemIndicators(selectedSystem).map((x) => x.indicator);
    const withEvidence = indicators.filter((i) => i.status !== "No data" && i.status !== "Not applicable").length;
    return { row, withEvidence, total: indicators.length };
  }, [overall.rows, selectedSystem]);

  const { summary, rows } = overall;
  if (!summary) return null;

  const selectedLabel = selected ? frameworkMeta(selected.row.id)?.label || selected.row.fullLabel : "";

  return (
    <Paper
      elevation={0}
      sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, p: { xs: 2, md: 2.5 }, mb: 2 }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Group title={`All your frameworks · ${rows.length}`}>
            {[
              <Kpi key="avg" label="Average readiness" value={pct(summary.average)} caption={`across ${rows.length} frameworks`} />,
              <Kpi key="best" label="Strongest" value={pct(summary.strongest.readiness)} caption={summary.strongest.label} />,
              <Kpi key="worst" label="Weakest" value={pct(summary.weakest.readiness)} caption={summary.weakest.label} />,
              <Kpi key="gaps" label="Open gaps" value={summary.gapCount} caption={`${summary.highGapCount} high-weight`} />,
            ]}
          </Group>
        </Grid>
        {selected && (
          <Grid
            item
            xs={12}
            lg={6}
            sx={{
              borderLeft: { lg: `1px solid ${ST.colors.border}` },
              borderTop: { xs: `1px solid ${ST.colors.border}`, lg: "none" },
              pt: { xs: "24px !important", lg: undefined },
            }}
          >
            <Box sx={{ pl: { lg: 1 } }}>
              <Group title={`Selected framework · ${selectedLabel}`}>
                {[
                  <Kpi key="r" label="Readiness" value={pct(selected.row.readiness)} caption={`${rows.indexOf(selected.row) + 1} of ${rows.length} by readiness`} />,
                  <Kpi
                    key="e"
                    label="With evidence"
                    value={`${selected.withEvidence}/${selected.total}`}
                    caption={selected.total ? pct((selected.withEvidence / selected.total) * 100) : "-"}
                  />,
                  <Kpi key="g" label="Open gaps" value={selected.row.gapCount} caption={`${selected.row.highGapCount} high-weight`} />,
                  <Kpi
                    key="w"
                    label={selected.row.weakest ? "Weakest criterion" : "Biggest gap"}
                    value={
                      selected.row.weakest
                        ? pct(selected.row.weakest.readiness)
                        : selected.row.topGap
                          ? pct(selected.row.topGap.score)
                          : "-"
                    }
                    caption={selected.row.weakest ? criterionTitle(selected.row.weakest) : selected.row.topGap?.name}
                  />,
                ]}
              </Group>
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
