// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/__tests__/client-billing-settings.traceability
 * @description The module's ONE traceability test, carrying both jobs the module
 * owes its ONE `.feature`: the AC link (a tagged scenario has a proving spec —
 * a driven scenario's own `@AC-N` tag, or a unit test naming the id — and a spec
 * claims no AC the feature never tagged), and the spec-to-catalog gate (an
 * orphan definition, a half-matched scenario, a duplicated phrasing, an
 * uncompilable pattern and an over-reported covered action all fail; a scenario
 * nothing matches passes, because a capability written down and not yet driven
 * is a legitimate state).
 *
 * Generic by construction — it reads the WHOLE feature and the WHOLE catalog, so
 * no scenario count, no per-scenario list and no AC list is written down here.
 *
 * The co-located `client-billing-settings.feature` is the only truth this file
 * knows.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven — or
 * the spec and the catalog that drives it drift apart and the playlist plays
 * scenarios nobody implemented.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import {
  clientBillingSettingsSteps,
  coveredActionIds
} from "./client-billing-settings.steps";
import {
  difference,
  filter,
  flatMap,
  includes,
  map,
  reject,
  union,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const SELF = "client-billing-settings.traceability.test.ts";

const featureText = readFileSync(
  join(TEST_DIR, "client-billing-settings.feature"),
  "utf-8"
);
const catalogSource = readFileSync(
  join(TEST_DIR, "client-billing-settings.steps.ts"),
  "utf-8"
);

const {
  scenarios,
  driveable,
  partial,
  orphanStepDefs,
  duplicatedPatterns,
  malformedStepDefs
} = createTraceabilityCheck(
  featureText,
  clientBillingSettingsSteps,
  stepCatalogs
);

/** The `AC-<n>` ids a sibling spec claims in a `describe`/`it` title. */
function acsNamedBySiblingSpecs(directory: string): string[] {
  const specs = filter(
    readdirSync(directory),
    file =>
      (file.endsWith(".test.ts") || file.endsWith(".int.test.ts")) &&
      file !== SELF
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
 * The `AC-<n>` ids the feature tags, optionally only those whose scenario is
 * EXEMPT from driven proof (`@todo` = a named blocker, `@moved` = proven in
 * another module). `@moved` is exempt exactly as `@todo` is — a capability that
 * belongs to a platform seam this module only consumes.
 */
function acTagsWhere(
  feature: string,
  keep: (exempt: boolean) => boolean
): string[] {
  let pending: string[] = [];
  let exempt = false;

  return uniq(
    flatMap(feature.split("\n"), raw => {
      const line = raw.trim();
      if (line.startsWith("@")) {
        pending = [...pending, ...(line.match(/@AC-\d+/g) ?? [])];
        if (/@todo|@moved/.test(line)) exempt = true;
        return [];
      }
      if (/^Scenario(?: Outline)?:/.test(line)) {
        const acs = keep(exempt) ? map(pending, tag => tag.slice(1)) : [];
        pending = [];
        exempt = false;
        return acs;
      }
      if (line === "" || line.startsWith("#")) return [];
      pending = [];
      exempt = false;
      return [];
    })
  );
}

/** Every `AC-<n>` the feature tags, exempt or not. */
const allAcTags = (feature: string): string[] =>
  acTagsWhere(feature, () => true);

/** The `AC-<n>` ids that need driven/unit proof — i.e. NOT `@todo`/`@moved`. */
const provableAcTags = (feature: string): string[] =>
  acTagsWhere(feature, exempt => !exempt);

/** The `AC-<n>` ids tagged on the NAMED scenarios, read from the feature text. */
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

describe("client-billing-settings traceability — the module's one feature, both jobs", () => {
  it("proves every non-exempt AC by a driven scenario or a unit test, and back", () => {
    const provable = provableAcTags(featureText);
    const drivenAcs = acTagsForScenarioNames(
      featureText,
      map(driveable, "name")
    );
    const named = acsNamedBySiblingSpecs(TEST_DIR);
    const proven = union(drivenAcs, named);

    expect(provable.length).toBeGreaterThan(0);
    expect(
      difference(provable, proven),
      "AC(s) the feature tags (not @todo/@moved) that no driven scenario carries and no unit test names — shape present, behaviour unproven"
    ).toStrictEqual([]);
    expect(
      difference(named, allAcTags(featureText)),
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
        includes(
          catalogSource,
          `fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.${id}`
        )
      ),
      "declared covered but fired by no step"
    ).toStrictEqual([]);
  });
});
