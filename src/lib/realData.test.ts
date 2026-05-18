import { describe, expect, test } from "vitest";
import { createOpenDataStartup, readWikipediaCategoryTitles } from "./realData";

describe("open real company data", () => {
  test("reads real company names from a Wikipedia category response", () => {
    const titles = readWikipediaCategoryTitles({
      query: {
        categorymembers: [
          { ns: 0, title: "Aereo" },
          { ns: 14, title: "Category:Defunct websites" },
          { ns: 0, title: "Alexa Internet" }
        ]
      }
    });

    expect(titles).toEqual(["Aereo", "Alexa Internet"]);
  });

  test("maps Wikipedia summary and Wikidata claims into a grave", () => {
    const startup = createOpenDataStartup({
      index: 2,
      summary: {
        title: "Aereo",
        description: "Technology company",
        extract: "Aereo was a technology company based in New York City.",
        thumbnail: { source: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Aereo_logo.png" },
        content_urls: {
          desktop: { page: "https://en.wikipedia.org/wiki/Aereo" }
        },
        wikibase_item: "Q4687964"
      },
      wikidata: {
        entities: {
          Q4687964: {
            claims: {
              P571: [
                {
                  mainsnak: {
                    datavalue: {
                      value: { time: "+2012-01-01T00:00:00Z" }
                    }
                  }
                }
              ],
              P576: [
                {
                  mainsnak: {
                    datavalue: {
                      value: { time: "+2014-11-21T00:00:00Z" }
                    }
                  }
                }
              ],
              P856: [
                {
                  mainsnak: {
                    datavalue: {
                      value: "https://aereo.com"
                    }
                  }
                }
              ]
            }
          }
        }
      }
    });

    expect(startup.name).toBe("Aereo");
    expect(startup.tagline).toBe("Technology company");
    expect(startup.founded).toBe("2012");
    expect(startup.died).toBe("2014");
    expect(startup.logoUrl).toBe("https://upload.wikimedia.org/wikipedia/commons/f/fd/Aereo_logo.png");
    expect(startup.logoDomain).toBe("aereo.com");
    expect(startup.sourceUrl).toBe("https://en.wikipedia.org/wiki/Aereo");
    expect(startup.wikidataId).toBe("Q4687964");
    expect(startup.origin).toContain("Aereo was a technology company");
  });
});
