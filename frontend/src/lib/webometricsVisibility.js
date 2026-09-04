/**
 * Webometrics Visibility / Impact assessment from verified institution domains
 * and optional live Ahrefs referring-domain data from the backend.
 */

export function resolveCanonicalDomain(domains = [], primaryDomain = null) {
  const cleaned = (domains || [])
    .map((d) => String(d || "").trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
  const primary = primaryDomain
    ? String(primaryDomain).trim().toLowerCase().replace(/^@/, "")
    : null;
  if (primary && cleaned.includes(primary)) return primary;
  if (primary) return primary;
  return cleaned[0] || null;
}

function buildNoDomainIndicator() {
  return {
    name: "Visibility / Impact",
    description: "Impact based on number of external referring domains (Ahrefs.com)",
    weight: "50%",
    performance:
      "No data - no verified institutional domain is registered, so a canonical website identity cannot be established for referring-domain measurement",
    score: 0,
    status: "No data",
    detail: {
      source: "Ahrefs referring domains · Webometrics Visibility",
      evidence: [
        { label: "Verified institutional domain", value: "None registered for this institution" },
        { label: "Referring domains (Ahrefs)", value: "0 - cannot be measured without a canonical domain" },
        { label: "Web identity", value: "No verified domain on file" },
      ],
      gaps: [
        "No verified canonical university domain in institutional records",
        "Inbound link profile cannot be measured until a public domain is registered and crawlable",
      ],
      actions: [
        "Register the institution's primary public domain in TemplumIS domain settings",
        "Publish one official, crawlable website on that domain and keep it as the single web identity",
        "Earn genuine inbound links from partners, government, and scholarly sites - Visibility is referring domains, not traffic",
      ],
      factors: [
        {
          label: "Score from SIS",
          note: "0% - referring domains cannot be counted without a verified public domain.",
        },
        { label: "Domain identity", note: "A single canonical domain is required for Visibility to accumulate." },
        {
          label: "Inbound links",
          note: "The 50% weight is unique referring domains (Ahrefs), not page count or analytics.",
        },
        { label: "Presence removed", note: "Indexed web-page count is no longer part of the ranking." },
      ],
    },
  };
}

function referringDomainsEvidence(liveAssessment, canonical) {
  const ahrefs = liveAssessment?.ahrefs || {};
  const count = ahrefs.referring_domains;
  const status = ahrefs.status;

  if (typeof count === "number") {
    const reportDate = ahrefs.report_date ? ` (Ahrefs snapshot ${ahrefs.report_date})` : "";
    return `Live: ${count.toLocaleString()} referring domains to https://${canonical}${reportDate}`;
  }
  if (status === "provider_not_configured") {
    return `Not measured live - set AHREFS_API_TOKEN on the backend to fetch Ahrefs referring domains for https://${canonical}`;
  }
  if (status === "provider_error") {
    return `Ahrefs request failed for https://${canonical} - ${ahrefs.message || "check API token and permissions"}`;
  }
  if (status === "loading") {
    return `Fetching live Ahrefs referring-domain count for https://${canonical}…`;
  }
  return `Referring-domain count for https://${canonical} is not available yet`;
}

/**
 * @param {{ domains?: string[], primaryDomain?: string|null, liveAssessment?: object|null }} opts
 */
export function buildWebometricsVisibilityIndicator({
  domains = [],
  primaryDomain = null,
  liveAssessment = null,
} = {}) {
  const fromLive = liveAssessment?.canonical_domain || null;
  const canonical =
    fromLive || resolveCanonicalDomain(domains, primaryDomain);
  const allDomains = (liveAssessment?.registered_domains?.length
    ? liveAssessment.registered_domains
    : domains || []
  )
    .map((d) => String(d || "").trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
  const uniqueDomains = [...new Set(allDomains)];

  if (!canonical) {
    return buildNoDomainIndicator();
  }

  const multiNote =
    uniqueDomains.length > 1
      ? ` Additional registered domains: ${uniqueDomains
          .filter((d) => d !== canonical)
          .map((d) => `@${d}`)
          .join(", ")}.`
      : "";

  const website = liveAssessment?.website;
  const ahrefs = liveAssessment?.ahrefs || {};
  const scoring = liveAssessment?.scoring;
  const refCount = ahrefs.referring_domains;
  const hasLiveScore = scoring && typeof scoring.score === "number";
  const score = hasLiveScore ? scoring.score : 18;
  const status = hasLiveScore ? scoring.status : "Limited";

  let performance;
  if (typeof refCount === "number") {
    performance = `${status} - live Ahrefs count for @${canonical}: ${refCount.toLocaleString()} referring domains.${multiNote}`;
  } else if (ahrefs.status === "provider_not_configured") {
    const reach =
      website?.reachable === true
        ? ` https://${canonical} responded live.`
        : website?.reachable === false
          ? ` https://${canonical} did not respond in the live probe.`
          : "";
    performance = `${status} - verified domain @${canonical} is registered.${reach} Ahrefs API is not configured, so referring-domain Impact is incomplete until AHREFS_API_TOKEN is set.${multiNote}`;
  } else if (ahrefs.status === "provider_error") {
    performance = `${status} - verified domain @${canonical} is registered, but the live Ahrefs lookup failed (${ahrefs.message || "provider error"}).${multiNote}`;
  } else if (ahrefs.status === "loading") {
    performance = `Limited - verified domain @${canonical} is registered; loading live Ahrefs referring-domain count…${multiNote}`;
  } else {
    performance = `${status} - verified institutional domain @${canonical} is registered. Live Visibility assessment pending.${multiNote}`;
  }

  const gaps = [];
  const actions = [
    `Ensure https://${canonical} is the single official, crawlable institutional website`,
    "Earn genuine inbound links from partners, government, and scholarly sites to that domain",
    "Avoid split or conflicting public domains that dilute the Impact score",
  ];

  if (typeof refCount !== "number") {
    if (ahrefs.status === "provider_not_configured") {
      gaps.push("AHREFS_API_TOKEN is not configured on the backend - live referring-domain count unavailable");
      actions.push("Add AHREFS_API_TOKEN (Ahrefs API v3) to the environment and restart the backend");
    } else if (ahrefs.status === "provider_error") {
      gaps.push("Live Ahrefs referring-domain request failed");
      actions.push("Verify the Ahrefs API token has Site Explorer access and retry");
    } else {
      gaps.push("Ahrefs referring-domain count for the verified domain is not yet captured");
    }
  } else if (refCount < 10) {
    gaps.push("Referring-domain count is still low for a competitive Webometrics Impact score");
  }

  if (website?.reachable === false) {
    gaps.push(`Live probe could not reach https://${canonical}`);
  }

  const evidence = [
    {
      label: "Verified institutional domain",
      value: `@${canonical}${uniqueDomains.length > 1 ? ` (primary of ${uniqueDomains.length} registered)` : " (primary)"}`,
    },
    {
      label: "Registered domains",
      value: uniqueDomains.map((d) => `@${d}`).join(", "),
    },
    {
      label: "Referring domains (Ahrefs)",
      value: referringDomainsEvidence(liveAssessment, canonical),
    },
    {
      label: "Website reachability",
      value:
        website?.reachable === true
          ? `Live OK (${website.status_code}) → ${website.final_url || `https://${canonical}`}`
          : website?.reachable === false
            ? `Unreachable from live probe${website.error ? ` - ${website.error}` : ""}`
            : "Not probed yet",
    },
    {
      label: "Assessment mode",
      value: liveAssessment?.live
        ? "Live backend assessment"
        : "Domain identity only (awaiting live assessment)",
    },
  ];

  return {
    name: "Visibility / Impact",
    description: "Impact based on number of external referring domains (Ahrefs.com)",
    weight: "50%",
    performance,
    score,
    status,
    detail: {
      source: "Verified institution domains · Live Ahrefs · Webometrics Visibility",
      evidence,
      gaps,
      actions,
      factors: [
        {
          label: "Score from SIS",
          note:
            typeof refCount === "number"
              ? `${score}% - live Ahrefs referring domains (${refCount.toLocaleString()}) drive this Visibility readiness.`
              : `${score}% - verified domain @${canonical} establishes identity; Impact needs a live Ahrefs referring-domain count.`,
        },
        {
          label: "Domain identity",
          note: `@${canonical} is treated as the canonical web identity for ranking readiness.`,
        },
        {
          label: "Inbound links",
          note: "The 50% weight is unique referring domains (Ahrefs), not email traffic or analytics.",
        },
        { label: "Presence removed", note: "Indexed web-page count is no longer part of the ranking." },
      ],
    },
  };
}

/** Patch Webometrics Visibility indicator onto a ranking systems array. */
export function withInstitutionDomains(
  systems,
  { domains = [], primaryDomain = null, liveAssessment = null } = {}
) {
  const visibility = buildWebometricsVisibilityIndicator({
    domains,
    primaryDomain,
    liveAssessment,
  });
  return (systems || []).map((system) => {
    if (system.id !== "web" && system.methodology !== "webometrics") return system;
    const indicators = (system.indicators || []).map((ind) =>
      ind.name === "Visibility / Impact" ? visibility : ind
    );
    return { ...system, indicators };
  });
}
