// -----------------------------------------------------------------------------
/**
 * @module client-email/__tests__/client-email.traceability
 * @description The module's ONE traceability test, carrying both jobs the
 * module owes its ONE `.feature`: the AC link (a tagged scenario has a proving
 * spec, and a spec claims no AC the feature never tagged), and the spec-to-
 * catalog gate (an orphan definition, a half-matched scenario, a duplicated
 * phrasing, an uncompilable pattern and an over-reported covered action all
 * fail; a scenario nothing matches passes, because a capability written down
 * and not yet driven is a legitimate state).
 *
 * Generic by construction — it reads the WHOLE feature and the WHOLE catalog,
 * so no scenario count, no per-scenario list and no AC list is written down
 * here. The driveable-of-total count lives in the test NAME, which is what puts
 * a scenario or a definition appended tomorrow inside this verdict the moment
 * it lands.
 *
 * The co-located `client-email.feature` is the only truth this file knows.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven —
 * or the spec and the catalog that drives it drift apart and the playlist plays
 * scenarios nobody implemented.
 *
 * Negative controls: `client-email.traceability.must-fail.patch`.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTraceabilityCheck,
  featureAcTags
} from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import { clientEmailsSteps, coveredActionIds } from "./client-email.steps";
import {
  difference,
  filter,
  flatMap,
  includes,
  map,
  reject,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const SELF = "client-email.traceability.test.ts";

const featureText = readFileSync(
  join(TEST_DIR, "client-email.feature"),
  "utf-8"
);
const catalogSource = readFileSync(
  join(TEST_DIR, "client-email.steps.ts"),
  "utf-8"
);

const {
  scenarios,
  driveable,
  partial,
  orphanStepDefs,
  duplicatedPatterns,
  malformedStepDefs
} = createTraceabilityCheck(featureText, clientEmailsSteps, stepCatalogs);

/**
 * The `AC-<n>` ids a sibling spec claims in a `describe`/`it` title. Stays
 * file-local: it reads the test directory, and `node:fs` may never enter the
 * harness's own barrel, which is production source every consumer executes.
 */
function acsNamedBySiblingSpecs(directory: string): string[] {
  const specs = filter(
    readdirSync(directory),
    file => file.endsWith(".test.ts") && file !== SELF
  );

  return uniq(
    flatMap(specs, file => {
      const titles = readFileSync(join(directory, file), "utf-8").matchAll(
        /(?:describe|it)\(\s*["'`]([^"'`]*)["'`]/g
      );

      return flatMap([...titles], title =>
        map([...title[1].matchAll(/AC-(\d+)/g)], ac => `AC-${ac[1]}`)
      );
    })
  );
}

// -----------------------------------------------------------------------------

describe("client-email traceability — the module's one feature, both jobs", () => {
  it("links every tagged scenario to a proving spec, and back", () => {
    const tagged = featureAcTags(featureText);
    const named = acsNamedBySiblingSpecs(TEST_DIR);

    expect(tagged.length).toBeGreaterThan(0);
    expect(
      difference(tagged, named),
      "scenario(s) the feature tags that no sibling spec names — shape present, behaviour unproven"
    ).toStrictEqual([]);
    expect(
      difference(named, tagged),
      "spec(s) naming an AC the feature does not tag — the feature gains the scenario, coverage never falls"
    ).toStrictEqual([]);
  });

  it(`drives ${driveable.length} of ${scenarios.length} scenarios`, () => {
    expect(
      map(partial, "name"),
      "scenario(s) matched only in part — they read as driveable and silently are not"
    ).toStrictEqual([]);
    expect(
      map(orphanStepDefs, "pattern"),
      "step definition(s) no scenario uses"
    ).toStrictEqual([]);
    expect(
      duplicatedPatterns,
      "phrasing(s) another module's catalog also claims"
    ).toStrictEqual([]);
    expect(
      map(malformedStepDefs, "pattern"),
      "step pattern(s) that do not compile as a cucumber expression"
    ).toStrictEqual([]);
    expect(driveable.length).toBeGreaterThan(0);
  });

  // A handler is a closure, so the only way a catalog admits which ids it fires
  // is its own source.
  it("fires every action it declares as covered", () => {
    expect(
      reject(coveredActionIds, id =>
        includes(catalogSource, `fire(CLIENT_EMAILS_COVERED_ACTIONS.${id}`)
      ),
      "declared covered but fired by no step"
    ).toStrictEqual([]);
  });
});
