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
 * unproven. The `.feature` is non-executable (ADR-020); this test is the
 * whole of its enforcement.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — the feature promises it, no test
 * pins it, and nothing here would say so.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const COLOCATED_FEATURE = join(TEST_DIR, "affiliate.feature");

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
        scenario => !specs.some(spec => titlesPair(scenario.title, spec.title))
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
