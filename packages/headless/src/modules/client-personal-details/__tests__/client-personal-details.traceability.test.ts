// -----------------------------------------------------------------------------
/**
 * @fileoverview client-personal-details traceability — AC <-> test, both ways
 *
 * ## Job To Be Done
 * Enforce the AC <-> proving-spec link over the CO-LOCATED
 * `client-personal-details.feature` — the SOLE source of truth (`docs/sdd/`
 * is gitignored and no per-module SDD copy exists; `tasks.md` T-0 / T-B14 and
 * `dropped-capabilities.md` §N1 record why the reference module's own
 * traceability test, which reads an SDD-tree copy unconditionally, is red in
 * CI today). This file reads NO path outside `__tests__/` — exactly three
 * assertions, matching T-A11's shape:
 *
 *   1. every non-`@todo` scenario has >=1 sibling spec naming its `AC-<n>`;
 *   2. every AC a test names is a scenario the feature actually tags
 *      (coverage never silently falls);
 *   3. the hard count — the distinct `@AC-<n>` tag set has exactly 28
 *      members, matching this module's AC set, and no member has an empty
 *      proving-file list.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven —
 * the exact gap the manager amputation (client-email, 2026-08-05) slipped
 * through.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const COLOCATED_FEATURE = join(TEST_DIR, "client-personal-details.feature");
const SELF_FILENAME = "client-personal-details.traceability.test.ts";

/**
 * The `@AC-*` tags on every scenario in the feature. `includeTodo` controls
 * whether a scenario ALSO carrying `@todo` (its proof lives at a different
 * altitude or a later stage — not "no sibling spec proves this" left
 * unexplained) is counted: `false` for "needs a proving spec here",
 * `true` for the module's total AC catalogue (a `@todo` AC is still one of
 * this module's 28 ACs; it just isn't proven by THIS seat).
 */
function featureAcTags(path: string, includeTodo: boolean): Set<string> {
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
    if (includeTodo || !isTodo) tagged.add(`AC-${match[1]}`);
  }

  return tagged;
}

/** AC ids named by a sibling spec's `describe`/`it` titles -> the files naming them. */
function provingTests(): Map<string, string[]> {
  const files = readdirSync(TEST_DIR).filter(
    file =>
      (file.endsWith(".test.ts") || file.endsWith(".int.test.ts")) &&
      file !== SELF_FILENAME
  );

  const mentions = new Map<string, string[]>();
  for (const file of files) {
    const content = readFileSync(join(TEST_DIR, file), "utf-8");
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

describe("client-personal-details traceability — co-located feature vs proving tests", () => {
  it("every non-@todo scenario has at least one proving test", () => {
    const tests = provingTests();
    const unproven = [...featureAcTags(COLOCATED_FEATURE, false)].filter(
      ac => !tests.has(ac)
    );

    expect(
      unproven,
      `Unproven scenarios (no test names this AC): ${unproven.join(", ")}`
    ).toEqual([]);
  });

  it("every AC a test names is a scenario the feature actually tags", () => {
    const tagged = featureAcTags(COLOCATED_FEATURE, true);
    const orphaned = [...provingTests().keys()].filter(ac => !tagged.has(ac));

    expect(
      orphaned,
      "Test(s) name an AC the feature does not tag (the feature gains the " +
        `scenario — coverage never falls): ${orphaned.join(", ")}`
    ).toEqual([]);
  });

  it("the distinct @AC-<n> tag set has exactly 28 members, and every non-@todo member has a proving file", () => {
    const tests = provingTests();
    const allTagged = [...featureAcTags(COLOCATED_FEATURE, true)].sort(
      (a, b) => Number(a.slice(3)) - Number(b.slice(3))
    );
    const provable = featureAcTags(COLOCATED_FEATURE, false);
    const map = allTagged.map(ac => ({
      ac,
      todo: !provable.has(ac),
      files: tests.get(ac) ?? []
    }));

    expect(allTagged).toHaveLength(28);
    expect(
      map.filter(entry => !entry.todo && entry.files.length === 0)
    ).toEqual([]);
  });
});
