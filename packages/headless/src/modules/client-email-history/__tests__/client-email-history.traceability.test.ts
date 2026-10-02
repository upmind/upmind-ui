// -----------------------------------------------------------------------------
/**
 * @module client-email-history/__tests__/client-email-history.traceability
 * @description The module's ONE traceability test, carrying both jobs the module
 * owes its ONE `.feature`: the AC link (a tagged scenario has a proving spec —
 * a driven scenario carries its own `@AC-N`, or a sibling unit spec names it —
 * and a spec claims no AC the feature never tagged), and the spec-to-catalog gate
 * (an orphan definition, a half-matched scenario, a duplicated phrasing, an
 * uncompilable pattern and an over-reported covered action all fail; a scenario
 * nothing matches passes, because a capability written down and not yet driven is
 * a legitimate state).
 *
 * Generic by construction — it reads the WHOLE feature and the WHOLE catalog, so
 * no scenario count and no AC list is written down here. A driven scenario is one
 * the catalog matches, dir or no dir — so a `@signed-out` guard (which arms no
 * recording, and RED on any request) and an `@errored` boot both prove their AC.
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
  clientEmailHistorySteps,
  coveredActionIds
} from "./client-email-history.steps";
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
const SELF = "client-email-history.traceability.test.ts";

const featureText = readFileSync(
  join(TEST_DIR, "client-email-history.feature"),
  "utf-8"
);
const catalogSource = readFileSync(
  join(TEST_DIR, "client-email-history.steps.ts"),
  "utf-8"
);

const {
  scenarios,
  driveable,
  partial,
  orphanStepDefs,
  duplicatedPatterns,
  malformedStepDefs
} = createTraceabilityCheck(featureText, clientEmailHistorySteps, stepCatalogs);

/** The `AC-<n>` ids a sibling PURE-unit spec claims in a `describe`/`it` title. */
function acsNamedBySiblingSpecs(directory: string): string[] {
  const specs = filter(
    readdirSync(directory),
    file =>
      file.endsWith(".test.ts") &&
      !file.endsWith(".int.test.ts") &&
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

/** The `@AC-<n>` tags on the NAMED scenarios, read from the feature text. */
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

/**
 * The `AC-<n>` ids whose EVERY carrying scenario is exempt from a driven proof —
 * `@todo` (a named blocker) or `@moved` (proven in query / session-store / auth).
 * An AC also carried by a driven scenario is not exempt: the driven one proves it.
 */
function exemptAcTags(feature: string): string[] {
  const carrying = new Map<string, boolean[]>();
  let pendingAcs: string[] = [];
  let pendingExempt = false;

  for (const raw of feature.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("@")) {
      pendingAcs = [
        ...pendingAcs,
        ...map(line.match(/@AC-\d+/g) ?? [], tag => tag.slice(1))
      ];
      if (/@todo|@moved/.test(line)) pendingExempt = true;
      continue;
    }
    if (/^Scenario(?: Outline)?:/.test(line)) {
      for (const ac of pendingAcs)
        carrying.set(ac, [...(carrying.get(ac) ?? []), pendingExempt]);
      pendingAcs = [];
      pendingExempt = false;
      continue;
    }
    if (line === "" || line.startsWith("#")) continue;
    pendingAcs = [];
    pendingExempt = false;
  }

  const exempt: string[] = [];
  for (const [ac, flags] of carrying) if (flags.every(Boolean)) exempt.push(ac);
  return uniq(exempt);
}

// -----------------------------------------------------------------------------

describe("client-email-history traceability — the module's one feature, both jobs", () => {
  it("proves every tagged AC by a driven scenario or a unit test, and back", () => {
    const tagged = featureAcTags(featureText);
    const drivenAcs = acTagsForScenarioNames(
      featureText,
      map(driveable, "name")
    );
    const named = acsNamedBySiblingSpecs(TEST_DIR);
    const proven = union(drivenAcs, named, exemptAcTags(featureText));

    expect(tagged.length).toBeGreaterThan(0);
    expect(
      difference(tagged, proven),
      "AC(s) the feature tags that no driven scenario carries, no unit test names, and no @todo/@moved exempts — shape present, behaviour unproven"
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

  it("fires every action it declares as covered", () => {
    expect(
      reject(coveredActionIds, id =>
        includes(
          catalogSource,
          `fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.${id}`
        )
      ),
      "declared covered but fired by no step"
    ).toStrictEqual([]);
  });
});
