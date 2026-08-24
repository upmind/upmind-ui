// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields traceability — every scenario has a proving test
 *
 * ## Job To Be Done
 * Parse the CO-LOCATED `client-custom-fields.feature`'s `@AC-*` scenario tags
 * and every sibling spec's `AC-<n>` title mentions, then enforce the link
 * BOTH ways — a non-`@todo` scenario with no proving test fails, and a test
 * naming an AC the feature does not tag fails — plus the hard count: the
 * distinct `@AC-<n>` tag set has exactly 36 members.
 *
 * ALSO grades step catalog driveability: a scenario whose steps ALL match the
 * catalog is driveable; one whose steps match only in PART fails (the dangerous
 * case — it reads as driveable and silently is not); an orphan step definition
 * fails (dead code, or a scenario renamed underneath it).
 *
 * This file reads NO path outside `__tests__/` — there is no SDD copy and no
 * `docs/sdd/client-custom-fields/` directory (T-0, T-A13).
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import clientCustomFieldsSteps, {
  coveredActionIds
} from "./client-custom-fields.steps";
import { filter, includes, map, reject } from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const COLOCATED_FEATURE = join(TEST_DIR, "client-custom-fields.feature");

const featureText = readFileSync(COLOCATED_FEATURE, "utf-8");
const catalogSource = readFileSync(
  join(TEST_DIR, "client-custom-fields.steps.ts"),
  "utf-8"
);

const {
  scenarios,
  driveable,
  partial,
  orphanStepDefs,
  duplicatedPatterns,
  malformedStepDefs
} = createTraceabilityCheck(featureText, clientCustomFieldsSteps, stepCatalogs);

/** The `@AC-*` tags on every scenario in the feature file, `@todo` excluded. */
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
      file !== "client-custom-fields.traceability.test.ts"
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

describe("client-custom-fields traceability — co-located feature vs proving tests", () => {
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

  it("the distinct @AC-<n> tag set has exactly 36 members, and every one names a proving file", () => {
    const tests = provingTests();
    const acEntries = map(
      [...featureAcTags(COLOCATED_FEATURE)].sort(
        (a, b) => Number(a.slice(3)) - Number(b.slice(3))
      ),
      ac => ({ ac, files: tests.get(ac) ?? [] })
    );

    expect(acEntries).toHaveLength(36);
    expect(filter(acEntries, entry => entry.files.length === 0)).toEqual([]);
  });

  it(`drives ${driveable.length} of ${scenarios.length} scenarios`, () => {
    expect(map(partial, "name"), "Half-matched scenarios").toEqual([]);
    expect(
      map(orphanStepDefs, "pattern"),
      "Step definitions nothing calls"
    ).toEqual([]);
    expect(
      map(malformedStepDefs, "pattern"),
      "Patterns that do not compile"
    ).toEqual([]);
    expect(
      duplicatedPatterns,
      "Patterns another catalog already claims"
    ).toEqual([]);
    expect(
      reject(coveredActionIds, id =>
        includes(
          catalogSource,
          `fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.${id}`
        )
      ),
      "Declared covered but fired by no step"
    ).toEqual([]);
  });
});
