import { describe, expect, test } from "vitest";
import { createStartup } from "./startupGenerator";
import { buildEulogy, resurrectStartup } from "./eulogy";

describe("eulogies", () => {
  test("builds savage eulogy copy from trivia and pivot activity", () => {
    const startup = createStartup({
      index: 0,
      random: () => 0.4,
      tagline: "Disrupting mindful leverage."
    });

    const eulogy = buildEulogy({
      startup,
      uselessFact: "Bananas are berries.",
      boredActivity: "learn calligraphy"
    });

    expect(eulogy.title).toContain(startup.name);
    expect(eulogy.metrics).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Series A: Raised \$\d+\.\dM/),
        expect.stringContaining("Last Pivot: We're now a learn calligraphy platform"),
        expect.stringContaining("Total Users: Bananas are berries.")
      ])
    );
    expect(eulogy.body).toContain("They disrupted nothing");
  });

  test("resurrecting a startup pivots it to crypto and records a second death", () => {
    const startup = createStartup({
      index: 0,
      random: () => 0.2,
      tagline: "Enterprise leverage at scale."
    });

    const resurrected = resurrectStartup(startup);

    expect(resurrected.resurrections).toBe(1);
    expect(resurrected.tagline).toContain("DAO");
    expect(resurrected.epitaph).toBe("Died again. This time as a DAO.");
  });
});
