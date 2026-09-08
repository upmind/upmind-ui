import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * tasks.md 6.6 / AC7.2 — a portal file reaching for a design-system
 * component's raw PARTS instead of its composed form must carry a
 * ui-gaps.md row naming the file and at least one of the parts it reached
 * for.
 *
 * The family list and the reach list are both COMPUTED from the source
 * tree, never hand-maintained. Every family shipping a `parts/` dir
 * qualifies, whether or not its composed form declares an `items` prop —
 * gating on `items` alone left 34 of this tree's 53 part-shipping families
 * invisible (an injected Tooltip reach proved it: stayed green).
 *
 * Three exceptions are named explicitly because no import-graph signal
 * tells them apart from a genuine reach:
 * - `Shell`, `Page`: this epic's sanctioned direct-composition seam
 *   (design.md §D2, §D7) — composing their parts IS the design.
 * - `StatGroup`: `stat/parts/` holds nothing else, and `StatGroup` is
 *   itself barrel-exported and registry-declared (`exports: ["Stat",
 *   "StatGroup"]`) as the sanctioned way to render a group — not a raw
 *   primitive standing in for a composed form that doesn't exist.
 * - `TooltipProvider`: a root-scoped context wrapper (reka-ui's own
 *   `TooltipProvider`) that must wrap the tree exactly once; it is not an
 *   alternative to the composed `Tooltip` per instance.
 *
 * The row check requires a reach's OWN record — a table row naming both
 * the reaching file and one of its parts — rather than a part name found
 * anywhere in the file, which let an unrelated row's coincidental mention
 * of the same part stand in for a second, un-recorded reach.
 */
const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(TESTS_DIR, "..", "app");
const DS_COMPONENTS_DIR = join(
  TESTS_DIR,
  "..",
  "..",
  "..",
  "design-system",
  "packages",
  "ui",
  "src",
  "components"
);
const UI_GAPS_PATH = join(TESTS_DIR, "..", "ui-gaps.md");

const SANCTIONED_DIRECT_COMPOSITION_FAMILIES = new Set(["Shell", "Page"]);
const SANCTIONED_STANDALONE_PARTS = new Set(["StatGroup", "TooltipProvider"]);

function vueFilesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...vueFilesUnder(full));
    else if (entry.name.endsWith(".vue")) out.push(full);
  }
  return out;
}

/** Maps every non-exempt part's exported name to its composed sibling's name. */
function buildPartsMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const slug of readdirSync(DS_COMPONENTS_DIR, { withFileTypes: true })) {
    if (!slug.isDirectory()) continue;
    const slugDir = join(DS_COMPONENTS_DIR, slug.name);
    const partsDir = join(slugDir, "parts");
    if (!existsSync(partsDir)) continue;

    const composedFile = readdirSync(slugDir).find(
      f => f.endsWith(".vue") && !f.includes(".stories")
    );
    if (!composedFile) continue;
    const composedName = composedFile.replace(/\.vue$/, "");
    if (SANCTIONED_DIRECT_COMPOSITION_FAMILIES.has(composedName)) continue;

    for (const part of readdirSync(partsDir)) {
      if (!part.endsWith(".vue")) continue;
      const partName = part.replace(/\.vue$/, "");
      if (SANCTIONED_STANDALONE_PARTS.has(partName)) continue;
      map.set(partName, composedName);
    }
  }
  return map;
}

function importedUiNames(source: string): string[] {
  const names: string[] = [];
  for (const match of source.matchAll(
    /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*"@upmind\/ui"/gs
  )) {
    for (const raw of match[1].split(",")) {
      const name = raw
        .trim()
        .split(/\s+as\s+/)[0]
        ?.trim();
      if (name) names.push(name);
    }
  }
  return names;
}

type Reach = {
  readonly file: string;
  readonly composed: string;
  readonly parts: string[];
};

function findReaches(): Reach[] {
  const partsMap = buildPartsMap();
  const reaches: Reach[] = [];

  for (const file of vueFilesUnder(APP_DIR)) {
    const imported = new Set(importedUiNames(readFileSync(file, "utf8")));
    const byComposed = new Map<string, string[]>();
    for (const name of imported) {
      const composed = partsMap.get(name);
      if (!composed) continue;
      const parts = byComposed.get(composed) ?? [];
      parts.push(name);
      byComposed.set(composed, parts);
    }
    for (const [composed, parts] of byComposed) {
      if (!imported.has(composed)) reaches.push({ file, composed, parts });
    }
  }
  return reaches;
}

/** Table data rows only — excludes the header separator and any prose. */
function dataRows(gapsText: string): string[] {
  return gapsText
    .split("\n")
    .filter(line => line.startsWith("|") && !/^\|[\s-]+\|/.test(line));
}

function reachIsRecorded(reach: Reach, rows: string[]): boolean {
  const basename = reach.file.split("/").pop() ?? reach.file;
  return rows.some(
    row =>
      row.includes(basename) && reach.parts.some(part => row.includes(part))
  );
}

const reaches = findReaches();
const rows = dataRows(readFileSync(UI_GAPS_PATH, "utf8"));

describe("ui-gaps.md — AC7.2: every parts-over-composed reach in the tree is recorded", () => {
  it("the mechanism is live, not vacuous — it still finds this epic's own known reaches", () => {
    expect(reaches.map(r => r.composed)).toEqual(
      expect.arrayContaining(["List", "SidebarNav", "Select"])
    );
  });

  it("the sanctioned direct-composition seam is never flagged", () => {
    expect(
      reaches.some(r => r.composed === "Shell" || r.composed === "Page")
    ).toBe(false);
  });

  it("a family whose only part is itself a standalone composed shape is never flagged", () => {
    expect(reaches.some(r => r.composed === "Stat")).toBe(false);
  });

  it("the app-root Tooltip context provider is never flagged as a Tooltip reach", () => {
    expect(reaches.some(r => r.composed === "Tooltip")).toBe(false);
  });

  it.each(
    reaches.map(r => ({
      label: `${r.file.replace(`${APP_DIR}/`, "app/")} -> ${r.composed} (${r.parts.join(", ")})`,
      reach: r
    }))
  )("$label has its own ui-gaps.md row", ({ reach }) => {
    expect(reachIsRecorded(reach, rows)).toBe(true);
  });
});
