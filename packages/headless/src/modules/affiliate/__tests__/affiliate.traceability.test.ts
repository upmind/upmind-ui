// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate traceability — every non-@todo SCENARIO has a proving test
 *
 * ## Job To Be Done
 * Parse the co-located `affiliate.feature`'s scenarios (title + `@ACn` tags)
 * and every sibling spec's `describe`/`it` titles, then enforce the link at
 * scenario-title granularity, both ways (tasks.md T06 — "pairs each scenario
 * title with one spec title in the two directions", beyond the AC-only
 * pairing of the exemplar): a non-`@todo` scenario with no proving test
 * title fails, and a proving-test title with no matching scenario fails.
 * AC-only pairing is too coarse — several scenarios share one `@ACn` tag
 * (for example six `@AC26` scenarios), so an AC-only check is satisfied by
 * one test proving any one of them while the other five stay silently
 * unproven. A scenario the module's step catalog drives end to end is
 * proven by `affiliate.replay.int.test.ts`, which plays it by name.
 *
 * It is also the spec-to-catalog drift gate for `affiliate.steps.ts`: a
 * scenario whose steps the catalog matches only in part, a step definition
 * nothing calls, a pattern that does not compile, a pattern another module's
 * catalog already claims, and an action id declared covered that no step
 * fires each fail it. A scenario nothing matches is spec, not a hole.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — the feature promises it, no test
 * pins it, and nothing here would say so — or the labs page plays a track
 * that no longer drives what it claims to.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import { affiliateSteps, coveredActionIds } from "./affiliate.steps";
import { includes, map, reject } from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const COLOCATED_FEATURE = join(TEST_DIR, "affiliate.feature");

const catalogCheck = createTraceabilityCheck(
  readFileSync(COLOCATED_FEATURE, "utf-8"),
  affiliateSteps,
  stepCatalogs
);

/** The scenarios the replay spec plays by name — proven by playing them. */
const replayed = map(catalogCheck.driveable, "name");

type FeatureScenario = { tags: string[]; title: string; isTodo: boolean };

