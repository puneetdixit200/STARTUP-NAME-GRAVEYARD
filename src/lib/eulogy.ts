import type { Eulogy, Startup } from "../types";

const closingLines = [
  "They disrupted nothing. They are missed by no one. Their Slack is still active.",
  "A beautiful pitch deck was left behind. No customers were harmed.",
  "The market remains untransformed, but the Notion workspace was immaculate.",
  "They flew too close to the burn rate and called it category creation."
];

export function buildEulogy({
  startup,
  uselessFact,
  boredActivity
}: {
  startup: Startup;
  uselessFact: string;
  boredActivity: string;
}): Eulogy {
  const closingLine = closingLines[startup.metrics.pivotCount % closingLines.length];

  if (startup.mode === "real") {
    return {
      title: `In loving memory of ${startup.name}`,
      metrics: buildRealStartupMetrics(startup),
      cause: buildRealCauseOfDeath(startup),
      body: `${startup.origin ?? "Wikipedia marks this company as defunct."} ${sourceSentence(startup)}`
    };
  }

  return {
    title: `In loving memory of ${startup.name}`,
    metrics: [
      `Series A: Raised $${startup.metrics.seriesA.toFixed(1)}M to solve a problem nobody had.`,
      `Pivot Count: ${startup.metrics.pivotCount}`,
      `Last Pivot: We're now a ${boredActivity} platform`,
      `Total Users: ${uselessFact}`,
      `Runway: ${startup.metrics.runwayDays} days, most of them spent in offsites.`,
      `Valuation: $${startup.metrics.valuation}M, emotionally marked to myth.`
    ],
    cause: `Cause of Death: ${startup.causeOfDeath}`,
    body: `${closingLine} They disrupted nothing. ${startup.origin ?? "Their founders are currently advising stealth companies."}`
  };
}

function buildRealStartupMetrics(startup: Startup): string[] {
  const sourceName = startup.wikidataId ? "Wikidata" : startup.sourceUrl ? "Wikipedia" : "curated fallback data";
  const metrics: string[] = [];

  if (startup.founded !== "Unknown") {
    metrics.push(`Founded: ${startup.founded} (${sourceName}).`);
  }

  if (startup.died !== "Unknown") {
    metrics.push(`Died: ${startup.died} (${sourceName}).`);
  }

  metrics.push(`Source: ${sourceLabel(startup)}.`);
  metrics.push("Unavailable from open data: funding rounds, pivot count, last pivot, users, runway, valuation.");

  return metrics;
}

function buildRealCauseOfDeath(startup: Startup): string {
  if (startup.resurrections > 0) {
    return `Cause of Death: ${startup.causeOfDeath}`;
  }

  return "Recorded Status: Defunct/dissolved in open records.";
}

function sourceLabel(startup: Startup): string {
  if (startup.wikidataId) {
    return `Wikipedia + Wikidata ${startup.wikidataId}`;
  }

  if (startup.sourceUrl) {
    return "Wikipedia";
  }

  return "Curated fallback record";
}

function sourceSentence(startup: Startup): string {
  if (startup.sourceUrl && startup.wikidataId) {
    return `Source: Wikipedia summary and Wikidata ${startup.wikidataId}.`;
  }

  if (startup.sourceUrl) {
    return "Source: Wikipedia summary.";
  }

  return "Source: curated fallback record shown because open data was unavailable.";
}

export function resurrectStartup(startup: Startup): Startup {
  return {
    ...startup,
    tagline: `${startup.name} has pivoted to crypto, reinvented governance, and become a DAO nobody voted for.`,
    metrics: {
      ...startup.metrics,
      pivotCount: startup.metrics.pivotCount + 1,
      burnMultiple: Number((startup.metrics.burnMultiple + 4.2).toFixed(1))
    },
    causeOfDeath: "Died again after mistaking token liquidity for revenue.",
    epitaph: "Died again. This time as a DAO.",
    resurrections: startup.resurrections + 1
  };
}
