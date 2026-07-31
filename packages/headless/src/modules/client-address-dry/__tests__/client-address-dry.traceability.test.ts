/**
 * @fileoverview client-address-dry — feature <-> test traceability (unit)
 *
 * ## Job To Be Done
 * `client-address-dry.feature` is the module's non-executable behavioural
 * source of truth. This test keeps it honest against the real suite, both
 * ways:
 *   - every scenario (except ones tagged @todo) is proven by at least one
 *     test that names its @AC-* id — a scenario with no test is a coverage
 *     hole;
 *   - every AC-* id a test names exists as a scenario — a test tethered to a
 *     scenario that isn't there is untethered / stale.
 * It is the anchor the factory promises ("a scenario with no proving test is
 * a visible coverage hole, a behavioural test with no scenario is
 * untethered", `.claude/skills/scoped-composable-factory/SKILL.md`). It is a
 * test, not a CI gate — it rides the module's own suite.
 *
 * @precedent `client-phone-dry.traceability.test.ts` — identical mechanism,
 * this file only substitutes the module name.
 *
 * ## Layer
 * Unit — reads sibling source files off disk; crosses no query/HTTP boundary.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const HERE = import.meta.dirname;
const FEATURE = join(HERE, "client-address-dry.feature");

// Any AC id token: AC-A1, AC-B4, AC-MATRIX, AC-CART, AC-REGION, AC-STAGED…
const AC = /AC-[A-Za-z0-9]+/g;

type Scenario = { id: string; todo: boolean };

/** Parse the feature into its tagged scenarios (id + whether @todo). */
function parseScenarios(featureText: string): Scenario[] {
  const scenarios: Scenario[] = [];
  let pendingTags = "";
  for (const raw of featureText.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("@")) {
      pendingTags += ` ${line}`;
      continue;
    }
    if (line.startsWith("Scenario:")) {
      const ids = pendingTags.match(AC) ?? [];
      for (const id of ids) {
        scenarios.push({ id, todo: /@todo\b/.test(pendingTags) });
      }
    }
    // Any non-tag, non-blank line closes the current tag block.
    if (line !== "" && !line.startsWith("@")) pendingTags = "";
  }
  return scenarios;
}

/** Collect AC ids named on any describe/it/it.todo declaration line. */
function testTokensIn(fileText: string): Set<string> {
  const tokens = new Set<string>();
  const declLine = /\b(?:describe|it)\b\s*(?:\.\s*todo)?\s*\(/;
  for (const raw of fileText.split("\n")) {
    if (!declLine.test(raw)) continue;
    for (const t of raw.match(AC) ?? []) tokens.add(t);
  }
  return tokens;
}

const featureText = readFileSync(FEATURE, "utf8");
const scenarios = parseScenarios(featureText);
const scenarioIds = new Set(scenarios.map(s => s.id));

const testFiles = readdirSync(HERE).filter(
  f => f.endsWith(".test.ts") && f !== "client-address-dry.traceability.test.ts"
);
const testTokens = new Set<string>();
for (const f of testFiles) {
  for (const t of testTokensIn(readFileSync(join(HERE, f), "utf8"))) {
    testTokens.add(t);
  }
}

describe("client-address-dry.feature <-> tests traceability", () => {
  it("has a feature file with tagged scenarios", () => {
    expect(scenarios.length).toBeGreaterThan(0);
  });

  it("every non-@todo scenario is proven by at least one test (no coverage hole)", () => {
    const orphans = scenarios
      .filter(s => !s.todo && !testTokens.has(s.id))
      .map(s => s.id);
    expect(
      orphans,
      `scenarios with no proving test (add a test naming the id, or tag the scenario @todo): ${orphans.join(", ")}`
    ).toEqual([]);
  });

  it("every AC id named by a test exists as a scenario (no untethered test)", () => {
    const untethered = [...testTokens].filter(t => !scenarioIds.has(t));
    expect(
      untethered,
      `tests naming an AC id that has no scenario in client-address-dry.feature: ${untethered.join(", ")}`
    ).toEqual([]);
  });
});
