// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications traceability — every scenario has a proving
 * test, and the step catalog drives exactly what it claims to.
 *
 * ## Job To Be Done
 * Parse the CO-LOCATED `client-notifications.feature`'s `@AC-*` scenario tags
 * and every sibling spec's `AC-<n>` title mentions, then enforce the link BOTH
 * ways: a non-exempt scenario with no proving test fails, and a test naming an
 * AC the feature does not tag fails. The feature gains a scenario before a test
 * is ever dropped — coverage never falls.
 *
 * `@todo` EXEMPTS a scenario from the "needs a proving test" rule without
 * removing it from the count or the coverage map — a capability written down
 * and not yet driveable is a legitimate state, its named blocker in the feature.
 *
 * Per ADR-020 the `.feature` is spec-only and non-executable — this test and the
 * replay wall are the whole of its enforcement.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven — or
 * the spec and the catalog that drives it drift apart.
 *
 * Negative controls: `client-notifications.traceability.must-fail.patch`.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import clientNotificationsSteps, {
  coveredActionIds
} from "./client-notifications.steps";
import { includes, map, reject } from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const COLOCATED_FEATURE = join(TEST_DIR, "client-notifications.feature");
const CATALOG_FILE = join(TEST_DIR, "client-notifications.steps.ts");
const SELF = "client-notifications.traceability.test.ts";

/**
 * Every `@AC-*` tag in the feature, mapped to whether it is EXEMPT from the
 * "needs a proving test" rule (`@todo`). Exempt scenarios are still returned —
 * never dropped — so a caller filters explicitly rather than this deciding it.
 */
function scenarioTags(path: string): Map<string, boolean> {
  const lines = readFileSync(path, "utf-8").split("\n");
  const tagged = new Map<string, boolean>();

  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/@AC-(\d+)/);
    if (!match) continue;

    let cursor = index;
    let todo = false;
    while (cursor < lines.length && !/^\s*Scenario/.test(lines[cursor])) {
      if (/@todo/.test(lines[cursor])) todo = true;
      cursor++;
    }
    // A driven (non-@todo) occurrence of an AC wins over any @todo occurrence:
    // once proven by a driven scenario, the AC must carry a proving test.
    const key = `AC-${match[1]}`;
    if (tagged.get(key) !== false) tagged.set(key, todo);
  }

  return tagged;
}

/** Every `@AC-*` tag, exempt or not. */
function featureAcTags(path: string): Set<string> {
  return new Set(scenarioTags(path).keys());
}

/** Only the tags EXEMPT (@todo) from the "needs a proving test" rule. */
function exemptAcTags(path: string): Set<string> {
  const exempt = new Set<string>();
  for (const [ac, todo] of scenarioTags(path)) if (todo) exempt.add(ac);
  return exempt;
}

/** AC ids named by a sibling spec's `describe`/`it` titles -> the files. */
function provingTests(): Map<string, string[]> {
  const files = readdirSync(TEST_DIR).filter(
    file =>
      (file.endsWith(".test.ts") || file.endsWith(".int.test.ts")) &&
      file !== SELF
  );

  const mentions = new Map<string, string[]>();
  for (const file of files) {
    const content = readFileSync(join(TEST_DIR, file), "utf-8");
    for (const title of content.matchAll(
      /(?:describe|it)(?:\.skip|\.todo)?\(\s*["'`]([^"'`]*)["'`]/g
    )) {
      for (const ac of title[1].matchAll(/AC-(\d+)/g)) {
        const key = `AC-${ac[1]}`;
        const seen = mentions.get(key) ?? [];
        if (!seen.includes(file)) seen.push(file);
        mentions.set(key, seen);
      }
    }
  }
  return mentions;
}

// -----------------------------------------------------------------------------

describe("client-notifications traceability — co-located feature vs proving tests", () => {
  it("the co-located feature is present and tags at least one scenario", () => {
    expect(readFileSync(COLOCATED_FEATURE, "utf-8").length).toBeGreaterThan(0);
    expect(featureAcTags(COLOCATED_FEATURE).size).toBeGreaterThan(0);
  });

  it("every non-exempt scenario has at least one proving test", () => {
    const proven = provingTests();
    const exempt = exemptAcTags(COLOCATED_FEATURE);
    const unproven = [...featureAcTags(COLOCATED_FEATURE)].filter(
      ac => !exempt.has(ac) && !proven.has(ac)
    );

    expect(
      unproven,
      `Unproven scenarios (no test names this AC): ${unproven.join(", ")}`
    ).toEqual([]);
  });

  it("every AC a test names is a scenario the feature actually tags", () => {
    const tagged = featureAcTags(COLOCATED_FEATURE);
    const named = [...provingTests().keys()];
    const orphaned = named.filter(ac => !tagged.has(ac));

    expect(
      orphaned,
      "Test(s) name an AC the feature does not tag (the feature gains the " +
        `scenario — coverage never falls): ${orphaned.join(", ")}`
    ).toEqual([]);
  });

  it("the coverage map names a proving file for every non-exempt tagged scenario", () => {
    const tests = provingTests();
    const exempt = exemptAcTags(COLOCATED_FEATURE);
    const coverage = [...featureAcTags(COLOCATED_FEATURE)]
      .sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))
      .map(ac => ({
        ac,
        files: tests.get(ac) ?? [],
        exempt: exempt.has(ac)
      }));

    expect(coverage.length).toBeGreaterThan(0);
    expect(
      coverage.filter(entry => !entry.exempt && entry.files.length === 0)
    ).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
/**
 * The spec-to-catalog drift gate for `client-notifications.steps.ts`. An orphan
 * step definition FAILS (dead code, or a scenario renamed underneath it); a
 * scenario whose steps match only in PART FAILS (it reads as driveable and
 * silently is not); a malformed step pattern FAILS; a pattern another module's
 * catalog already claims FAILS; an action id declared covered that no step fires
 * FAILS. A scenario nothing matches PASSES — every `@todo` capability is exactly
 * that, a capability written down and not yet driven.
 */

const catalogSource = readFileSync(CATALOG_FILE, "utf-8");

const {
  scenarios,
  driveable,
  partial,
  orphanStepDefs,
  duplicatedPatterns,
  malformedStepDefs
} = createTraceabilityCheck(
  readFileSync(COLOCATED_FEATURE, "utf-8"),
  clientNotificationsSteps,
  stepCatalogs
);

describe("client-notifications — the page's step catalog drives what it claims to", () => {
  it(`drives ${driveable.length} of ${scenarios.length} scenarios`, () => {
    expect(
      map(partial, "name"),
      "Half-matched scenarios — they read as driveable and silently are not"
    ).toEqual([]);
    expect(
      map(orphanStepDefs, "pattern"),
      "Step definitions nothing calls"
    ).toEqual([]);
    expect(
      map(malformedStepDefs, "pattern"),
      "Patterns that do not compile"
    ).toEqual([]);
    expect(
      duplicatedPatterns,
      "Patterns another module's catalog already claims"
    ).toEqual([]);
    expect(driveable.length).toBeGreaterThan(0);
  });

  it("fires every action it declares as covered", () => {
    expect(
      reject(coveredActionIds, id =>
        includes(
          catalogSource,
          `fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.${id}`
        )
      ),
      "Declared covered but fired by no step"
    ).toEqual([]);
  });
});
