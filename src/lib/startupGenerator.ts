import type { Leaderboard, SeasonalEvent, Startup, StartupMetrics, StartupSector } from "../types";

export const startupNameParts = {
  prefixes: ["Uber", "Sync", "Block", "Cloud", "Meta", "Hyper", "Quantum", "Neural", "Flux", "Omni"],
  cores: ["Scale", "Stack", "Forge", "Pulse", "Mint", "Grid", "Logic", "Surge", "Link", "Flow"],
  suffixes: [".ai", ".io", "ly", "ify", "Hub", "Labs", "OS", "X", "Base", ""]
};

export const domainGraveOptions: StartupSector[] = [
  "AI",
  "Crypto",
  "SaaS",
  "Consumer",
  "Media",
  "Health",
  "Hardware",
  "Infrastructure"
];

const logoDomains = [
  "apple.com",
  "stripe.com",
  "notion.so",
  "figma.com",
  "airbnb.com",
  "shopify.com",
  "slack.com",
  "openai.com",
  "vercel.com",
  "github.com",
  "linear.app",
  "spotify.com",
  "netflix.com",
  "dropbox.com",
  "atlassian.com",
  "zoom.us"
];

const fallbackTaglines = [
  "Disrupting mindful synergy through blockchain-enabled growth hacking.",
  "A B2B SaaS layer for founders who confuse urgency with insight.",
  "Turning enterprise leverage into subscription fatigue at planetary scale.",
  "AI-native workflow alignment for teams with no remaining workflows.",
  "The operating system for monetized vibes, fractional leadership, and regret.",
  "Low-code empathy infrastructure for optimizing stakeholder sleep.",
  "Reimagining productivity by adding one more dashboard to the dashboard stack.",
  "Autonomous enablement for brands seeking a defensible lack of purpose."
];

const causesOfDeath = [
  "Ran out of runway while optimizing the ping pong table budget.",
  "Discovered the total addressable market was three LinkedIn posts.",
  "Pivoted so many times the cap table needed motion sickness warnings.",
  "Spent the seed round on brand strategy and oat milk.",
  "The AI roadmap became sentient and resigned.",
  "Failed to retain users after the free hoodies ran out.",
  "Mistook investor confusion for product-market fit.",
  "Shipped a waitlist, then waited with everyone else."
];

const buzzwordLexicon = [
  "ai",
  "autonomous",
  "b2b",
  "blockchain",
  "cloud",
  "defensible",
  "disrupting",
  "enablement",
  "enterprise",
  "fractional",
  "growth",
  "hacking",
  "infrastructure",
  "leverage",
  "mindful",
  "monetized",
  "native",
  "operating",
  "productivity",
  "saas",
  "scale",
  "scalable",
  "stakeholder",
  "subscription",
  "synergy",
  "workflow"
];

export function createStartup({
  index,
  random = Math.random,
  tagline,
  domainHint = "unverified"
}: {
  index: number;
  random?: () => number;
  tagline?: string;
  domainHint?: string;
}): Startup {
  const prefix = pick(startupNameParts.prefixes, random);
  const core = pick(startupNameParts.cores, random);
  const suffix = pick(startupNameParts.suffixes, random);
  const name = `${prefix}${core}${suffix}`;
  const finalTagline = tagline ?? pick(fallbackTaglines, random);
  const pivotCount = 3 + Math.floor(random() * 10);
  const metrics = createMetrics({ index, pivotCount, random, tagline: finalTagline });
  const logoDomain = pick(logoDomains, random);

  return {
    id: `startup-${index}-${slugify(name)}-${Math.floor(random() * 100000)}`,
    name,
    tagline: finalTagline,
    founded: "Yesterday",
    died: "Also Yesterday",
    logoDomain,
    logoUrl: `https://logo.clearbit.com/${logoDomain}`,
    domainHint,
    metrics,
    causeOfDeath: pick(causesOfDeath, random),
    epitaph: "Founded: Yesterday. Died: Also Yesterday.",
    row: Math.floor(index / 4),
    mode: "generated",
    sector: deriveSector({ name, tagline: finalTagline, index }),
    resurrections: 0
  };
}

