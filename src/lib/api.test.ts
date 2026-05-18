import { afterEach, describe, expect, test, vi } from "vitest";
import { fetchOpenDataStartups } from "./api";

describe("open data API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("fetches real defunct companies from Wikimedia sources", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes("categorymembers")) {
        return jsonResponse({
          query: {
            categorymembers: [{ ns: 0, title: "Aereo" }]
          }
        });
      }

      if (url.includes("/page/summary/")) {
        return jsonResponse({
          title: "Aereo",
          description: "Technology company",
          extract: "Aereo was a technology company based in New York City.",
          wikibase_item: "Q4687964",
          content_urls: {
            desktop: { page: "https://en.wikipedia.org/wiki/Aereo" }
          }
        });
      }

      if (url.includes("Special:EntityData")) {
        return jsonResponse({
          entities: {
            Q4687964: {
              claims: {
                P571: [{ mainsnak: { datavalue: { value: { time: "+2012-01-01T00:00:00Z" } } } }],
                P576: [{ mainsnak: { datavalue: { value: { time: "+2014-11-21T00:00:00Z" } } } }]
              }
            }
          }
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const startups = await fetchOpenDataStartups(1);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(startups).toHaveLength(1);
    expect(startups[0]).toMatchObject({
      name: "Aereo",
      founded: "2012",
      died: "2014",
      sourceUrl: "https://en.wikipedia.org/wiki/Aereo",
      wikidataId: "Q4687964"
    });
  });
});

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: async () => body
  } as Response;
}
