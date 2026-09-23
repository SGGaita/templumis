"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import GlobalStyles from "@mui/material/GlobalStyles";
import Typography from "@mui/material/Typography";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { ST } from "@/lib/staffTheme";
import { useRankingsData } from "@/hooks/useRankingsData";
import {
  filterSystemsByIds,
  frameworkMeta,
  institutionFrameworkIds,
  readUserFrameworks,
  resolveFrameworkIds,
  writeUserFrameworks,
} from "@/lib/rankings/catalog";
import { rankPriorities } from "@/lib/rankings/readiness";
import { buildExecutiveSummary, emptyScenario, frameworkRows } from "@/lib/rankings/executive";
import ExecutiveSummary from "@/components/staff/rankings/ExecutiveSummary";
import FrameworkComparison, { FrameworkDetail } from "@/components/staff/rankings/FrameworkComparison";
import PrioritiesTable from "@/components/staff/rankings/PrioritiesTable";
import ScenarioBaseline from "@/components/staff/rankings/ScenarioBaseline";
import FrameworkPicker from "@/components/staff/rankings/FrameworkPicker";
import ExportDialog from "@/components/staff/rankings/ExportDialog";
import { DATA_SOURCE_LABEL, MutedNote, ReadinessBar, SectionCard } from "@/components/staff/rankings/ui";

const PRINT_STYLES = (
  <GlobalStyles
    styles={`
      @media screen {
        .exec-print { display: none; }
      }
      @media print {
        @page { size: A4 portrait; margin: 14mm; }
        body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .MuiDrawer-root, .MuiAppBar-root, nav, .no-print, .exec-screen { display: none !important; }
        main {
          margin: 0 !important; padding: 0 !important; width: 100% !important;
          min-height: 0 !important; background: #fff !important;
        }
        .exec-print { display: block !important; }
        .exec-print section { border-color: #d5dbe5 !important; }
        .exec-print .print-break { break-before: page; }
        .exec-print table { font-size: 11px; }
      }
    `}
  />
);

function useBriefModel(systems, ids) {
  return useMemo(() => {
    const selectedSystems = filterSystemsByIds(systems, ids);
    const priorities = rankPriorities(selectedSystems);
    const rows = frameworkRows(selectedSystems, priorities);
    return {
      selectedSystems,
      priorities,
      rows,
      summary: buildExecutiveSummary(rows, priorities),
      nirf: selectedSystems.find((s) => s.id === "nirf") || null,
    };
  }, [systems, ids]);
}

