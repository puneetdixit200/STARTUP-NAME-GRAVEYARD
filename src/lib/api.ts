import type { Startup } from "../types";
import { MAX_GRAVES_PER_GRAVEYARD } from "./startupGenerator";
import { createOpenDataStartup, readWikipediaCategoryTitles } from "./realData";

const CORPORATE_BS_URL = "https://corporatebs-generator.sameerkumar.website/";
const BORED_URL = "https://bored-api.appbrewery.com/random";
const USELESS_FACT_URL = "https://uselessfacts.jsph.pl/api/v2/facts/random";
const DOMAINS_URL = "https://api.domainsdb.info/v1/domains/search";
const WIKIPEDIA_CATEGORY_URL = "https://en.wikipedia.org/w/api.php";
const WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary";
const WIKIDATA_ENTITY_URL = "https://www.wikidata.org/wiki/Special:EntityData";

const realCompanyCategories = [
  "Category:Defunct_online_companies_of_the_United_States",
  "Category:Defunct_software_companies_of_the_United_States",
  "Category:Defunct_websites"
];

const fallbackActivities = [
  "teach houseplants agile",
  "monetize eye contact",
  "build a marketplace for unused calendars",
  "gamify apology emails",
  "tokenize office snacks",
  "streamline meetings about meetings"
];

const fallbackFacts = [
  "The average investor nodded 14 times without understanding the product.",
  "A landing page can outlive the company by several fiscal quarters.",
  "Every unread onboarding email becomes a metric if exported to CSV.",
  "Most pitch decks contain exactly one graph pointing upward."
];

const fallbackTaglines = [
  "Disrupting cross-functional mindfulness with AI-native leverage.",
  "Enabling blockchain-ready teams to operationalize scalable regret.",
  "A zero-friction platform for stakeholder alignment and calendar sorrow.",
  "Cloud-first synergy for founders who pivot before lunch."
];

export async function fetchBuzzwordBatch(count: number): Promise<string[]> {
  const requests = Array.from({ length: count }, () => fetchBuzzwordTagline());
  return Promise.all(requests);
}

export async function fetchBuzzwordTagline(): Promise<string> {
  try {
    const data = await fetchJson(CORPORATE_BS_URL);
    return normalizeBuzzword(data) ?? randomFallback(fallbackTaglines);
  } catch {
    return randomFallback(fallbackTaglines);
  }
}

export async function fetchEulogyIngredients(): Promise<{
  uselessFact: string;
  boredActivity: string;
}> {
  const [uselessFact, boredActivity] = await Promise.all([fetchUselessFact(), fetchBoredActivity()]);
  return { uselessFact, boredActivity };
}

export async function fetchOpenDataStartups(limit = MAX_GRAVES_PER_GRAVEYARD): Promise<Startup[]> {
  const cappedLimit = Math.max(0, Math.min(limit, MAX_GRAVES_PER_GRAVEYARD));
  if (cappedLimit === 0) {
    return [];
  }

  const titles = await fetchOpenDataTitles(cappedLimit);
  const summaries = await Promise.all(titles.map((title) => fetchWikipediaSummary(title)));
  const startups = await Promise.all(
    summaries
      .filter((summary): summary is Record<string, unknown> => Boolean(summary))
      .map(async (summary, index) => {
        const wikidataId = typeof summary.wikibase_item === "string" ? summary.wikibase_item : null;
        const wikidata = wikidataId ? await fetchWikidataEntity(wikidataId) : null;
        return createOpenDataStartup({ index, summary, wikidata });
      })
  );

  return startups.slice(0, cappedLimit);
}

export async function fetchDomainHint(startup: Startup): Promise<string> {
  const baseName = startup.name.toLowerCase().replace(/\.(ai|io)$/i, "").replace(/[^a-z0-9-]/g, "");

  if (!baseName) {
    return "domain already emotionally unavailable";
  }

  try {
    const data = await fetchJson(`${DOMAINS_URL}?domain=${encodeURIComponent(baseName)}`);
    const domains = readArrayField(data, "domains");
    return domains.length > 0 ? `${domains.length} lookalike domains already lurking` : "no exact ghosts found";
  } catch {
    return "domain oracle refused comment";
  }
}

async function fetchOpenDataTitles(limit: number): Promise<string[]> {
  const titles: string[] = [];

  for (const category of realCompanyCategories) {
    if (titles.length >= limit) {
      break;
    }

    const url = new URL(WIKIPEDIA_CATEGORY_URL);
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "categorymembers");
    url.searchParams.set("cmtitle", category);
    url.searchParams.set("cmlimit", String(limit - titles.length));
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const data = await fetchJson(url.toString());
    titles.push(...readWikipediaCategoryTitles(data));
  }

  return Array.from(new Set(titles)).slice(0, limit);
}

async function fetchWikipediaSummary(title: string): Promise<Record<string, unknown> | null> {
  try {
    const data = await fetchJson(`${WIKIPEDIA_SUMMARY_URL}/${encodeURIComponent(title)}`);
    return data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function fetchWikidataEntity(entityId: string): Promise<unknown> {
  try {
    return await fetchJson(`${WIKIDATA_ENTITY_URL}/${encodeURIComponent(entityId)}.json`);
  } catch {
    return null;
  }
}

async function fetchUselessFact(): Promise<string> {
  try {
    const data = await fetchJson(USELESS_FACT_URL);
    return readText(data, ["text", "fact"]) ?? randomFallback(fallbackFacts);
  } catch {
    return randomFallback(fallbackFacts);
  }
}

async function fetchBoredActivity(): Promise<string> {
  try {
    const data = await fetchJson(BORED_URL);
    return readText(data, ["activity"])?.toLowerCase() ?? randomFallback(fallbackActivities);
  } catch {
    return randomFallback(fallbackActivities);
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

function normalizeBuzzword(data: unknown): string | null {
  if (typeof data === "string") {
    return cleanSentence(data);
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["phrase", "buzzword", "bs", "text", "result"]) {
      if (typeof record[key] === "string") {
        return cleanSentence(record[key]);
      }
    }
  }

  return null;
}

function readText(data: unknown, fields: string[]): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  for (const field of fields) {
    if (typeof record[field] === "string" && record[field].trim()) {
      return cleanSentence(record[field]);
    }
  }

  return null;
}

function readArrayField(data: unknown, field: string): unknown[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const value = (data as Record<string, unknown>)[field];
  return Array.isArray(value) ? value : [];
}

function cleanSentence(value: string): string {
  const trimmed = value.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function randomFallback(values: string[]): string {
  return values[Math.floor(Math.random() * values.length)];
}
