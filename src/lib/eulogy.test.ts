import { describe, expect, test } from "vitest";
import { createOpenDataStartup } from "./realData";
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

  test("does not invent business metrics for real API-sourced startups", () => {
    const startup = createOpenDataStartup({
      index: 1,
      summary: {
        title: "Aereo",
        description: "Technology company",
        extract: "Aereo was a technology company based in New York City.",
        content_urls: {
          desktop: { page: "https://en.wikipedia.org/wiki/Aereo" }
        },
        wikibase_item: "Q4687964"
      },
      wikidata: {
        entities: {
          Q4687964: {
            claims: {
              P571: [{ mainsnak: { datavalue: { value: { time: "+2012-01-01T00:00:00Z" } } } }],
              P576: [{ mainsnak: { datavalue: { value: { time: "+2014-11-21T00:00:00Z" } } } }]
            }
          }
        }
      }
    });

    const eulogy = buildEulogy({
      startup,
      uselessFact: "Dr. Jack Kevorkian first patient has Alzheimer`s disease.",
      boredActivity: "learn calligraphy"
    });

    expect(eulogy.metrics).toEqual([
      "Founded: 2012 (Wikidata).",
      "Died: 2014 (Wikidata).",
      "Series/Funding: Not available from Wikipedia or Wikidata.",
      "Pivot Count: Not available from Wikipedia or Wikidata.",
      "Last Pivot: Not available from Wikipedia or Wikidata.",
      "Total Users: Not available from Wikipedia or Wikidata.",
      "Runway: Not available from Wikipedia or Wikidata.",
      "Valuation: Not available from Wikipedia or Wikidata.",
      "Source: Wikipedia + Wikidata Q4687964."
    ]);
    expect(eulogy.metrics.join(" ")).not.toContain("Kevorkian");
    expect(eulogy.cause).toBe(
      "Cause of Death: Specific cause is not available from Wikipedia or Wikidata. Recorded status: defunct/dissolved in open records."
    );
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
