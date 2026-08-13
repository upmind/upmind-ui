// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone traceability — every scenario has a proving test
 *
 * ## Job To Be Done
 * Parse the CO-LOCATED `client-phone.feature`'s `@AC-*` scenario tags and
 * every sibling spec's `AC-<n>` title mentions, then enforce the link BOTH
 * ways: a non-`@todo` scenario with no proving test fails, and a test naming
 * an AC the feature does not tag fails. The co-located feature is the one the
 * link is enforced against; the bundle copy at
 * `docs/story-bundles/client-phone/client-phone.feature` is the planner's
 * source — this file also checks the co-located copy did not lose a scenario
 * on the way over.
 *
 * ARTEFACT-PATH REDIRECT (design.md §9): `docs/sdd` is a symlink to another
 * machine's path, dangling and unwritable here. This bundle lives at
 * `docs/story-bundles/client-phone/` — the second feature path below resolves
 * there, NOT to `docs/sdd/client-phone/`, which will not resolve.
 *
 * Per ADR-020 the `.feature` is spec-only and non-executable — nothing runs
 * it, and there is no steps file. This test is the whole of its enforcement.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven.
 * That is the exact gap the 2026-08-05 manager amputation slipped through.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const COLOCATED_FEATURE = join(TEST_DIR, "client-phone.feature");
const BUNDLE_FEATURE = join(
  TEST_DIR,
  "../../../../../../docs/story-bundles/client-phone/client-phone.feature"
);

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
      file !== "client-phone.traceability.test.ts"
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

describe("client-phone traceability — co-located feature vs proving tests", () => {
  it("the co-located feature carries every scenario the bundle source tags", () => {
    const missing = [...featureAcTags(BUNDLE_FEATURE)].filter(
      ac => !featureAcTags(COLOCATED_FEATURE).has(ac)
    );

    expect(
      missing,
      `Scenario(s) lost in co-location: ${missing.join(", ")}`
    ).toEqual([]);
  });

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

  it("the coverage map names a proving file for every tracked scenario", () => {
    const tests = provingTests();
    const tracked = featureAcTags(COLOCATED_FEATURE);
    const map = [...tracked]
      .sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))
      .map(ac => ({ ac, files: tests.get(ac) ?? [] }));

    expect(map).toHaveLength(tracked.size);
    expect(map.filter(entry => entry.files.length === 0)).toEqual([]);
  });
});
