import { afterEach, describe, expect, test, vi } from "vitest";
import { fetchOpenDataStartups } from "./api";

describe("open data API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("combines Killed by Google records with Wikimedia companies", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes("killedbygoogle") && url.includes("graveyard.json")) {
        return jsonResponse([
          {
            name: "Google Stadia",
            dateOpen: "2019-11-19",
            dateClose: "2023-01-18",
            description: "Google Stadia was a cloud gaming service.",
            type: "service",
            link: "https://www.theverge.com/2022/9/29/23378713/google-stadia-shutting-down-game-streaming-january-2023/"
          },
          {
            name: "Google Reader",
            dateOpen: "2005-10-07",
            dateClose: "2013-07-01",
            description: "Google Reader was an RSS feed reader.",
            type: "service",
            link: "https://en.wikipedia.org/wiki/Google_Reader"
          }
        ]);
      }

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

    const startups = await fetchOpenDataStartups(2);

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(startups).toHaveLength(2);
    expect(startups[0]).toMatchObject({
      name: "Google Stadia",
      founded: "2019",
      died: "2023",
      sourceUrl:
        "https://www.theverge.com/2022/9/29/23378713/google-stadia-shutting-down-game-streaming-january-2023/",
      dataSource: "Killed by Google"
    });
    expect(startups[1]).toMatchObject({
      name: "Aereo",
      founded: "2012",
      died: "2014",
      sourceUrl: "https://en.wikipedia.org/wiki/Aereo",
      wikidataId: "Q4687964",
      dataSource: "Wikipedia + Wikidata"
    });
  });
});

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: async () => body
  } as Response;
}
