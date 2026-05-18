import type { Startup, StartupSector } from "../types";
import { createStartup, domainGraveOptions } from "./startupGenerator";

interface WikipediaSummary {
  title?: unknown;
  description?: unknown;
  extract?: unknown;
  thumbnail?: {
    source?: unknown;
  };
  content_urls?: {
    desktop?: {
      page?: unknown;
    };
  };
  wikibase_item?: unknown;
}

export interface KilledByGoogleItem {
  name?: unknown;
  dateOpen?: unknown;
  dateClose?: unknown;
  description?: unknown;
  type?: unknown;
  link?: unknown;
}

export function readWikipediaCategoryTitles(data: unknown): string[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const categoryMembers = (data as { query?: { categorymembers?: unknown } }).query?.categorymembers;
  if (!Array.isArray(categoryMembers)) {
    return [];
  }

  return categoryMembers
    .filter((item): item is { ns: number; title: string } => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const record = item as Record<string, unknown>;
      return record.ns === 0 && typeof record.title === "string" && record.title.trim().length > 0;
    })
    .map((item) => item.title);
}

export function createOpenDataStartup({
  index,
  summary,
  wikidata
}: {
  index: number;
  summary: WikipediaSummary;
  wikidata?: unknown;
}): Startup {
  const name = readString(summary.title) ?? "Unnamed defunct company";
  const tagline = readString(summary.description) ?? "Defunct company";
  const sourceUrl = readString(summary.content_urls?.desktop?.page) ?? undefined;
  const wikidataId = readString(summary.wikibase_item) ?? undefined;
  const founded = readWikidataYear(wikidata, wikidataId, ["P571"]) ?? "Unknown";
  const died = readWikidataYear(wikidata, wikidataId, ["P576", "P3999"]) ?? "Unknown";
  const officialWebsite = readWikidataString(wikidata, wikidataId, "P856");
  const logoDomain = domainFromUrl(officialWebsite) ?? domainFromUrl(sourceUrl) ?? "wikipedia.org";
  const logoUrl =
    readString(summary.thumbnail?.source) ??
    (officialWebsite ? `https://logo.clearbit.com/${logoDomain}` : "https://upload.wikimedia.org/wikipedia/commons/6/63/Wikipedia-logo.png");

  return {
    ...createStartup({
      index,
      random: seededRandom(index + name.length),
      tagline,
      domainHint: "sourced from Wikipedia and Wikidata"
    }),
    id: `real-open-${slugify(name)}`,
    name,
    tagline,
    founded,
    died,
    logoDomain,
    logoUrl,
    domainHint: wikidataId ? `Wikidata ${wikidataId}` : "Wikipedia summary only",
    causeOfDeath: died === "Unknown" ? "Documented as defunct, but the tombstone paperwork is incomplete." : "Documented as defunct in open public records.",
    epitaph: `Founded: ${founded}. Died: ${died}.`,
    mode: "real",
    sector: inferSector({ name, tagline, index }),
    origin: readString(summary.extract) ?? `Source: ${sourceUrl ?? "Wikipedia"}`,
    sourceUrl,
    wikidataId,
    dataSource: wikidataId ? "Wikipedia + Wikidata" : "Wikipedia"
  };
}

export function createKilledByGoogleStartup({
  index,
  item
}: {
  index: number;
  item: KilledByGoogleItem;
}): Startup {
  const name = readString(item.name) ?? "Unnamed Google product";
  const type = readString(item.type) ?? "product";
  const description = readString(item.description) ?? `A discontinued Google ${type}.`;
  const sourceUrl = readString(item.link) ?? "https://killedbygoogle.com/";
  const founded = readIsoYear(item.dateOpen) ?? "Unknown";
  const died = readIsoYear(item.dateClose) ?? "Unknown";

  return {
    ...createStartup({
      index,
      random: seededRandom(index + name.length + 9000),
      tagline: description,
      domainHint: "Killed by Google dataset"
    }),
    id: `real-google-${slugify(name)}`,
    name,
    tagline: description,
    founded,
    died,
    logoDomain: "google.com",
    logoUrl: "https://logo.clearbit.com/google.com",
    domainHint: "Killed by Google dataset",
    causeOfDeath: "Listed as discontinued in the Killed by Google public dataset.",
    epitaph: `Launched: ${founded}. Killed: ${died}.`,
    mode: "real",
    sector: inferSector({ name, tagline: `${description} ${type}`, index }),
    origin: description,
    sourceUrl,
    dataSource: "Killed by Google"
  };
}

function readWikidataYear(data: unknown, entityId: string | null | undefined, propertyIds: string[]): string | null {
  const entity = readWikidataEntity(data, entityId);
  if (!entity) {
    return null;
  }

  for (const propertyId of propertyIds) {
    const claim = entity.claims?.[propertyId]?.[0];
    const value = claim?.mainsnak?.datavalue?.value;
    if (value && typeof value === "object" && typeof value.time === "string") {
      const match = /^[-+]?(\d{4})/.exec(value.time);
      if (match) {
        return match[1];
      }
    }
  }

  return null;
}

function readWikidataString(data: unknown, entityId: string | null | undefined, propertyId: string): string | null {
  const entity = readWikidataEntity(data, entityId);
  const value = entity?.claims?.[propertyId]?.[0]?.mainsnak?.datavalue?.value;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readWikidataEntity(data: unknown, entityId: string | null | undefined): WikidataEntity | null {
  if (!data || !entityId || typeof data !== "object") {
    return null;
  }

  const entity = (data as { entities?: Record<string, unknown> }).entities?.[entityId];
  return entity && typeof entity === "object" ? (entity as WikidataEntity) : null;
}

interface WikidataEntity {
  claims?: Record<
    string,
    Array<{
      mainsnak?: {
        datavalue?: {
          value?: {
            time?: string;
          } | string;
        };
      };
    }>
  >;
}

function inferSector({ name, tagline, index }: { name: string; tagline: string; index: number }): StartupSector {
  const text = `${name} ${tagline}`.toLowerCase();

  if (/\b(video|television|media|stream|broadcast|news|music|entertainment|website)\b/.test(text)) {
    return "Media";
  }

  if (/\b(software|internet|technology|online|web|search|platform|app)\b/.test(text)) {
    return "SaaS";
  }

  if (/\b(health|medical|blood|biotech|pharma)\b/.test(text)) {
    return "Health";
  }

  if (/\b(hardware|device|computer|electronics)\b/.test(text)) {
    return "Hardware";
  }

  if (/\b(retail|consumer|marketplace|commerce|shopping)\b/.test(text)) {
    return "Consumer";
  }

  return domainGraveOptions[index % domainGraveOptions.length];
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readIsoYear(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = /^(\d{4})/.exec(value.trim());
  return match ? match[1] : null;
}

function domainFromUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
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
