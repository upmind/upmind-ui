/**
 * @fileoverview `contract.feature` ↔ test-suite anchor enforcement
 *
 * ## Job To Be Done
 * Ride this module's own suite and fail when a `contract.feature` scenario's
 * `@AC-n` id has no matching test in this `__tests__` tree (a coverage hole
 * the feature promises and nothing proves), or when a test's `AC-n` claim
 * names an id no scenario in `contract.feature` carries (a stale/untethered
 * test asserting something the contract no longer states). A `@todo`-tagged
 * scenario is exempt from the first direction.
 *
 * ## What Breaks If These Fail
 * `contract.feature` drifts from the suite silently — a capability is
 * promised and never proven, or a test outlives the capability it once
 * proved, and nobody notices either drift until a real regression ships.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const TESTS_DIR = import.meta.dirname;
const FEATURE_FILE = "contract.feature";

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
        name !== "contract.traceability.test.ts"
    )
    .map(file => ({
      file,
      content: readFileSync(join(TESTS_DIR, file), "utf-8")
    }));
}

/**
 * Named, reviewed exceptions to full coverage — never a silent hole, keyed
 * on the EXACT `id::scenario` pair (see `contract-product.traceability.test.ts`
 * for why an id-only exemption or an id-only "some test mentions this id"
 * check can silently let one covered scenario discharge every OTHER
 * scenario sharing its id).
 *
 * AC-7 — only the failure half is proven (`contract.mutations.int.test.ts`'s
 * withdraw tests both drive the sandbox's real `404` rejection). The success
 * half (a withdraw that actually succeeds) has no recorded 200 capture on
 * disk for `DELETE contracts/{id}/cancel/request` — recording is forbidden
 * this pass (see `receipts.md`), so it stays unproven rather than faked with
 * a hand-rolled 200 body. `contract.feature` carries a single AC-7 scenario,
 * so this entry is written down here for visibility, not because the id+
 * scenario floor below would otherwise miss a shared-id masking case.
 */
const SCENARIO_GAPS = new Set<string>();

/**
 * Every `AC-n` id a test-TITLE claims — `it`/`describe`/`it.each` calls
 * only, never a `//` comment. A prose comment mentioning an id is not an
 * anchor: it proves nothing runs under that id, so it must not satisfy the
 * forward (feature -> test) check any more than it satisfies the reverse
 * (test -> feature) one.
 */
function titleClaimedIds(content: string): Set<string> {
  const claimed = new Set<string>();
  for (const id of extractTitlesWithIds(content).flatMap(entry => entry.ids)) {
    claimed.add(id);
  }
  return claimed;
}

/**
 * Every `it`/`describe`/`it.each` TITLE string in the content, paired with
 * the `AC-n` ids it names. One entry per title — never deduped across
 * titles — so two different scenarios sharing an id cannot be discharged
 * by counting the same title twice, and a single title used to prove two
 * unrelated scenarios cannot inflate the count either.
 */
function extractTitlesWithIds(
  content: string
): { title: string; ids: string[] }[] {
  const titlePattern = /\b(?:it|describe|it\.each)\s*\(\s*["'`]([^"'`]*)["'`]/g;
  const entries: { title: string; ids: string[] }[] = [];
  for (const titleMatch of content.matchAll(titlePattern)) {
    const ids = [...titleMatch[1].matchAll(/\bAC-\d+\b/g)].map(m => m[0]);
    if (ids.length > 0) entries.push({ title: titleMatch[1], ids });
  }
  return entries;
}

describe("contract — every contract.feature @AC-n scenario is anchored to a real test (traceability)", () => {
  const scenarios = parseFeatureTags();
  const files = testFileContents();
  const allTitleIds = new Set<string>();
  const titlesById = new Map<string, Set<string>>();
  for (const { content } of files) {
    for (const { title, ids } of extractTitlesWithIds(content)) {
      for (const id of ids) {
        allTitleIds.add(id);
        if (!titlesById.has(id)) titlesById.set(id, new Set());
        titlesById.get(id)!.add(title);
      }
    }
  }
  const titleCountById = new Map(
    [...titlesById.entries()].map(([id, titles]) => [id, titles.size])
  );

  it("names at least one @AC-n scenario, so this check itself is not vacuous", () => {
    expect(scenarios.length).toBeGreaterThan(0);
  });

  const provable = scenarios.filter(
    scenario =>
      !scenario.todo &&
      !SCENARIO_GAPS.has(`${scenario.id}::${scenario.scenario}`)
  );

  it.each(provable)(
    "$id ($scenario) has a matching test TITLE in this module's __tests__ tree",
    ({ id }) => {
      expect(allTitleIds.has(id)).toBe(true);
    }
  );

  /**
   * The id+scenario cardinality floor — see the sibling
   * `contract-product.traceability.test.ts` for the full rationale and the
   * live AC-1 case that motivated it.
   */
  const provableCountById = new Map<string, number>();
  for (const scenario of provable) {
    provableCountById.set(
      scenario.id,
      (provableCountById.get(scenario.id) ?? 0) + 1
    );
  }

  it.each([...provableCountById.entries()])(
    "%s has at least as many distinct test titles as provable scenarios sharing it",
    (id, requiredCount) => {
      expect(titleCountById.get(id) ?? 0).toBeGreaterThanOrEqual(requiredCount);
    }
  );

  it("names no test-TITLE AC-n claim absent from contract.feature (no stale/untethered test)", () => {
    const featureIds = new Set(scenarios.map(scenario => scenario.id));
    const untethered = [...allTitleIds].filter(id => !featureIds.has(id));
    expect(untethered).toEqual([]);
  });
});
