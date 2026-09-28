// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders traceability — every scenario has a proving test
 *
 * ## Job To Be Done
 * Parse the colocated `client-orders.feature` and enforce the anchor both
 * ways: each AC of a scenario that is not `@todo` is named by a test title,
 * and each AC a test title names is a scenario of the feature. Two proofs
 * live outside this directory, and each counts only through a test title:
 * AC-17 through the `brand.one-time-purchases*.int.test.ts` titles, never the
 * `brand.feature` tag, and AC-22 through a `test(` title of the labs-nuxt
 * lane spec that holds `@FE-3237` (bdd.md, deferral table).
 *
 * The feature is executable under ADR-020 Amendment 5: the labs-nuxt `bdd`
 * project drives the six design 8.12 scenarios. This spec also pins those six
 * titles and the three AC3 scenarios that bdd.md names.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof, or a gate reads a tag in place of a
 * test and stays green after the test is gone.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const FEATURE = join(TEST_DIR, "client-orders.feature");
const REPO_ROOT = join(TEST_DIR, "../../../../../..");
const BRAND_TESTS = join(
  REPO_ROOT,
  "packages/headless/src/modules/brand/__tests__"
);
const LANE_SPEC = join(
  REPO_ROOT,
  "playgrounds/labs-nuxt/tests/e2e/client-orders.spec.ts"
);

const DRIVEN_TITLES = [
  "A signed-in client reads the history",
  "A client moves between pages",
  "Each client column and comparison sets the history criteria",
  "The newest order comes first, and a sort keeps the page",
  "Search and filters live together",
  "The forced category survives each writer"
];

const BRAND_STATE_FILES = [
  "brand.one-time-purchases.int.test.ts",
  "brand.one-time-purchases-shown.int.test.ts",
  "brand.one-time-purchases-absent.int.test.ts"
];

type Scenario = {
  title: string;
  tags: string[];
  ac: string[];
  todoReason: boolean;
};

/** The contiguous comment lines right above line `index`. */
function commentAbove(lines: string[], index: number): string[] {
  const comment: string[] = [];
  for (
    let cursor = index - 1;
    cursor >= 0 && /^\s*#/.test(lines[cursor]);
    cursor--
  ) {
    comment.push(lines[cursor]);
  }
  return comment;
}

/** Each scenario of a feature with its tag line and the comment above it. */
function scenarios(path: string): Scenario[] {
  const lines = readFileSync(path, "utf-8").split("\n");
  const found: Scenario[] = [];
  for (let index = 0; index < lines.length; index++) {
    const title = lines[index].match(/^\s*Scenario(?: Outline)?:\s*(.+)$/);
    if (!title) continue;
    const tagLine = lines[index - 1] ?? "";
    const tags = tagLine.trim().startsWith("@")
      ? tagLine.trim().split(/\s+/)
      : [];
    found.push({
      title: title[1].trim(),
      tags,
      ac: tags.filter(tag => /^@AC-\d+$/.test(tag)).map(tag => tag.slice(1)),
      todoReason: commentAbove(lines, index - 1).some(line =>
        /@todo —/.test(line)
      )
    });
  }
  return found;
}

/** Every test title of a spec file: `describe`, `it`, `test`, their `.each` forms included. */
function testTitles(source: string, callee = "describe|it|test"): string[] {
  const pattern = new RegExp(
    `(?:^|[^.\\w])(?:${callee})(?:\\.(?:each\\((?:[^()]|\\([^()]*\\))*\\)|only|skip|concurrent))?\\s*\\(\\s*(["'\`])((?:(?!\\1).)*)\\1`,
    "gms"
  );
  return [...source.matchAll(pattern)].map(match => match[2]);
}

function acIds(titles: string[]): Set<string> {
  const ids = new Set<string>();
  for (const title of titles) {
    for (const match of title.matchAll(/\bAC-(\d+)\b/g))
      ids.add(`AC-${match[1]}`);
  }
  return ids;
}

/** The AC ids named by each colocated spec's titles. */
function colocatedProofs(): Map<string, string[]> {
  const proofs = new Map<string, string[]>();
  for (const file of readdirSync(TEST_DIR)) {
    if (
      !file.endsWith(".test.ts") ||
      file === "client-orders.traceability.test.ts"
    )
      continue;
    for (const ac of acIds(
      testTitles(readFileSync(join(TEST_DIR, file), "utf-8"))
    )) {
      proofs.set(ac, [...(proofs.get(ac) ?? []), file]);
    }
  }
  return proofs;
}

