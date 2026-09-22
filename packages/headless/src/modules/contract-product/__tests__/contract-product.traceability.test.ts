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
 * Named, reviewed exceptions — never a silent hole, and keyed on the EXACT
 * `id::scenario` pair, never on the bare id. An id-only exemption (or an
 * id-only "does some test mention this id" check, which this file used to
 * run) lets one covered scenario silently discharge every OTHER scenario
 * sharing its id — proven live on `@AC-1`: five scenarios share that tag,
 * four are proven, and the fifth (`contract-product.feature:104`, "A brand
 * that hides one-off purchases hides them from me everywhere") had zero
 * matching assertions anywhere in this tree, yet the old id-only check
 * passed, because SOME `@AC-1` test existed. See `receipts.md` "Outstanding
 * gaps" for the reason each pair below is here rather than proven:
 *
 * - AC-2 (both scenarios) and AC-18 need a `client-personal-details`
 *   preference-read capture that does not exist on disk.
 * - AC-19 needs a grouped-by-category capture that does not exist on disk.
 * - AC-10 needs `isDue`/`isCancellable`'s exact export surface, which sits
 *   in a `*.ts` file the prover's Read-block law puts out of reach this
 *   pass.
 * - AC-1's brand-hides-one-off-purchases scenario needs a recorded
 *   brand-settings capture carrying the hide-one-off-purchases flag; see the
 *   KNOWN GAP note beside `contract-product.reads.int.test.ts`'s AC-1
 *   describe block. Recording is forbidden this pass.
 *
 * Every entry is a reported, cited gap — never a silently faked green.
 */
const SCENARIO_GAPS = new Set([
  "AC-2::Choose whether to see products delegated to me",
  "AC-2::Never be shown delegated products I do not have",
  "AC-18::My choice about delegated products is remembered",
  "AC-19::See my products grouped by category, with a count for each",
  "AC-10::Know whether an outstanding invoice is still due, and still cancellable",
  "AC-1::A brand that hides one-off purchases hides them from me everywhere"
]);

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

describe("contract-product — every contract-product.feature @AC-n scenario is anchored to a real test (traceability)", () => {
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
   * The bare "some test mentions this id" check above cannot tell four
   * scenarios sharing one id apart from one scenario proven four times — the
   * exact gap that let AC-1's brand-hides-one-off-purchases scenario hide
   * behind AC-1's other four, proven scenarios. This is the id+scenario
   * floor: for every id, the number of DISTINCT provable scenarios sharing
   * it can never exceed the number of DISTINCT test titles claiming it. It
   * is a cardinality proof, not a semantic one — it cannot confirm WHICH
   * scenario a given title proves, only that there are at least as many
   * claims as promises. Combined with `SCENARIO_GAPS` naming every scenario
   * that cannot yet be proven, a shortfall here means a specific,
   * unregistered scenario is being discharged by another scenario's test.
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

  it("names no test-TITLE AC-n claim absent from contract-product.feature (no stale/untethered test)", () => {
    const featureIds = new Set(scenarios.map(scenario => scenario.id));
    const untethered = [...allTitleIds].filter(id => !featureIds.has(id));
    expect(untethered).toEqual([]);
  });
});
