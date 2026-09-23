"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { ST } from "@/lib/staffTheme";
import { pct } from "@/lib/rankings/readiness";
import { MutedNote, SectionCard, StatTile, StatusChip } from "./ui";

export default function ExecutiveSummary({ summary, frameworkCount, printMode = false }) {
  if (!summary) return null;
  const { average, strongest, weakest, gapCount, highGapCount, headline, topPriorities } = summary;
  const single = frameworkCount === 1;
  // Print: four tiles in one row, priorities full width underneath.
  const left = printMode ? { xs: 12 } : { xs: 12, lg: 7 };
  const right = printMode ? { xs: 12 } : { xs: 12, lg: 5 };
  const tile = printMode ? { xs: 3 } : { xs: 6, md: 3, lg: 6 };
  const wideTile = printMode ? { xs: 6 } : { xs: 12, md: 6, lg: 12 };

  return (
    <SectionCard number="1 · Summary" title="Where we stand" subtitle={headline} sx={{ breakInside: "avoid" }}>
      <Grid container spacing={2}>
        <Grid item {...left}>
          <Grid container spacing={1.5}>
            <Grid item {...tile}>
              <StatTile
                label={single ? "Readiness" : "Average readiness"}
                value={pct(average)}
                caption={single ? strongest.label : `across ${frameworkCount} frameworks`}
              />
            </Grid>
            <Grid item {...tile}>
              <StatTile label="Open gaps" value={gapCount} caption={`${highGapCount} high-weight`} />
            </Grid>
            {!single && (
              <>
                <Grid item {...tile}>
                  <StatTile label="Strongest" value={pct(strongest.readiness)} caption={strongest.label} />
                </Grid>
                <Grid item {...tile}>
                  <StatTile label="Weakest" value={pct(weakest.readiness)} caption={weakest.label} />
                </Grid>
              </>
            )}
            {single && strongest.weakest && (
              <Grid item {...wideTile}>
                <StatTile
                  label="Weakest criterion"
                  value={pct(strongest.weakest.readiness)}
                  caption={strongest.weakest.name}
                />
              </Grid>
            )}
          </Grid>
        </Grid>

        <Grid item {...right}>
          <Box
            sx={{
              border: `1px solid ${ST.colors.border}`,
              borderRadius: 1.5,
              p: 2,
              height: "100%",
            }}
          >
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.25 }}>
              Top priorities
            </Typography>
            {topPriorities.length === 0 && <MutedNote>No gaps flagged.</MutedNote>}
            {topPriorities.map((p, i) => (
              <Box
                key={p.key}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  py: 1,
                  borderTop: i ? `1px solid ${ST.colors.border}` : "none",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: ST.colors.textSecondary, minWidth: 16 }}
                >
                  {i + 1}
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ color: ST.colors.textPrimary }}>
                    {p.name}
                  </Typography>
                  <MutedNote>
                    {p.framework}
                    {p.criterion ? ` · ${p.criterion}` : ""} · {p.owner}
                  </MutedNote>
                </Box>
                <StatusChip status={p.status} />
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </SectionCard>
  );
}
