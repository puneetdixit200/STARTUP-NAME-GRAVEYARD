export type GraveyardMode = "generated" | "real";
export type StartupSector =
  | "AI"
  | "Crypto"
  | "SaaS"
  | "Consumer"
  | "Media"
  | "Health"
  | "Hardware"
  | "Infrastructure";

export interface StartupMetrics {
  seriesA: number;
  pivotCount: number;
  totalUsers: number;
  runwayDays: number;
  buzzwordCount: number;
  lifespanHours: number;
  valuation: number;
  burnMultiple: number;
}

export interface Startup {
  id: string;
  name: string;
  tagline: string;
  founded: string;
  died: string;
  logoDomain: string;
  logoUrl: string;
  domainHint: string;
  metrics: StartupMetrics;
  causeOfDeath: string;
  epitaph: string;
  row: number;
  mode: GraveyardMode;
  sector: StartupSector;
  resurrections: number;
  origin?: string;
}

export interface Leaderboard {
  mostPivots: Startup;
  shortestLifespan: Startup;
  mostBuzzwords: Startup;
}

export interface SeasonalEvent {
  key: "october" | "january";
  label: string;
  banner: string;
}

export interface Eulogy {
  title: string;
  metrics: string[];
  cause: string;
  body: string;
}
