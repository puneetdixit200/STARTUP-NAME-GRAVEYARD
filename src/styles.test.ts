import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const styles = readFileSync(join(process.cwd(), "src", "styles.css"), "utf8");

function getRuleBody(selector: string): string {
  const rule = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`).exec(styles);
  return rule?.[1] ?? "";
}

describe("graveyard styles", () => {
  test("keeps tombstone transforms on the clickable page plane", () => {
    const tombstoneRule = getRuleBody(".tombstone");
    const activeRule = getRuleBody(".tombstone:hover,\n.tombstone.active");

    expect(`${tombstoneRule}\n${activeRule}`).not.toContain("translateZ");
  });
});
