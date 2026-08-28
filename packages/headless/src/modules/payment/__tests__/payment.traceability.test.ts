// -----------------------------------------------------------------------------
/**
 * @fileoverview payment traceability — every scenario is proven or openly owed
 *
 * ## Job To Be Done
 * Parse the CO-LOCATED `payment.feature`'s `@AC-*` scenario tags and every
 * sibling spec's `AC-<n>` title mentions, then enforce the link BOTH ways: a
 * scenario that is neither proven nor listed in {@link DEFERRED} fails, and a
 * test naming an AC the feature does not tag fails.
 *
 * Per ADR-020 the `.feature` is spec-only and non-executable — nothing runs it,
 * and there is no steps file. This test is the whole of its enforcement.
 *
 * ## The deferral list is a ratchet, not an excuse
 * {@link DEFERRED} names the scenarios this module cannot prove yet, each with
 * the reason and the issue that owns it. It is machine-checked in BOTH
 * directions: a scenario missing from both the proven set and this list fails,
 * and a DEFERRED scenario that has quietly acquired a proving test ALSO fails —
 * so the list can only ever shrink, and shrinking it is forced rather than
 * remembered. Coverage never falls silently.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven —
 * or a deferral outlives the blocker that justified it.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const COLOCATED_FEATURE = join(TEST_DIR, "payment.feature");

/** Total scenarios the co-located feature tags. */
const SCENARIO_COUNT = 18;

/**
 * Scenarios with no proof yet, each with its reason and owning issue.
 *
 * Every other scenario is named by a real proof. No `it.fails` receipt survives
 * this pass: the two defects it found are fixed (the inert exposed context, and
 * the parentless `escalate` that froze the machine), and the two it reported in
 * error are withdrawn.
 *
 * AC-6 is deliberately absent from this list although only partly proven —
 * `usePayment.events.test.ts` proves a stray confirmation takes no money, while
 * the provider's own agreement still needs the recording AC-4 is waiting on.
 */
const DEFERRED: Record<string, string> = {
  "AC-4":
    "FE-3130 — a cleared payment cannot be captured without charging a real " +
    "gateway; owed as a sandbox capture through the app-driven recorder"
};

/** The `@AC-*` tags on every scenario in a feature file, `@todo` excluded. */
function featureAcTags(path: string): Set<string> {
  const lines = readFileSync(path, "utf-8").split("\n");
  const tagged = new Set<string>();

  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/@AC-(\d+)/);
    if (!match) continue;

    let cursor = index;
    let isTodo = false;
    while (cursor < lines.length && !/^\s*Scenario/.test(lines[cursor])) {
      if (/@todo/.test(lines[cursor])) isTodo = true;
      cursor++;
    }
    if (!isTodo) tagged.add(`AC-${match[1]}`);
  }

  return tagged;
}

/** AC ids named by a sibling spec's `describe`/`it` titles → the files naming them. */
function provingTests(): Map<string, string[]> {
  const files = readdirSync(TEST_DIR).filter(
    file =>
      (file.endsWith(".test.ts") || file.endsWith(".int.test.ts")) &&
      file !== "payment.traceability.test.ts"
  );

  const mentions = new Map<string, string[]>();
  for (const file of files) {
    const content = readFileSync(join(TEST_DIR, file), "utf-8");
    for (const title of content.matchAll(
      /(?:describe|it)(?:\.\w+)?\(\s*["'`]([^"'`]*)["'`]/g
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

describe("payment traceability — co-located feature vs proving tests", () => {
  it("the co-located feature is present and tags every scenario in the module's own tree", () => {
    expect(existsSync(COLOCATED_FEATURE)).toBe(true);
    expect(featureAcTags(COLOCATED_FEATURE).size).toBe(SCENARIO_COUNT);
  });

  it("every scenario is either proven by a test or openly owed on an issue", () => {
    const proven = new Set(provingTests().keys());
    const unaccounted = [...featureAcTags(COLOCATED_FEATURE)].filter(
      ac => !proven.has(ac) && !(ac in DEFERRED)
    );

    expect(
      unaccounted,
      `Scenarios with neither a proving test nor a deferral: ${unaccounted.join(", ")}`
    ).toEqual([]);
  });

  it("no deferral outlives its blocker — a proven scenario must leave the list", () => {
    const proven = new Set(provingTests().keys());
    const stale = Object.keys(DEFERRED).filter(ac => proven.has(ac));

    expect(
      stale,
      `Deferred scenarios that now HAVE a proving test — remove them from DEFERRED: ${stale.join(", ")}`
    ).toEqual([]);
  });

  it("every AC a test names is a scenario the feature actually tags", () => {
    const tagged = featureAcTags(COLOCATED_FEATURE);
    const orphaned = [...provingTests().keys()].filter(ac => !tagged.has(ac));

    expect(
      orphaned,
      "Test(s) name an AC the feature does not tag (the feature gains the " +
        `scenario — coverage never falls): ${orphaned.join(", ")}`
    ).toEqual([]);
  });

  it("every deferral names a real scenario and the issue that owns it", () => {
    const tagged = featureAcTags(COLOCATED_FEATURE);
    const broken = Object.entries(DEFERRED).filter(
      ([ac, reason]) => !tagged.has(ac) || !/FE-\d+/.test(reason)
    );

    expect(broken).toEqual([]);
  });

  it("the coverage map accounts for all 18 scenarios", () => {
    const tests = provingTests();
    const map = [...featureAcTags(COLOCATED_FEATURE)]
      .sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))
      .map(ac => ({
        ac,
        files: tests.get(ac) ?? [],
        deferred: DEFERRED[ac] ?? null
      }));

    expect(map).toHaveLength(SCENARIO_COUNT);
    expect(
      map.filter(entry => entry.files.length === 0 && entry.deferred === null)
    ).toEqual([]);
  });
});
