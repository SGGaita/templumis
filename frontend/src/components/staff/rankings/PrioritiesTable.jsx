"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { ST } from "@/lib/staffTheme";
import { MutedNote, SectionCard, StatusChip } from "./ui";

const PAGE = 10;
const headSx = { fontWeight: 600, color: ST.colors.textSecondary, whiteSpace: "nowrap" };

/**
 * Ranked weak indicators across the selected frameworks.
 * printMode: no filters, shows `printLimit` rows (null = all).
 */
export default function PrioritiesTable({ priorities, rows, printMode = false, printLimit = PAGE }) {
  const [framework, setFramework] = useState("all");
  const [highOnly, setHighOnly] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(
    () =>
      printMode
        ? priorities
        : priorities.filter(
            (p) => (framework === "all" || p.frameworkId === framework) && (!highOnly || p.high)
          ),
    [priorities, framework, highOnly, printMode]
  );

  const limit = printMode ? printLimit : expanded ? null : PAGE;
  const visible = limit ? filtered.slice(0, limit) : filtered;

  const filters = !printMode && (
    <>
      <FormControlLabel
        control={<Switch size="small" checked={highOnly} onChange={(e) => setHighOnly(e.target.checked)} />}
        label={<Typography variant="body2">High-weight only</Typography>}
        sx={{ mr: 0 }}
      />
    </>
  );

  return (
    <SectionCard
      number="3 · Priorities"
      title="Priorities & actions"
      subtitle="Indicators with no or limited evidence, ranked by how much of their framework's score they carry."
      action={filters}
    >
      {!printMode && rows.length > 1 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
          {[{ id: "all", label: "All" }, ...rows].map((r) => {
            const count =
              r.id === "all" ? priorities.length : priorities.filter((p) => p.frameworkId === r.id).length;
            const active = framework === r.id;
            return (
              <Chip
                key={r.id}
                label={`${r.label} · ${count}`}
                onClick={() => {
                  setFramework(r.id);
                  setExpanded(false);
                }}
                variant={active ? "filled" : "outlined"}
                sx={{
                  fontWeight: 600,
                  bgcolor: active ? ST.colors.primary : "transparent",
                  color: active ? "#fff" : ST.colors.textSecondary,
                  borderColor: ST.colors.border,
                  "&:hover": { bgcolor: active ? ST.colors.primary : ST.colors.primaryLight },
                }}
              />
            );
          })}
        </Box>
      )}

      {filtered.length === 0 ? (
        <MutedNote>No gaps match this filter.</MutedNote>
      ) : (
        <TableContainer>
          <Table size="small" sx={{ "& td, & th": { borderColor: ST.colors.border }, "& td": { verticalAlign: "top", py: 1.25 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headSx, width: 32 }}>#</TableCell>
                <TableCell sx={headSx}>Indicator & suggested action</TableCell>
                <TableCell sx={headSx}>Framework</TableCell>
                <TableCell sx={headSx} align="right">
                  Share
                </TableCell>
                <TableCell sx={headSx}>Status</TableCell>
                <TableCell sx={headSx}>Owner</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((p, i) => (
                <TableRow key={p.key} sx={{ breakInside: "avoid" }}>
                  <TableCell sx={{ color: ST.colors.textSecondary, fontWeight: 600 }}>{i + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {p.name}
                    </Typography>
                    <MutedNote sx={{ mt: 0.25 }}>{p.action}</MutedNote>
                  </TableCell>
                  <TableCell sx={{ minWidth: 140, maxWidth: 220 }}>
                    <Typography variant="body2">{p.framework}</Typography>
                    {p.criterion && <MutedNote>{p.criterion}</MutedNote>}
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    <Typography variant="body2">{`${p.share.toFixed(p.share < 10 ? 1 : 0)}%`}</Typography>
                    {p.high && <MutedNote>high</MutedNote>}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={p.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{p.owner}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5, gap: 1 }}>
        <MutedNote>
          Showing {visible.length} of {filtered.length}. "Share" is the indicator's weight as a percentage of its
          framework total.
        </MutedNote>
        {!printMode && filtered.length > PAGE && (
          <Button size="small" onClick={() => setExpanded((v) => !v)} sx={{ textTransform: "none", flexShrink: 0 }}>
            {expanded ? "Show top 10" : `Show all ${filtered.length}`}
          </Button>
        )}
      </Box>
    </SectionCard>
  );
}
