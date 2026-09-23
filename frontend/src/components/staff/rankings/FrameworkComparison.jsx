"use client";

import { Fragment } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { ST } from "@/lib/staffTheme";
import { criterionTitle } from "@/lib/rankings/readiness";
import { DATA_SOURCE_LABEL, MutedNote, ReadinessBar, SectionCard, StatusChip } from "./ui";

const headSx = { fontWeight: 600, color: ST.colors.textSecondary, whiteSpace: "nowrap" };

/** Criterion / pillar bars for one framework, optionally with its indicator table. */
export function FrameworkDetail({ row, showIndicators = false }) {
  const { system, breakdown } = row;
  const flat = !breakdown.length;
  return (
    <Box>
      {!flat && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            "@media print": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
            columnGap: 4,
            rowGap: 1.25,
          }}
        >
          {breakdown.map((c) => (
            <Box key={c.id} sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
                <Typography variant="body2" noWrap title={c.name} sx={{ fontWeight: 500 }}>
                  {criterionTitle(c)}
                </Typography>
                <MutedNote sx={{ whiteSpace: "nowrap" }}>{c.weightLabel}</MutedNote>
              </Box>
              <ReadinessBar value={c.readiness} height={6} />
            </Box>
          ))}
        </Box>
      )}

      {(showIndicators || flat) && (
        <TableContainer sx={{ mt: flat ? 0 : 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headSx}>Indicator</TableCell>
                {!flat && <TableCell sx={headSx}>Criterion</TableCell>}
                <TableCell sx={headSx}>Weight</TableCell>
                <TableCell sx={headSx}>Status</TableCell>
                {showIndicators && <TableCell sx={headSx}>Current evidence</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {(flat
                ? (system.indicators || []).map((indicator) => ({ indicator, criterion: null }))
                : breakdown.flatMap((c) => c.indicators.map((indicator) => ({ indicator, criterion: c })))
              ).map(({ indicator, criterion }) => (
                <TableRow key={`${criterion?.id || "all"}-${indicator.name}`} sx={{ breakInside: "avoid" }}>
                  <TableCell sx={{ fontWeight: 500 }}>{indicator.name}</TableCell>
                  {!flat && <TableCell>{criterion.code || criterion.label}</TableCell>}
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{indicator.weight}</TableCell>
                  <TableCell>
                    <StatusChip status={indicator.status} />
                  </TableCell>
                  {showIndicators && (
                    <TableCell sx={{ color: ST.colors.textSecondary, maxWidth: 420 }}>
                      {indicator.performance}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default function FrameworkComparison({ rows, expandedIds, onToggle, printMode = false }) {
  return (
    <SectionCard
      number="2 · Comparison"
      title="Framework comparison"
      subtitle={`Readiness against each framework's own weighting, highest first.${
        printMode ? "" : " Expand a row for its criteria."
      }`}
      sx={{ breakInside: "avoid" }}
    >
      <TableContainer>
        <Table size="small" sx={{ "& td, & th": { borderColor: ST.colors.border } }}>
          <TableHead>
            <TableRow>
              {!printMode && <TableCell sx={{ width: 40 }} />}
              <TableCell sx={headSx}>Framework</TableCell>
              <TableCell sx={{ ...headSx, width: { xs: "34%", md: "32%" } }}>Readiness</TableCell>
              <TableCell sx={headSx}>Biggest gap</TableCell>
              <TableCell sx={headSx} align="right">
                Open gaps
              </TableCell>
              {!printMode && <TableCell sx={{ width: 48 }} />}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const open = !printMode && expandedIds.has(row.id);
              const gap = row.weakest
                ? `${criterionTitle(row.weakest)} (${Math.round(row.weakest.readiness)}%)`
                : row.topGap?.name || "-";
              return (
                <Fragment key={row.id}>
                  <TableRow
                    hover={!printMode}
                    onClick={printMode ? undefined : () => onToggle(row.id)}
                    sx={{ cursor: printMode ? "default" : "pointer", "& > td": { py: 1.25 } }}
                  >
                    {!printMode && (
                      <TableCell>
                        <IconButton size="small" aria-label={open ? "Collapse" : "Expand"}>
                          {open ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                    )}
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {row.label}
                      </Typography>
                      <MutedNote>{DATA_SOURCE_LABEL[row.dataSource]}</MutedNote>
                    </TableCell>
                    <TableCell>
                      <ReadinessBar value={row.readiness} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{gap}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      <Typography variant="body2" fontWeight={600}>
                        {row.gapCount}
                      </Typography>
                      <MutedNote>{row.highGapCount} high</MutedNote>
                    </TableCell>
                    {!printMode && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Tooltip title={`Open the ${row.label} framework page`}>
                          <IconButton
                            size="small"
                            component={Link}
                            href={`/staff/rankings?framework=${encodeURIComponent(row.id)}`}
                            aria-label={`Open ${row.label}`}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                  {!printMode && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ p: 0, borderBottom: open ? undefined : "none" }}>
                        <Collapse in={open} unmountOnExit>
                          <Box sx={{ px: { xs: 1.5, md: 7 }, py: 2, bgcolor: ST.colors.bg }}>
                            <FrameworkDetail row={row} />
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {rows.some((r) => r.dataSource !== "live") && (
        <MutedNote sx={{ mt: 1.5 }}>
          "Static assessment" frameworks use a fixed evidence review rather than the live institutional feed, so
          compare them with care.
        </MutedNote>
      )}
    </SectionCard>
  );
}