function normalize(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Every `Scenario:` in the feature file, with its tags and `@todo` status. */
function featureScenarios(path: string): FeatureScenario[] {
  const lines = readFileSync(path, "utf-8").split("\n");
  const scenarios: FeatureScenario[] = [];
  let pendingTags: string[] = [];

  for (const line of lines) {
    if (/^\s*@\S/.test(line)) {
      pendingTags.push(...(line.match(/@[^\s]+/g) ?? []));
      continue;
    }
    const match = line.match(/^\s*Scenario:\s*(.+?)\s*$/);
    if (match) {
      scenarios.push({
        tags: pendingTags,
        title: match[1],
        isTodo: pendingTags.includes("@todo")
      });
      pendingTags = [];
      continue;
    }
    if (/^\s*(Feature:|Background:|Given |When |Then |And |#)/.test(line))
      continue;
  }

  return scenarios;
}

/**
 * Every `it` title of every sibling spec file, with its source file.
 *
 * `describe` titles are DELIBERATELY excluded: a `describe` block restating
 * a scenario's name would pair with that scenario even when only ONE of
 * several sub-parts the scenario promises is actually proven inside it — a
 * describe title can turn any scenario green with no test that proves it.
 * Only a real `it()` assertion title counts as proof.
 */
function specTitles(): { file: string; title: string }[] {
  const files = readdirSync(TEST_DIR).filter(
    file =>
      (file.endsWith(".test.ts") || file.endsWith(".int.test.ts")) &&
      file !== "affiliate.traceability.test.ts"
  );

  const titles: { file: string; title: string }[] = [];
  for (const file of files) {
    const content = readFileSync(join(TEST_DIR, file), "utf-8");
    // Capture the OPENING quote character (group 1) and stop only at THAT
    // SAME quote — not any of the three types. The prior `[^"'\`]*` char
    // class excluded every quote type at once, so a double-quoted title
    // containing an apostrophe (e.g. "a client's withdrawal request...")
    // truncated at the apostrophe, silently losing the rest of the title —
    // a real bug, exposed by a spec title that (correctly) contains one.
    for (const m of content.matchAll(/\bit\(\s*(["'`])((?:(?!\1).)*)\1/g)) {
      titles.push({ file, title: m[2] });
    }
  }
  return titles;
}

/**
 * A scenario and a spec title are paired when one title contains the other
 * AND the shorter of the two carries enough of its own content to mean
 * something — a bare substring match on a short, generic spec title (e.g.
 * "the read", "a failure") would otherwise pair with many unrelated
 * scenarios. T06 writes each spec title as a near-restatement of its
 * scenario title (bdd.md "one title for each scenario name"), so a genuine
 * pairing is never this short.
 */
const MIN_MEANINGFUL_TITLE_LENGTH = 20;

function titlesPair(scenarioTitle: string, specTitle: string): boolean {
  const a = normalize(scenarioTitle);
  const b = normalize(specTitle);
  if (a.length === 0 || b.length === 0) return false;
  if (Math.min(a.length, b.length) < MIN_MEANINGFUL_TITLE_LENGTH) return false;
  return a.includes(b) || b.includes(a);
}

// -----------------------------------------------------------------------------

describe("affiliate traceability — co-located feature vs proving tests", () => {
  it("the co-located feature declares at least one non-@todo scenario", () => {
    const scenarios = featureScenarios(COLOCATED_FEATURE).filter(
      s => !s.isTodo
    );
    expect(scenarios.length).toBeGreaterThan(0);
  });

  it("every non-@todo scenario's title pairs with at least one proving test title", () => {
    const scenarios = featureScenarios(COLOCATED_FEATURE).filter(
      s => !s.isTodo
    );
    const specs = specTitles();

    const unproven = scenarios
      .filter(
        scenario =>
          !includes(replayed, scenario.title) &&
          !specs.some(spec => titlesPair(scenario.title, spec.title))
      )
      .map(scenario => `${scenario.tags.join(" ")} "${scenario.title}"`);

    expect(
      unproven,
      `Unproven scenarios (no spec title pairs with this scenario title): ${unproven.join("; ")}`
    ).toEqual([]);
  });

  it("every AC-tagged proving-test title pairs with a scenario that carries that AC tag", () => {
    const scenarios = featureScenarios(COLOCATED_FEATURE);
    const specs = specTitles();

    const orphaned: string[] = [];
    for (const spec of specs) {
      for (const acMatch of spec.title.matchAll(/\bAC(\d+)\b/g)) {
        const ac = `@AC${acMatch[1]}`;
        const paired = scenarios.some(
          scenario =>
            scenario.tags.includes(ac) && titlesPair(scenario.title, spec.title)
        );
        if (!paired) {
          orphaned.push(`${spec.file}: "${spec.title}" (names ${ac})`);
        }
      }
    }

    expect(
      orphaned,
      "Test(s) name an AC with no scenario of that AC whose title pairs with the test " +
        `title (the feature gains the scenario — coverage never falls): ${orphaned.join("; ")}`
    ).toEqual([]);
  });
});

describe("affiliate traceability — the feature against its ONE step catalog", () => {
  const catalogSource = readFileSync(
    join(TEST_DIR, "affiliate.steps.ts"),
    "utf-8"
  );

  it(`drives ${catalogCheck.driveable.length} of ${catalogCheck.scenarios.length} scenarios`, () => {
    expect(map(catalogCheck.partial, "name"), "Half-matched scenarios").toEqual(
      []
    );
    expect(
      map(catalogCheck.orphanStepDefs, "pattern"),
      "Step definitions nothing calls"
    ).toEqual([]);
    expect(
      map(catalogCheck.malformedStepDefs, "pattern"),
      "Patterns that do not compile"
    ).toEqual([]);
    expect(
      catalogCheck.duplicatedPatterns,
      "Patterns another catalog already claims"
    ).toEqual([]);
    expect(
      reject(coveredActionIds, id =>
        includes(catalogSource, `AFFILIATE_COVERED_ACTIONS.${id}`)
      ),
      "Declared covered but fired by no step"
    ).toEqual([]);
  });

  it("every driven scenario is tagged with the one labs panel or page that plays it", () => {
    const panelTags = [
      "@account",
      "@links",
      "@referrals",
      "@withdrawal",
      "@commissions",
      "@payout-destination",
      "@payouts",
      "@visit"
    ];

    expect(
      map(
        reject(
          catalogCheck.driveable,
          ({ tags }) =>
            reject(panelTags, tag => !includes(tags, tag)).length === 1
        ),
        "name"
      ),
      "Driven scenarios with no panel tag, or more than one"
    ).toEqual([]);
  });
});