export function createCustomStartup(name: string, tagline: string, index = 0): Startup {
  const cleanedName = name.trim() || "UntitledPivot.ai";
  const cleanedTagline =
    tagline.trim() || "A stealth platform for monetizing ideas that should have stayed private.";

  return {
    ...createStartup({ index, tagline: cleanedTagline }),
    id: `custom-${Date.now()}-${slugify(cleanedName)}`,
    name: cleanedName,
    domainHint: "personally doomed",
    causeOfDeath: "Buried by founder request after a brief but expensive hallucination.",
    epitaph: "Dug by hand. Funded by vibes."
  };
}

export function generateStartups(count: number, offset = 0): Startup[] {
  return Array.from({ length: count }, (_, index) => createStartup({ index: index + offset }));
}

export function updateStartup(startups: Startup[], replacement: Startup): Startup[] {
  return startups.map((startup) => (startup.id === replacement.id ? replacement : startup));
}

export function withStartupTagline(startup: Startup, tagline: string): Startup {
  return {
    ...startup,
    tagline,
    metrics: {
      ...startup.metrics,
      buzzwordCount: countBuzzwords(tagline)
    }
  };
}

export function filterStartups(
  startups: Startup[],
  filters: {
    query?: string;
    sector?: StartupSector | "All";
  }
): Startup[] {
  const normalizedQuery = filters.query?.trim().toLowerCase() ?? "";
  const sector = filters.sector ?? "All";

  return startups.filter((startup) => {
    const matchesSector = sector === "All" || startup.sector === sector;
    const searchable = [
      startup.name,
      startup.tagline,
      startup.logoDomain,
      startup.domainHint,
      startup.sector,
      startup.causeOfDeath,
      startup.epitaph,
      startup.origin ?? ""
    ]
      .join(" ")
      .toLowerCase();

    return matchesSector && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}

export function calculateLeaderboard(startups: Startup[]): Leaderboard {
  if (startups.length === 0) {
    const placeholder = createStartup({ index: 0, tagline: "Nobody even applied to the accelerator." });
    return {
      mostPivots: placeholder,
      shortestLifespan: placeholder,
      mostBuzzwords: placeholder
    };
  }

  return {
    mostPivots: maxBy(startups, (startup) => startup.metrics.pivotCount),
    shortestLifespan: minBy(startups, (startup) => startup.metrics.lifespanHours),
    mostBuzzwords: maxBy(startups, (startup) => startup.metrics.buzzwordCount)
  };
}

export function getSeasonalEvent(date = new Date()): SeasonalEvent | null {
  const month = date.getMonth();

  if (month === 9) {
    return {
      key: "october",
      label: "October Acquisition Season",
      banner: "Halloween decorations are up. Due diligence is still missing."
    };
  }

  if (month === 0) {
    return {
      key: "january",
      label: "New Year New Pivot",
      banner: "Every tombstone has a resolution to become profitable by Q2."
    };
  }

  return null;
}

export const realStartups: Startup[] = [
  createRealStartup({
    index: 0,
    name: "Quibi",
    tagline: "Short-form video for people who already had phones and YouTube.",
    logoDomain: "quibi.com",
    founded: "2018",
    died: "2020",
    pivotCount: 4,
    sector: "Media",
    origin: "A real cautionary tale about confusing capital with demand."
  }),
  createRealStartup({
    index: 1,
    name: "Theranos",
    tagline: "Revolutionary blood-testing theater with a laboratory-shaped hole.",
    logoDomain: "theranos.com",
    founded: "2003",
    died: "2018",
    pivotCount: 9,
    sector: "Health",
    origin: "The real one hits different."
  }),
  createRealStartup({
    index: 2,
    name: "Vine",
    tagline: "Six seconds of culture, then years of everyone asking why it died.",
    logoDomain: "vine.co",
    founded: "2012",
    died: "2017",
    pivotCount: 2,
    sector: "Media",
    origin: "Proof that loved products can still get buried."
  }),
  createRealStartup({
    index: 3,
    name: "Juicero",
    tagline: "A connected press for squeezing venture capital out of packets.",
    logoDomain: "juicero.com",
    founded: "2013",
    died: "2017",
    pivotCount: 5,
    sector: "Hardware",
    origin: "Hardware is hard. Packets were not."
  }),
  createRealStartup({
    index: 4,
    name: "Pets.com",
    tagline: "Dot-com era logistics with a sock puppet and a burn rate.",
    logoDomain: "pets.com",
    founded: "1998",
    died: "2000",
    pivotCount: 3,
    sector: "Consumer",
    origin: "A mascot cannot carry unit economics."
  }),
  createRealStartup({
    index: 5,
    name: "Webvan",
    tagline: "Grocery delivery before the infrastructure, timing, or math worked.",
    logoDomain: "webvan.com",
    founded: "1996",
    died: "2001",
    pivotCount: 5,
    sector: "Consumer",
    origin: "Built the future too expensively."
  }),
  createRealStartup({
    index: 6,
    name: "MoviePass",
    tagline: "Unlimited movies, limited arithmetic.",
    logoDomain: "moviepass.com",
    founded: "2011",
    died: "2019",
    pivotCount: 11,
    sector: "Media",
    origin: "Users loved it. Margins did not."
  }),
  createRealStartup({
    index: 7,
    name: "CNN+",
    tagline: "Premium streaming news that got a shorter run than many onboarding flows.",
    logoDomain: "cnn.com",
    founded: "2022",
    died: "2022",
    pivotCount: 1,
    sector: "Media",
    origin: "Launched, blinked, vanished."
  })
];

function createRealStartup({
  index,
  name,
  tagline,
  logoDomain,
  founded,
  died,
  pivotCount,
  sector,
  origin
}: {
  index: number;
  name: string;
  tagline: string;
  logoDomain: string;
  founded: string;
  died: string;
  pivotCount: number;
  sector: StartupSector;
  origin: string;
}): Startup {
  const metrics = createMetrics({
    index,
    pivotCount,
    random: seededRandom(index + name.length),
    tagline
  });

  return {
    id: `real-${slugify(name)}`,
    name,
    tagline,
    founded,
    died,
    logoDomain,
    logoUrl: `https://logo.clearbit.com/${logoDomain}`,
    domainHint: "historically unavailable",
    metrics,
    causeOfDeath: causesOfDeath[index % causesOfDeath.length],
    epitaph: `Founded: ${founded}. Died: ${died}.`,
    row: Math.floor(index / 4),
    mode: "real",
    sector,
    resurrections: 0,
    origin
  };
}

function deriveSector({ name, tagline, index }: { name: string; tagline: string; index: number }): StartupSector {
  const text = `${name} ${tagline}`.toLowerCase();

  if (/\b(block|chain|crypto|token|dao|web3)\b/.test(text) || text.includes("blockchain")) {
    return "Crypto";
  }

  if (/\b(ai|neural|autonomous|model)\b/.test(text) || name.toLowerCase().includes(".ai")) {
    return "AI";
  }

  if (/\b(health|blood|wellness|mindful)\b/.test(text)) {
    return "Health";
  }

  if (/\b(video|media|stream|content)\b/.test(text)) {
    return "Media";
  }

  if (/\b(hardware|device|press|connected)\b/.test(text)) {
    return "Hardware";
  }

  if (/\b(cloud|stack|infra|grid|logic)\b/.test(text)) {
    return "Infrastructure";
  }

  if (/\b(consumer|marketplace|brand)\b/.test(text)) {
    return "Consumer";
  }

  return domainGraveOptions[index % domainGraveOptions.length];
}

function createMetrics({
  index,
  pivotCount,
  random,
  tagline
}: {
  index: number;
  pivotCount: number;
  random: () => number;
  tagline: string;
}): StartupMetrics {
  return {
    seriesA: Number((1.2 + random() * 48.7).toFixed(1)),
    pivotCount,
    totalUsers: 11 + Math.floor(random() * 90000),
    runwayDays: 2 + Math.floor(random() * 240),
    buzzwordCount: countBuzzwords(tagline),
    lifespanHours: 1 + (index % 13),
    valuation: 10 + Math.floor(random() * 990),
    burnMultiple: Number((1 + random() * 12).toFixed(1))
  };
}

function countBuzzwords(text: string): number {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return words.filter((word) => buzzwordLexicon.includes(word)).length;
}

function pick<T>(items: readonly T[], random: () => number): T {
  const index = Math.min(items.length - 1, Math.floor(random() * items.length));
  return items[index];
}

function maxBy<T>(items: readonly T[], score: (item: T) => number): T {
  return items.reduce((winner, item) => (score(item) > score(winner) ? item : winner));
}

function minBy<T>(items: readonly T[], score: (item: T) => number): T {
  return items.reduce((winner, item) => (score(item) < score(winner) ? item : winner));
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}
