import { describe, expect, test } from "vitest";
import {
  calculateLeaderboard,
  createStartup,
  getSeasonalEvent,
  realStartups,
  startupNameParts
} from "./startupGenerator";

const riggedRandom = (values: number[]) => {
  let index = 0;
  return () => values[index++ % values.length];
};

describe("startup generation", () => {
  test("creates a startup with deterministic name, fake death data, and logo domain", () => {
    const startup = createStartup({
      index: 4,
      random: riggedRandom([0.7, 0.2, 0.1, 0.3, 0.4, 0.5]),
      tagline: "Disrupting mindful synergy through blockchain-enabled growth hacking.",
      domainHint: "available-ish"
    });

    expect(startup.name).toBe("NeuralForge.io");
    expect(startup.tagline).toContain("mindful synergy");
    expect(startup.founded).toBe("Yesterday");
    expect(startup.died).toBe("Also Yesterday");
    expect(startup.logoDomain).toMatch(/\.(com|io|ai)$/);
    expect(startup.domainHint).toBe("available-ish");
    expect(startup.metrics.pivotCount).toBeGreaterThanOrEqual(3);
    expect(startup.metrics.pivotCount).toBeLessThanOrEqual(12);
  });

  test("name algorithm combines configured prefixes, cores, and suffixes", () => {
    expect(startupNameParts.prefixes).toContain("Quantum");
    expect(startupNameParts.cores).toContain("Forge");
    expect(startupNameParts.suffixes).toContain(".ai");
  });

  test("leaderboard surfaces highest pivots, shortest lifespan, and noisiest tagline", () => {
    const entries = [
      createStartup({ index: 0, random: riggedRandom([0, 0, 0, 0.1]), tagline: "AI" }),
      createStartup({
        index: 1,
        random: riggedRandom([0.2, 0.2, 0.2, 0.95]),
        tagline: "Disrupting scalable mindful leverage through blockchain synergy"
      }),
      createStartup({ index: 2, random: riggedRandom([0.4, 0.4, 0.4, 0.5]), tagline: "B2B SaaS" })
    ];

    const leaderboard = calculateLeaderboard(entries);

    expect(leaderboard.mostPivots.id).toBe(entries[1].id);
    expect(leaderboard.shortestLifespan.id).toBe(entries[0].id);
    expect(leaderboard.mostBuzzwords.id).toBe(entries[1].id);
  });

  test("real graveyard mode includes curated dead startups", () => {
    expect(realStartups.map((startup) => startup.name)).toEqual(
      expect.arrayContaining(["Quibi", "Theranos", "Vine"])
    );
  });

  test("seasonal events return January and October themes only", () => {
    expect(getSeasonalEvent(new Date("2026-01-03"))!.label).toMatch(/New Year/i);
    expect(getSeasonalEvent(new Date("2026-10-13"))!.label).toMatch(/October/i);
    expect(getSeasonalEvent(new Date("2026-05-18"))).toBeNull();
  });
});