function formatDateTime(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function ExecutiveRankingsPage() {
  const { user, institutionName, institutionalData, systems, loading, error, updatedAt, reload } =
    useRankingsData();

  // ── Framework selection: institution list, narrowed by the user's saved choice ──
  const adminList = user?.ranking_frameworks ?? null;
  const available = useMemo(() => institutionFrameworkIds(adminList), [adminList]);
  const [userChoice, setUserChoice] = useState(null);
  useEffect(() => {
    if (user) setUserChoice(readUserFrameworks(user));
  }, [user]);
  const selectedIds = useMemo(() => resolveFrameworkIds(adminList, userChoice), [adminList, userChoice]);
  const handlePick = useCallback(
    (ids) => {
      setUserChoice(ids);
      writeUserFrameworks(user, ids);
    },
    [user]
  );

  const screen = useBriefModel(systems, selectedIds);

  // ── Interactive state ──
  const [expanded, setExpanded] = useState(() => new Set());
  const toggleRow = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const [scenario, setScenario] = useState(emptyScenario);

  // ── Export ──
  const [exportOpen, setExportOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState(null);
  const [printedAt, setPrintedAt] = useState(null);
  const print = useBriefModel(systems, printConfig?.frameworks || []);

  useEffect(() => {
    if (!printConfig) return undefined;
    const previousTitle = document.title;
    document.title = `${institutionName} - University Rankings Summary`;
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      document.title = previousTitle;
      setPrintConfig(null);
    };
    window.addEventListener("afterprint", done);
    // Let the print-only tree render before opening the dialog.
    const timer = setTimeout(() => {
      window.print();
      setTimeout(done, 1000);
    }, 250);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", done);
      document.title = previousTitle;
    };
  }, [printConfig, institutionName]);

  const handleExport = (config) => {
    setExportOpen(false);
    setPrintedAt(new Date());
    setPrintConfig(config);
  };

  // ── States ──
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !institutionalData) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={reload}>
            Retry
          </Button>
        }
      >
        Institutional data could not be loaded, so readiness can&apos;t be calculated. {error}
      </Alert>
    );
  }

  const period = `AY ${institutionalData.academicYear} · ${institutionalData.semester}`;
  const sectionOn = (id) => printConfig?.sections.includes(id);

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      {PRINT_STYLES}

      {/* ─────────────────────────── Screen ─────────────────────────── */}
      <Box className="exec-screen">
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", md: "flex-end" },
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
              University Rankings Summary
            </Typography>
            <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>
              {institutionName} · {period} · {screen.rows.length} framework{screen.rows.length === 1 ? "" : "s"}
            </Typography>
            <MutedNote sx={{ mt: 0.25 }}>
              Readiness figures are estimates from institutional data
              {updatedAt ? `, updated ${formatDateTime(updatedAt)}` : ""}.
            </MutedNote>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              component={Link}
              href="/staff/rankings"
              size="small"
              sx={{ textTransform: "none", fontWeight: 600, color: ST.colors.textSecondary }}
            >
              University Rankings
            </Button>
            <FrameworkPicker available={available} selected={selectedIds} onChange={handlePick} />
            <Button
              variant="contained"
              size="small"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={() => setExportOpen(true)}
              sx={{ textTransform: "none", fontWeight: 600, bgcolor: ST.colors.primary }}
            >
              Export PDF
            </Button>
          </Box>
        </Box>

        <ExecutiveSummary summary={screen.summary} frameworkCount={screen.rows.length} />
        <FrameworkComparison rows={screen.rows} expandedIds={expanded} onToggle={toggleRow} />
        <PrioritiesTable priorities={screen.priorities} rows={screen.rows} />
        <ScenarioBaseline
          institutionalData={institutionalData}
          nirfSystem={screen.nirf}
          scenario={scenario}
          onScenarioChange={setScenario}
        />
      </Box>

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
        available={available}
        selected={selectedIds}
      />

      {/* ─────────────────────────── Print ─────────────────────────── */}
      {printConfig && (
        <Box className="exec-print">
          <Box sx={{ borderBottom: `2px solid ${ST.colors.primary}`, pb: 1.5, mb: 3 }}>
            <Typography variant="h5" fontWeight={700}>
              University Rankings Summary
            </Typography>
            <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
              {institutionName} · {period}
            </Typography>
            <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
              Frameworks: {print.rows.map((r) => frameworkMeta(r.id)?.label || r.label).join(", ")}
            </Typography>
            <MutedNote sx={{ mt: 0.5 }}>
              Generated {formatDateTime(printedAt)}
              {user?.full_name ? ` by ${user.full_name}` : ""}. Readiness figures are estimates of evidence
              coverage from institutional data, not official scores or predicted ranks.
            </MutedNote>
          </Box>

          {sectionOn("summary") && (
            <>
              <ExecutiveSummary summary={print.summary} frameworkCount={print.rows.length} printMode />
              <FrameworkComparison rows={print.rows} expandedIds={new Set()} onToggle={() => {}} printMode />
            </>
          )}

          {sectionOn("detail") && (
            <Box className={sectionOn("summary") ? "print-break" : undefined}>
              <SectionCard number="Detail" title="Framework detail" sx={{ breakInside: "auto" }}>
                {print.rows.map((row, i) => (
                  <Box
                    key={row.id}
                    sx={{
                      pt: i ? 2.5 : 0,
                      mt: i ? 2.5 : 0,
                      borderTop: i ? `1px solid ${ST.colors.border}` : "none",
                      breakInside: printConfig.indicatorTables ? "auto" : "avoid",
                      // With full tables, start each framework on a new page.
                      breakBefore: printConfig.indicatorTables && i ? "page" : "auto",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {row.fullLabel}
                        </Typography>
                        <MutedNote>
                          {DATA_SOURCE_LABEL[row.dataSource]} · {row.gapCount} open gaps
                        </MutedNote>
                      </Box>
                      <ReadinessBar value={row.readiness} width={220} />
                    </Box>
                    <FrameworkDetail row={row} showIndicators={printConfig.indicatorTables} />
                  </Box>
                ))}
              </SectionCard>
            </Box>
          )}

          {sectionOn("priorities") && (
            <Box className={sectionOn("summary") || sectionOn("detail") ? "print-break" : undefined}>
              <PrioritiesTable
                priorities={print.priorities}
                rows={print.rows}
                printMode
                printLimit={printConfig.priorityLimit}
              />
            </Box>
          )}

          {sectionOn("baseline") && (
            <ScenarioBaseline
              institutionalData={institutionalData}
              nirfSystem={print.nirf}
              scenario={scenario}
              printMode
            />
          )}
        </Box>
      )}
    </Box>
  );
}
