// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders traceability — every scenario has a proving test
 *
 * ## Job To Be Done
 * Parse the CO-LOCATED `client-orders.feature`'s `@AC-*` scenario tags and
 * every sibling spec's `AC-<n>` title mentions, then enforce the link BOTH
 * ways: a non-`@todo` scenario with no proving test fails, and a test naming
 * an AC the feature does not tag fails. Two consumer proofs live outside this
 * module's `__tests__` dir and cannot name an AC in a vitest title here —
 * AC-17 (the brand module's own feature, per ADR-020) and AC-22 (the labs-nuxt
 * playground e2e spec) — bdd.md names both explicitly; they are
 * MACHINE-CHECKED against the real file, never taken on trust.
 *
 * Per ADR-020 the `.feature` is spec-only and non-executable — nothing runs
 * it. This test is the whole of its enforcement.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const COLOCATED_FEATURE = join(TEST_DIR, "client-orders.feature");
const REPO_ROOT = join(TEST_DIR, "../../../../../..");

/** The two ACs proven OUTSIDE this module's own __tests__ directory. */
const CONSUMER_PROOFS: Record<string, { file: string; mustContain: RegExp }> = {
  "AC-17": {
    file: "packages/headless/src/modules/brand/__tests__/brand.feature",
    mustContain: /@AC-17\b/
  },
  "AC-22": {
    file: "playgrounds/labs-nuxt/tests/e2e/client-orders.spec.ts",
    mustContain: /@FE-3237/
  }
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

/**
 * Every `@AC-*` tag in the feature, `@todo` INCLUDED — the structural
 * completeness check (§every scenario the story names is written down)
 * is a different question from §every non-@todo scenario has a proof, and
 * must not use the same @todo-filtered set: a scenario can be legitimately
 * written and tagged, and still be @todo pending later build work.
 */
function allFeatureAcTags(path: string): Set<string> {
  const tagged = new Set<string>();
  for (const match of readFileSync(path, "utf-8").matchAll(/@AC-(\d+)/g)) {
    tagged.add(`AC-${match[1]}`);
  }
  return tagged;
}

/** AC ids named by a sibling spec's `describe`/`it` titles → the files naming them. */
function provingTests(): Map<string, string[]> {
  const files = readdirSync(TEST_DIR).filter(
    file =>
      (file.endsWith(".test.ts") || file.endsWith(".int.test.ts")) &&
      file !== "client-orders.traceability.test.ts"
  );

  const mentions = new Map<string, string[]>();
  for (const file of files) {
    const content = readFileSync(join(TEST_DIR, file), "utf-8");
    // `.each(...)` is matched too — a `describe.each([...])("...(AC-n)", …)`
    // title carries an AC id exactly like a plain `describe(...)` does; the
    // one level of nested parens/brackets covers array/object literal args.
    for (const title of content.matchAll(
      /(?:describe|it)(?:\.each\((?:[^()]|\([^()]*\))*\))?\s*\(\s*["'`]([^"'`]*)["'`]/g
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

/** Every AC with a proof: a colocated spec, or a declared consumer proof. */
function provenAcs(): Set<string> {
  return new Set([...provingTests().keys(), ...Object.keys(CONSUMER_PROOFS)]);
}

// -----------------------------------------------------------------------------

describe("client-orders traceability — co-located feature vs proving tests", () => {
  it("the co-located feature parses and tags all 24 scenarios (todo included)", () => {
    expect(existsSync(COLOCATED_FEATURE)).toBe(true);
    expect(allFeatureAcTags(COLOCATED_FEATURE).size).toBe(24);
  });

  it("every scenario carries exactly one @AC-n tag and @FE-3237", () => {
    const lines = readFileSync(COLOCATED_FEATURE, "utf-8").split("\n");
    const tagLines = lines.filter(line => /^\s*@AC-\d+/.test(line));
    expect(tagLines).toHaveLength(24);
    for (const line of tagLines) {
      expect(line).toMatch(/@AC-\d+/);
      expect(line).toMatch(/@FE-3237/);
      expect(line.match(/@AC-\d+/g)).toHaveLength(1);
    }
  });

  it("every non-@todo scenario has at least one proving test", () => {
    const proven = provenAcs();
    const unproven = [...featureAcTags(COLOCATED_FEATURE)].filter(
      ac => !proven.has(ac)
    );

    expect(
      unproven,
      `Unproven scenarios (no test names this AC): ${unproven.join(", ")}`
    ).toEqual([]);
  });

  it("every AC a test names is a scenario the feature actually tags", () => {
    const tagged = featureAcTags(COLOCATED_FEATURE);
    const orphaned = [...provenAcs()].filter(ac => !tagged.has(ac));

    expect(
      orphaned,
      "Test(s) name an AC the feature does not tag (the feature gains the " +
        `scenario — coverage never falls): ${orphaned.join(", ")}`
    ).toEqual([]);
  });

  it("each declared consumer proof (AC-17, AC-22) still exists and still carries its tag", () => {
    const broken: string[] = [];
    for (const [ac, proof] of Object.entries(CONSUMER_PROOFS)) {
      const path = join(REPO_ROOT, proof.file);
      if (!existsSync(path)) {
        broken.push(`${ac}: missing file ${proof.file}`);
        continue;
      }
      if (!proof.mustContain.test(readFileSync(path, "utf-8"))) {
        broken.push(
          `${ac}: ${proof.mustContain} no longer found in ${proof.file}`
        );
      }
    }
    expect(broken).toEqual([]);
  });

  it("the coverage map names a proving file or a consumer proof for all 24 tagged capabilities, @todo excepted", () => {
    const tests = provingTests();
    const nonTodo = featureAcTags(COLOCATED_FEATURE);
    const map = [...allFeatureAcTags(COLOCATED_FEATURE)]
      .sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))
      .map(ac => ({
        ac,
        todo: !nonTodo.has(ac),
        files: tests.get(ac) ?? [],
        consumer: CONSUMER_PROOFS[ac] ? [CONSUMER_PROOFS[ac].file] : []
      }));

    expect(map).toHaveLength(24);
    expect(
      map.filter(
        entry =>
          !entry.todo && entry.files.length === 0 && entry.consumer.length === 0
      )
    ).toEqual([]);
  });
});
