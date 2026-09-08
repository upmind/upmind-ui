// -----------------------------------------------------------------------------
/**
 * @fileoverview systemOperations traceability — every scenario is proven or
 * openly owed
 *
 * ## Job To Be Done
 * Parse the co-located `system-operations.feature`'s `@AC-<n>` scenario tags and
 * every sibling spec's `AC-<n>` title mentions, then enforce the link BOTH ways:
 * a scenario that is neither proven nor listed in {@link DEFERRED} fails, and a
 * test naming an AC the feature does not tag fails.
 *
 * Per ADR-020 the `.feature` is spec-only and non-executable — nothing runs it,
 * and there is no steps file. This test is the whole of its enforcement.
 *
 * ## The deferral list is a ratchet, not an excuse
 * {@link DEFERRED} names scenarios that cannot be proven yet, each with the
 * reason and the owning issue. It is machine-checked in BOTH directions, so it
 * can only ever shrink. This module owes nothing — every capability is proven —
 * so the list is empty.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven — or
 * a deferral outlives the blocker that justified it.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const COLOCATED_FEATURE = join(TEST_DIR, "system-operations.feature");

/** Total scenarios the co-located feature tags. */
const SCENARIO_COUNT = 12;

/** Scenarios with no proof yet, each with its reason and owning issue. */
const DEFERRED: Record<string, string> = {};

/** The `@AC-<n>` tags on every scenario in a feature file, `@todo` excluded. */
function featureAcTags(path: string): Set<string> {
  const lines = readFileSync(path, "utf-8").split("\n");
  const tagged = new Set<string>();

  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/@AC-(\d+)\b/);
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
      file !== "system-operations.traceability.test.ts"
  );

  const mentions = new Map<string, string[]>();
  for (const file of files) {
    const content = readFileSync(join(TEST_DIR, file), "utf-8");
    for (const title of content.matchAll(
      /(?:describe|it)(?:\.\w+)?\(\s*["'`]([^"'`]*)["'`]/g
    )) {
      for (const ac of title[1].matchAll(/AC-(\d+)\b/g)) {
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

describe("systemOperations traceability — co-located feature vs proving tests", () => {
  it("the co-located feature is present and tags every scenario in the module's contract", () => {
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
      `Test(s) name an AC the feature does not tag: ${orphaned.join(", ")}`
    ).toEqual([]);
  });

  it("the coverage map accounts for all 12 scenarios", () => {
    const tests = provingTests();
    const map = [...featureAcTags(COLOCATED_FEATURE)].sort().map(ac => ({
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
