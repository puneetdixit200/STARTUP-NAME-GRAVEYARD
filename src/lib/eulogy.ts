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
