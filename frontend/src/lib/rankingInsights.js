/**
 * Derive ranking readiness insights for a single ranking platform.
 */

function parsePct(value) {
  if (value == null || value === "") return null;
  const n = parseFloat(String(value).replace("~", "").replace("%", "").trim());
  return Number.isFinite(n) ? n : null;
}

function parseRatio(ratio) {
  if (!ratio || ratio === "N/A") return null;
  const n = parseFloat(String(ratio).split(":")[0].trim());
  return Number.isFinite(n) ? n : null;
}

function isMissing(ind) {
  const status = String(ind.status || "");
  const score = typeof ind.score === "number" ? ind.score : parsePct(ind.score) || 0;
  return /no data|not applicable|missing|n\/a|limited/i.test(status) || score < 20;
}

function isStrong(ind) {
  const score = typeof ind.score === "number" ? ind.score : parsePct(ind.score) || 0;
  return score >= 40 && !/no data|not applicable|missing|n\/a/i.test(String(ind.status || ""));
}

function flattenCardIndicators(system) {
  if (!system) return [];
  if (Array.isArray(system.criteria) && system.criteria.length) {
    return system.criteria.flatMap((c) =>
      (c.indicators || []).map((ind) => ({
        ...ind,
        criterion: c.name || c.shortLabel || "",
      }))
    );
  }
  return system.indicators || [];
}

function matches(name, pattern) {
  return pattern.test(String(name || ""));
}

/**
 * @param {object} opts
 * @param {object|null} opts.inst institutional summary
 * @param {object} opts.system RANKING_SYSTEMS entry for the active platform
 * @param {string} opts.institutionName
 */
