// -----------------------------------------------------------------------------
/**
 * @fileoverview orders traceability — every scenario has a proving test
 *
 * ## Job To Be Done
 * Parse the colocated `orders.feature` and enforce the anchor both
 * ways: each AC of a scenario that is not `@todo` is named by a colocated
 * test title, and each AC a test title names is a scenario of the feature.
 * AC-17 is a colocated unit proof of the FE-3244 interim gate
 * `hidesOneTimePurchases()`. AC-22 is a named `@todo` gap: its playground
 * consumer proof shipped on the labs-nuxt orders e2e lane, which this MR does
 * not add (operator ruling 2026-10-05), so no test proves it here and the
 * guard does not demand one — a non-`@todo` AC with no proof still fails.
 *
 * The feature is executable under ADR-020 Amendment 5: the module's own
 * `orders.replay.int.test.ts` drives the six design 8.12 scenarios over the
 * recorded corpus. This spec also pins those six titles and the three AC3
 * scenarios that bdd.md names, and holds the step catalog to them: the catalog
 * drives exactly those six, half-matches none, defines no step nothing calls,
 * and fires each action id it declares.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof, or a gate reads a tag in place of a
 * test and stays green after the test is gone.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import { ORDERS_COVERED_ACTIONS, ordersSteps } from "./orders.steps";
import { includes, keys, map, reject, sortBy } from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const FEATURE = join(TEST_DIR, "orders.feature");

const DRIVEN_TITLES = [
  "A signed-in client reads the history",
  "A client moves between pages",
  "Each client column and comparison sets the history criteria",
  "The newest order comes first, and a sort keeps the page",
  "Search and filters live together",
  "The forced category survives each writer"
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
    if (!file.endsWith(".test.ts") || file === "orders.traceability.test.ts")
      continue;
    for (const ac of acIds(
      testTitles(readFileSync(join(TEST_DIR, file), "utf-8"))
    )) {
      proofs.set(ac, [...(proofs.get(ac) ?? []), file]);
    }
  }
  return proofs;
}

function provenAcs(): Set<string> {
  return new Set(colocatedProofs().keys());
}

// -----------------------------------------------------------------------------

describe("orders traceability — the feature", () => {
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
      join(TEST_DIR, "orders.traceability.test.ts"),
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

describe("orders traceability — the proofs", () => {
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

  it("AC-17 is proven by a colocated test title, the FE-3244 interim gate", () => {
    expect(colocatedProofs().has("AC-17")).toBe(true);
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

describe("orders traceability — the step catalog", () => {
  const featureText = readFileSync(FEATURE, "utf-8");
  const catalogSource = readFileSync(
    join(TEST_DIR, "orders.steps.ts"),
    "utf-8"
  );
  const check = createTraceabilityCheck(featureText, ordersSteps, stepCatalogs);

  it("the catalog drives exactly the six design 8.12 scenarios and half-matches none", () => {
    expect(sortBy(map(check.driveable, "name"))).toEqual(sortBy(DRIVEN_TITLES));
    expect(map(check.partial, "name")).toEqual([]);
  });

  it("the catalog defines no step nothing calls, no malformed pattern and no pattern another catalog claims", () => {
    expect(map(check.orphanStepDefs, "pattern")).toEqual([]);
    expect(map(check.malformedStepDefs, "pattern")).toEqual([]);
    expect(check.duplicatedPatterns).toEqual([]);
  });

  it("each action id the catalog declares is fired by a step", () => {
    expect(
      reject(keys(ORDERS_COVERED_ACTIONS), key =>
        includes(catalogSource, `ORDERS_COVERED_ACTIONS.${key}`)
      )
    ).toEqual([]);
  });
});
