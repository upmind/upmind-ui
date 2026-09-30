// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/__tests__/client-custom-fields.traceability
 * @description The module's ONE traceability test, carrying both jobs the module
 * owes its ONE `.feature`: the AC link (a tagged scenario has a proving spec —
 * a driven scenario carrying its own `@AC-N`, or a unit test naming it — and a
 * spec claims no AC the feature never tagged), and the spec-to-catalog gate (an
 * orphan definition, a half-matched scenario, a duplicated phrasing, an
 * uncompilable pattern and an over-reported covered action all fail; a scenario
 * nothing matches passes, because a capability written down and not yet driven
 * is a legitimate state).
 *
 * Generic by construction — it reads the WHOLE feature and the WHOLE catalog, so
 * no scenario count, no per-scenario list and no AC list is written down here.
 * The driveable-of-total count lives in the test NAME.
 *
 * The co-located `client-custom-fields.feature` is the only truth this file
 * knows.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven — or
 * the spec and the catalog that drives it drift apart.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTraceabilityCheck,
  featureAcTags
} from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import {
  clientCustomFieldsSteps,
  coveredActionIds
} from "./client-custom-fields.steps";
import {
  difference,
  filter,
  flatMap,
  map,
  reject,
  union,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const SELF = "client-custom-fields.traceability.test.ts";

const featureText = readFileSync(
  join(TEST_DIR, "client-custom-fields.feature"),
  "utf-8"
);
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

/**
 * The `AC-<n>` ids tagged on the NAMED scenarios, read from the feature text —
 * so a driven scenario's own `@AC-N` tag can prove that AC without a sibling
 * spec having to name it in a title.
 */
function acTagsForScenarioNames(feature: string, names: string[]): string[] {
  const wanted = new Set(names);
  let pending: string[] = [];

  return uniq(
    flatMap(feature.split("\n"), raw => {
      const line = raw.trim();
      if (line.startsWith("@")) {
        pending = [...pending, ...(line.match(/@AC-\d+/g) ?? [])];
        return [];
      }
      const scenario = line.match(/^Scenario(?: Outline)?:\s*(.+)$/);
      if (scenario) {
        const acs = wanted.has(scenario[1].trim())
          ? map(pending, tag => tag.slice(1))
          : [];
        pending = [];
        return acs;
      }
      if (line === "" || line.startsWith("#")) return [];
      pending = [];
      return [];
    })
  );
}

// -----------------------------------------------------------------------------

describe("client-custom-fields traceability — the module's one feature, both jobs", () => {
  it("proves every tagged AC by a driven scenario or a unit test, and back", () => {
    const tagged = featureAcTags(featureText);
    const drivenAcs = acTagsForScenarioNames(
      featureText,
      map(driveable, "name")
    );
    const named = acsNamedBySiblingSpecs(TEST_DIR);
    const proven = union(drivenAcs, named);

    expect(tagged.length).toBeGreaterThan(0);
    expect(
      difference(tagged, proven),
      "AC(s) the feature tags that no driven scenario carries and no unit test names — shape present, behaviour unproven"
    ).toStrictEqual([]);
    expect(
      difference(named, tagged),
      "unit test(s) naming an AC the feature does not tag — the feature gains the scenario, coverage never falls"
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
        new RegExp(
          `fire\\(\\s*CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS\\.${id}\\b`
        ).test(catalogSource)
      ),
      "declared covered but fired by no step"
    ).toStrictEqual([]);
  });
});
