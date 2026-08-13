// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history traceability — every scenario has a
 * proving test
 *
 * ## Job To Be Done
 * Parse the CO-LOCATED `client-email-history.feature`'s `@AC-*` scenario tags
 * and every sibling spec's `AC-<n>` title mentions, then enforce the link
 * BOTH ways: a non-`@todo` scenario with no proving test fails, and a test
 * naming an AC the feature does not tag fails. Mirrors
 * `client-email/__tests__/client-email.traceability.test.ts` — the sibling
 * module's own equivalent.
 *
 * A test may never read a planning-bundle path: the SDD bundle directories are
 * gitignored, so any such read passes locally and fails in CI on a checkout
 * that has no bundle. Everything this test enforces lives beside it, tracked.
 *
 * Per ADR-020 the `.feature` is spec-only and non-executable — nothing runs
 * it, and there is no steps file. This test is the whole of its enforcement.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven.
 * That is the exact gap FE-2824 slipped through.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const COLOCATED_FEATURE = join(TEST_DIR, "client-email-history.feature");

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
      file !== "client-email-history.traceability.test.ts"
  );

  const mentions = new Map<string, string[]>();
  for (const file of files) {
    const content = readFileSync(join(TEST_DIR, file), "utf-8");
    // An AC named on the enclosing `describe` is as valid a claim as one
    // repeated on every `it` title.
    for (const title of content.matchAll(
      /(?:describe|it)\(\s*["'`]([^"'`]*)["'`]/g
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

describe("client-email-history traceability — co-located feature vs proving tests", () => {
  it("every non-@todo scenario has at least one proving test", () => {
    const tests = provingTests();
    const unproven = [...featureAcTags(COLOCATED_FEATURE)].filter(
      ac => !tests.has(ac)
    );

    expect(
      unproven,
      `Unproven scenarios (no test names this AC): ${unproven.join(", ")}`
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

  it("the coverage map names a proving file for all 20 scenarios", () => {
    const tests = provingTests();
    const map = [...featureAcTags(COLOCATED_FEATURE)]
      .sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))
      .map(ac => ({ ac, files: tests.get(ac) ?? [] }));

    expect(map).toHaveLength(20);
    expect(map.filter(entry => entry.files.length === 0)).toEqual([]);
  });
});