export function buildPlatformInsights({ inst, system, institutionName = "Institution" }) {
  const strengths = [];
  const gaps = [];
  const quickWins = [];
  const name = institutionName || "Institution";
  const platform = system?.tabLabel || system?.badge || "This ranking";
  const methodology = system?.methodology || system?.id || "";
  const indicators = flattenCardIndicators(system);
  const readiness =
    typeof system?.overallReadiness === "number"
      ? system.overallReadiness
      : Math.round(
          indicators.reduce((sum, ind) => sum + (Number(ind.score) || 0), 0) / Math.max(indicators.length, 1)
        );

  const ratio = parseRatio(inst?.studentFacultyRatio);
  const intl = parsePct(inst?.internationalStudents);
  const female = parsePct(inst?.femaleRatio);
  const research = Number(inst?.researchStudents) || 0;
  const nationalities = Number(inst?.activeNationalities) || 0;
  const gpa = inst?.avgGPA || "";

  const strongInds = indicators.filter(isStrong).sort((a, b) => (b.score || 0) - (a.score || 0));
  const weakInds = indicators.filter(isMissing).sort((a, b) => (a.score || 0) - (b.score || 0));

  // ── Strengths tailored to platform ───────────────────────────────────────
  if (["qs", "the", "the-arab", "ssa"].includes(methodology) && ratio != null && ratio > 0 && ratio < 10) {
    strengths.push({
      title: "Faculty/student ratio",
      text: `at ${inst.studentFacultyRatio}, this supports ${platform} teaching/resources scoring; top global universities typically aim for under 10:1`,
    });
  }

  if (["qs", "the", "the-arab", "ssa"].includes(methodology) && intl != null && intl >= 20) {
    strengths.push({
      title: "International outlook",
      text: `${inst.internationalStudents}${
        nationalities ? ` from ${nationalities} nationalities` : ""
      } strengthens ${platform} diversity and internationalisation indicators`,
    });
  }

  if (["ssa", "cwts", "the", "the-arab"].includes(methodology) && female != null && female >= 40 && female <= 65) {
    strengths.push({
      title: "Gender equity",
      text: `${inst.femaleRatio} female enrolment is favourable for ${platform} equity-related metrics`,
    });
  }

  if (["qs", "the", "ssa", "the-arab"].includes(methodology) && gpa) {
    strengths.push({
      title: "Academic performance signal",
      text: `average GPA ${gpa} provides an internal quality signal that can support teaching and student-engagement narratives for ${platform}`,
    });
  }

  for (const ind of strongInds.slice(0, 2)) {
    strengths.push({
      title: ind.name,
      text: `${Math.round(ind.score)}% readiness${ind.weight ? ` (${ind.weight})` : ""}${
        ind.performance ? ` - ${String(ind.performance).slice(0, 140)}` : " on this platform's indicator set"
      }`,
    });
  }

  if (!strengths.length) {
    strengths.push({
      title: `${platform} data capture`,
      text: `${name} is still building evidence for ${platform}. Strengths will appear as indicator readiness rises above ~40%.`,
    });
  }

  // ── Gaps tailored to platform ────────────────────────────────────────────
  for (const ind of weakInds.slice(0, 3)) {
    gaps.push({
      title: ind.name,
      text: `${Math.round(ind.score || 0)}% readiness${ind.weight ? ` · weight ${ind.weight}` : ""}${
        ind.performance ? ` - ${String(ind.performance).slice(0, 160)}` : " - insufficient verified data for this criterion"
      }`,
    });
  }

  if (methodology === "arwu" && readiness < 35) {
    gaps.push({
      title: "Structural ARWU constraints",
      text: `overall readiness ~${Math.round(
        readiness
      )}% - Shanghai ARWU is heavily weighted toward Nobel/Fields awards and high-impact journal papers, which remain structural constraints for many emerging universities`,
    });
  }

  if (["qs", "the", "the-arab"].includes(methodology)) {
    const rep = indicators.find((i) => matches(i.name, /reputation|survey/i));
    if (rep && isMissing(rep)) {
      gaps.push({
        title: rep.name,
        text: `${platform} relies on global academic/employer surveys that require sustained brand-building; current readiness is ~${Math.round(
          rep.score || 0
        )}%${rep.weight ? ` (weight ${rep.weight})` : ""}`,
      });
    }
  }

  if (!gaps.length) {
    gaps.push({
      title: "Indicator quality",
      text: `No severe ${platform} gaps detected from current scores - keep validating source evidence before ranking submission windows.`,
    });
  }

  // ── Quick wins tailored to platform ──────────────────────────────────────
  const citationWeak = weakInds.find((i) =>
    matches(i.name, /citation|excellence|scholarly|scopus|wos|pp\(top|research quality|scientific output/i)
  );
  if (citationWeak && research > 0) {
    quickWins.push({
      title: `Publish the ${research} active research output(s) for ${platform}`,
      text: `raises ${citationWeak.name} readiness; assigning DOIs enables indexing in OpenAlex for free citation tracking before commercial Scopus/WoS coverage is complete`,
      link: { href: "https://openalex.org", label: "OpenAlex" },
    });
  }

  const opennessWeak = weakInds.find((i) => matches(i.name, /openness|transparency|open access|pp\(oa\)/i));
  if (opennessWeak || methodology === "webometrics" || methodology === "cwts") {
    if (opennessWeak || weakInds.some((i) => matches(i.name, /open|transpar/i))) {
      quickWins.push({
        title: "Build or strengthen an open-access repository",
        text: `improves ${platform} openness/transparency indicators and makes research outputs crawlable for ranking systems`,
      });
    }
  }

  if (methodology === "webometrics") {
    const visibility = indicators.find((i) => matches(i.name, /visibility|impact/i));
    if (visibility && isMissing(visibility)) {
      const hasVerifiedDomain = /verified institutional domain/i.test(visibility.performance || "");
      quickWins.push({
        title: hasVerifiedDomain
          ? "Measure Ahrefs referring domains for the verified institutional website"
          : "Publish one canonical, crawlable institutional domain",
        text: hasVerifiedDomain
          ? "Visibility still depends on inbound links to that domain - email/domain registration alone is not a full Impact score"
          : "Visibility depends on referring domains to a public site - register and publish the institution domain first",
      });
    }
  }

  if (["qs"].includes(methodology)) {
    const emp = indicators.find((i) => matches(i.name, /employ/i));
    if (emp && isMissing(emp)) {
      quickWins.push({
        title: "Start tracking graduate employment outcomes",
        text: `unlocks QS Employment Outcomes${emp.weight ? ` (${emp.weight})` : ""} and supports Employer Reputation`,
      });
    }
  }

  if (["ssa", "aur", "the-arab"].includes(methodology)) {
    const engagement = indicators.find((i) => matches(i.name, /engagement|access|resource|ethic/i));
    if (engagement && isMissing(engagement)) {
      quickWins.push({
        title: `Close the ${engagement.name} evidence gap`,
        text: `capture verified current and target values so ${platform} regional pillars can move beyond proxy readiness`,
      });
    }
  }

  if (!quickWins.length) {
    const target = weakInds[0];
    if (target) {
      quickWins.push({
        title: `Prioritise ${target.name}`,
        text: `largest relative gap on ${platform}${target.weight ? ` (weight ${target.weight})` : ""} - document evidence and update the institutional ranking repository`,
      });
    } else {
      quickWins.push({
        title: `Maintain ${platform} indicator updates`,
        text: "keep ranking-related metrics current so annual submissions require less manual compilation",
      });
    }
  }

  return {
    strengths: strengths.slice(0, 4),
    gaps: gaps.slice(0, 4),
    quickWins: quickWins.slice(0, 4),
    readiness,
    platform,
  };
}

/** @deprecated use buildPlatformInsights */
export function buildRankingInsights(inst, rankings, institutionName = "Institution") {
  return buildPlatformInsights({
    inst,
    institutionName,
    system: {
      tabLabel: "Overall",
      methodology: "qs",
      overallReadiness: 0,
      indicators: [],
    },
  });
}
