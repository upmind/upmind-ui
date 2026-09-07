/**
 * @module invoices/__tests__/invoices.traceability
 * @description The module's AC-link traceability gate: every `@AC-*`
 * scenario tag in invoices.feature is named by at least one sibling test,
 * and every AC id a sibling test names has a scenario carrying that tag —
 * both directions.
 *
 * NO STEP-CATALOG CHECK YET (unlike every other *.traceability.test.ts in
 * this tree, which additionally pairs this check with a *.steps.ts
 * playground catalog via createTraceabilityCheck): this module has neither
 * module code nor a *.steps.ts catalog yet — the Code stage runs after this
 * dispatch, and the labs-nuxt e2e lane is broken on develop
 * (docs/sdd/FE-3031/bdd.md "Finding"). Checking driveability against a
 * catalog that cannot exist yet would be a check against nothing, not a
 * proof. A later dispatch may extend this file with a createTraceabilityCheck
 * pass once both the module and the playground lane exist.
 *
 * ## What Breaks If These Fail
 * A capability gets a Gherkin scenario but no proving test ever lands for
 * it — shape present, behaviour unproven, the FE-2824 shape this story's own
 * AC12 negative control exists to catch at the request-contract level.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { featureAcTags } from "@upmind-automation/scenario-harness";
import { difference, filter, flatMap, map, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;

const featureText = readFileSync(join(TEST_DIR, "invoices.feature"), "utf-8");

/**
 * The AC ids a sibling spec names in a `describe`/`it` title, as an ARRAY —
 * lodash `difference` reads a Set as having no elements, so a Set on either
 * side of the link assertion below would pass vacuously in both directions.
 *
 * FILE-LOCAL on purpose: it reads the test directory, and `node:fs` may never
 * enter this module's own barrel, which is production source every consumer
 * of this module imports.
 */
function acsNamedBySiblingSpecs(directory: string): string[] {
  const specs = filter(
    readdirSync(directory),
    file =>
      file.endsWith(".test.ts") && file !== "invoices.traceability.test.ts"
  );

  return uniq(
    flatMap(specs, file => {
      const source = readFileSync(join(directory, file), "utf-8");
      const titles = map(
        [...source.matchAll(/(?:describe|it)\(\s*["'`]([^"'`]*)["'`]/g)],
        match => match[1]
      );
      return flatMap(titles, title =>
        map([...title.matchAll(/AC-\d+/g)], hit => hit[0])
      );
    })
  );
}

// -----------------------------------------------------------------------------

describe("invoices — the module's AC-link traceability gate", () => {
  it("links every tagged scenario to a proving spec, and back", () => {
    const tagged = featureAcTags(featureText);
    const named = acsNamedBySiblingSpecs(TEST_DIR);

    expect(
      difference(tagged, named),
      "Unproven scenarios (no sibling spec names this AC)"
    ).toEqual([]);
    expect(
      difference(named, tagged),
      "Spec(s) name an AC the feature does not tag — the feature gains the " +
        "scenario, coverage never falls"
    ).toEqual([]);
  });
});
