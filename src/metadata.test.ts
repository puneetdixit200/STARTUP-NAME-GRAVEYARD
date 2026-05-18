import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("site metadata", () => {
  const indexHtml = readFileSync(join(process.cwd(), "index.html"), "utf8");

  test("uses the real startup cemetery browser title", () => {
    expect(indexHtml).toContain("<title>Startup Graveyard - Real Startup Cemetery</title>");
  });

  test("links a graveyard themed favicon", () => {
    expect(indexHtml).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
    expect(existsSync(join(process.cwd(), "public", "favicon.svg"))).toBe(true);
  });
});