/** AC-17 is proven only when each brand state file names AC-17 in a test title. */
function brandProvesAc17(): boolean {
  return BRAND_STATE_FILES.every(file => {
    const path = join(BRAND_TESTS, file);
    return (
      existsSync(path) &&
      acIds(testTitles(readFileSync(path, "utf-8"))).has("AC-17")
    );
  });
}

/** AC-22 is proven only by a lane `test(` title that holds `@FE-3237`. */
function laneProvesAc22(): boolean {
  if (!existsSync(LANE_SPEC)) return false;
  return testTitles(readFileSync(LANE_SPEC, "utf-8"), "test").some(title =>
    title.includes("@FE-3237")
  );
}

function provenAcs(): Set<string> {
  const proven = new Set(colocatedProofs().keys());
  if (brandProvesAc17()) proven.add("AC-17");
  if (laneProvesAc22()) proven.add("AC-22");
  return proven;
}

// -----------------------------------------------------------------------------

describe("client-orders traceability — the feature", () => {
  const all = scenarios(FEATURE);

  it("the feature parses and tags 24 distinct AC ids, AC-1 to AC-24", () => {
    const ids = new Set(all.flatMap(scenario => scenario.ac));
    expect([...ids].sort()).toEqual(
      Array.from({ length: 24 }, (_, index) => `AC-${index + 1}`).sort()
    );
  });

  it("every scenario carries exactly one @AC-n tag and @FE-3237", () => {
    for (const scenario of all) {
      expect(scenario.ac, scenario.title).toHaveLength(1);
      expect(scenario.tags, scenario.title).toContain("@FE-3237");
    }
  });

  it("the six driven scenarios carry the design 8.12 titles, and AC-3 has three scenarios", () => {
    const titles = all.map(scenario => scenario.title);
    for (const title of DRIVEN_TITLES) expect(titles).toContain(title);
    expect(all.filter(scenario => scenario.ac[0] === "AC-3")).toHaveLength(3);
  });

  it("neither the feature header nor this spec header calls the feature non-executable", () => {
    const featureHeader = readFileSync(FEATURE, "utf-8").split(/^\s*@AC-/m)[0];
    const specHeader = readFileSync(
      join(TEST_DIR, "client-orders.traceability.test.ts"),
      "utf-8"
    ).split("*/")[0];
    for (const header of [featureHeader, specHeader]) {
      expect(header).not.toMatch(/non-executable|spec-only/i);
    }
  });

  it("every @todo scenario states its reason in the comment above it", () => {
    for (const scenario of all.filter(item => item.tags.includes("@todo"))) {
      expect(scenario.todoReason, scenario.title).toBe(true);
    }
  });
});

describe("client-orders traceability — the proofs", () => {
  const all = scenarios(FEATURE);
  const claimed = new Set(
    all
      .filter(scenario => !scenario.tags.includes("@todo"))
      .flatMap(scenario => scenario.ac)
  );
  const tagged = new Set(all.flatMap(scenario => scenario.ac));

  it("every AC of a scenario that is not @todo has at least one proving test title", () => {
    const proven = provenAcs();
    expect([...claimed].filter(ac => !proven.has(ac))).toEqual([]);
  });

  it("every AC a test title names is a scenario of the feature", () => {
    expect([...colocatedProofs().keys()].filter(ac => !tagged.has(ac))).toEqual(
      []
    );
  });

  it("AC-17 counts only through the brand state test titles, never through the brand.feature tag", () => {
    expect(brandProvesAc17()).toBe(true);
    expect(colocatedProofs().has("AC-17")).toBe(false);
  });

  it("the title reader ignores an AC id outside a test title", () => {
    const source = [
      "// AC-90 in a comment",
      'const label = "AC-91";',
      'describe("block (AC-92)", () => {',
      '  it.each([1, 2])("case %s (AC-93)", () => {});',
      '  test("lane @FE-3237 (AC-94)", () => {});',
      "});"
    ].join("\n");
    expect([...acIds(testTitles(source))].sort()).toEqual([
      "AC-92",
      "AC-93",
      "AC-94"
    ]);
    expect(testTitles('expect(x).toBe("@FE-3237")', "test")).toEqual([]);
  });
});
