/**
 * @fileoverview `contract-product.feature` ↔ test-suite anchor enforcement
 *
 * ## Job To Be Done
 * Ride this module's own suite and fail when a `contract-product.feature`
 * scenario's `@AC-n` id has no matching test in this `__tests__` tree (a
 * coverage hole the feature promises and nothing proves), or when a test
 * title's `AC-n` claim names an id no scenario in `contract-product.feature`
 * carries (a stale/untethered test asserting something the contract no
 * longer states). A `@todo`-tagged scenario is exempt from the first
 * direction.
 *
 * ## What Breaks If These Fail
 * `contract-product.feature` drifts from the suite silently — a capability
 * is promised and never proven, or a test outlives the capability it once
 * proved, and nobody notices either drift until a real regression ships.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const TESTS_DIR = import.meta.dirname;
const FEATURE_FILE = "contract-product.feature";

type ScenarioTag = { id: string; scenario: string; todo: boolean };

function parseFeatureTags(): ScenarioTag[] {
  const content = readFileSync(join(TESTS_DIR, FEATURE_FILE), "utf-8");
  const lines = content.split("\n");
  const found: ScenarioTag[] = [];
  let pendingTags: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("@")) {
      pendingTags.push(...trimmed.split(/\s+/));
      continue;
    }
    const scenarioMatch = /^Scenario(?: Outline)?:\s*(.+)$/.exec(trimmed);
    if (scenarioMatch) {
      const acTags = pendingTags.filter(tag => /^@AC-\d+$/.test(tag));
      const todo = pendingTags.includes("@todo");
      for (const tag of acTags) {
        found.push({
          id: tag.replace("@", ""),
          scenario: scenarioMatch[1],
          todo
        });
      }
      pendingTags = [];
      continue;
    }
    if (trimmed.length > 0 && !trimmed.startsWith("#")) {
      pendingTags = [];
    }
  }
  return found;
}

function testFileContents(): { file: string; content: string }[] {
  return readdirSync(TESTS_DIR)
    .filter(
      name =>
        (name.endsWith(".test.ts") || name.endsWith(".int.test.ts")) &&
        name !== "contract-product.traceability.test.ts"
    )
    .map(file => ({
      file,
      content: readFileSync(join(TESTS_DIR, file), "utf-8")
    }));
}

/**
 * Named, reviewed exceptions — never a silent hole. See `receipts.md`
 * "Outstanding gaps" for the reason each one is here rather than proven:
 * AC-2 and AC-18 need a `client-personal-details` preference-read capture
 * that does not exist on disk; AC-19 needs a grouped-by-category capture
 * that does not exist on disk; recording is forbidden this pass. AC-10
 * needs `isDue`/`isCancellable`'s exact export surface, which sits in a
 * `*.ts` file the prover's Read-block law puts out of reach this pass.
 */
const KNOWN_GAPS = new Set(["AC-2", "AC-18", "AC-19", "AC-10"]);

describe("contract-product — every contract-product.feature @AC-n scenario is anchored to a real test (traceability)", () => {
  const scenarios = parseFeatureTags();
  const files = testFileContents();
  const allTestContent = files.map(f => f.content).join("\n");

  it("names at least one @AC-n scenario, so this check itself is not vacuous", () => {
    expect(scenarios.length).toBeGreaterThan(0);
  });

  it.each(
    scenarios.filter(scenario => !scenario.todo && !KNOWN_GAPS.has(scenario.id))
  )(
    "$id ($scenario) has a matching test in this module's __tests__ tree",
    ({ id }) => {
      const idPattern = new RegExp(`\\b${id}\\b`);
      expect(idPattern.test(allTestContent)).toBe(true);
    }
  );

  it("names no test-TITLE AC-n claim absent from contract-product.feature (no stale/untethered test)", () => {
    const featureIds = new Set(scenarios.map(scenario => scenario.id));
    const claimed = new Set<string>();
    const titlePattern =
      /\b(?:it|describe|it\.each)\s*\(\s*["'`]([^"'`]*)["'`]/g;
    for (const { content } of files) {
      for (const titleMatch of content.matchAll(titlePattern)) {
        for (const idMatch of titleMatch[1].matchAll(/\bAC-\d+\b/g)) {
          claimed.add(idMatch[0]);
        }
      }
    }
    const untethered = [...claimed].filter(id => !featureIds.has(id));
    expect(untethered).toEqual([]);
  });
});
