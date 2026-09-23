/**
 * Pure helpers for the Executive rankings brief. No React, so they can be
 * unit-tested and later moved server-side (/rankings/summary).
 */

import { frameworkMeta } from "@/lib/rankings/catalog";
import {
  IAQRI_SCENARIO_DRIVERS,
  criterionBreakdown,
  pct,
  systemReadiness,
  weightedReadiness,
} from "@/lib/rankings/readiness";

export function frameworkRows(systems, priorities) {
  return (systems || [])
    .map((system) => {
      const meta = frameworkMeta(system.id);
      const gaps = priorities.filter((p) => p.frameworkId === system.id);
      const breakdown = criterionBreakdown(system);
      const weakest = breakdown.length
        ? breakdown.reduce((min, c) => (c.readiness < min.readiness ? c : min), breakdown[0])
        : null;
      return {
        id: system.id,
        system,
        label: meta?.short || system.tabLabel,
        fullLabel: meta?.label || system.title,
        dataSource: meta?.dataSource || "static",
        readiness: systemReadiness(system),
        breakdown,
        weakest,
        topGap: gaps[0] || null,
        gapCount: gaps.length,
        highGapCount: gaps.filter((g) => g.high).length,
      };
    })
    .sort((a, b) => b.readiness - a.readiness);
}

export function buildExecutiveSummary(rows, priorities) {
  if (!rows.length) return null;
  const average = rows.reduce((sum, r) => sum + r.readiness, 0) / rows.length;
  const strongest = rows[0];
  const weakest = rows[rows.length - 1];

  const byOwner = {};
  priorities.forEach((p) => {
    byOwner[p.owner] = (byOwner[p.owner] || 0) + 1;
  });
  const [topOwner, topOwnerCount] =
    Object.entries(byOwner).sort((a, b) => b[1] - a[1])[0] || [null, 0];

  const parts = [];
  if (rows.length === 1) {
    parts.push(`${strongest.label} readiness is ${pct(strongest.readiness)}.`);
  } else {
    parts.push(
      `Readiness is highest for ${strongest.label} (${pct(strongest.readiness)}) and lowest for ${
        weakest.label
      } (${pct(weakest.readiness)}).`
    );
  }
  if (priorities.length) {
    parts.push(
      `${priorities.length} indicator${priorities.length === 1 ? "" : "s"} lack${
        priorities.length === 1 ? "s" : ""
      } sufficient evidence${
        topOwner && topOwner !== "Unassigned"
          ? `; the largest share (${topOwnerCount}) sits with the ${topOwner}.`
          : "."
      }`
    );
  } else {
    parts.push("No indicator is currently flagged as missing or limited evidence.");
  }

  return {
    average,
    strongest,
    weakest,
    gapCount: priorities.length,
    highGapCount: priorities.filter((p) => p.high).length,
    headline: parts.join(" "),
    topPriorities: priorities.slice(0, 3),
  };
}

/**
 * NIRF scenario projection - same model as the framework page's scenario
 * panel (linear drivers + the Perception threshold bonus).
 */
export function projectScenario(nirfSystem, values) {
  const criteria = nirfSystem?.criteria || [];
  return criteria.map((c) => {
    const base = weightedReadiness(c.indicators);
    let extra = 0;
    IAQRI_SCENARIO_DRIVERS.forEach((d) => {
      const w = d.effects[c.id];
      if (w) extra += (values?.[d.key] || 0) * w;
    });
    let projected = Math.min(100, base + extra);
    if (c.id === "pr" && ((values?.faculty || 0) > 0 || (values?.pubs || 0) > 5)) {
      projected = Math.min(100, projected + 3);
    }
    return {
      id: c.id,
      label: c.shortLabel || c.id.toUpperCase(),
      name: c.name,
      // "Teaching, Learning & Resources (TLR)" -> "Teaching, Learning & Resources"
      fullName: String(c.name || "").replace(/\s*\([^)]*\)\s*$/, "") || c.name,
      base: Math.round(base),
      projected: Math.round(projected),
      delta: Math.round(projected) - Math.round(base),
    };
  });
}

export function emptyScenario() {
  return Object.fromEntries(IAQRI_SCENARIO_DRIVERS.map((d) => [d.key, 0]));
}

export function scenarioIsEmpty(values) {
  return !Object.values(values || {}).some((v) => Number(v) > 0);
}

export const EXPORT_SECTIONS = [
  {
    id: "summary",
    label: "Summary & comparison",
    description: "Headline readiness, top priorities and the framework comparison table",
  },
  {
    id: "detail",
    label: "Framework detail",
    description: "Criterion / pillar readiness for each framework, optionally with indicator tables",
  },
  {
    id: "priorities",
    label: "Priorities & actions",
    description: "Ranked gaps with owner and suggested action",
  },
  {
    id: "baseline",
    label: "Scenario & baseline",
    description: "Institutional baseline figures, scenario results (NIRF) and methodology notes",
  },
];
