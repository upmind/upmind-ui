// -----------------------------------------------------------------------------
/**
 * @module contract/__tests__/contract.traceability
 * @description The module's ONE traceability gate, carrying BOTH jobs: the AC
 * link in both directions, and the spec-to-catalog drift gate over
 * `contract.steps.ts`, which serves both scenario keys (`contracts`, the
 * collection; `contract`, the manager).
 *
 * GENERIC BY CONSTRUCTION — it reads the WHOLE feature and the WHOLE catalog:
 * no scenario count, no per-scenario list, no exception list. An `@AC-N` tag is
 * proven by a DRIVEN scenario carrying it, or by a sibling unit spec naming it
 * in a `describe`/`it` title (FE-3145, ADR 035 Am.1).
 *
 * The drift verdicts: an orphan step definition FAILS; a scenario whose steps
 * match only in PART FAILS; a malformed pattern FAILS; a pattern another
 * module's catalog already claims FAILS; a covered action id no step fires
 * FAILS.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof, a test claims an AC the feature no
 * longer tags, or the playground plays a track that no longer drives what it
 * claims to.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTraceabilityCheck,
  featureAcTags
} from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import contractSteps, { coveredActionIds } from "./contract.steps";
import {
  difference,
  filter,
  flatMap,
  includes,
  map,
  reject,
  some,
  split,
  union,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const SELF = "contract.traceability.test.ts";

const featureText = readFileSync(join(TEST_DIR, "contract.feature"), "utf-8");
const catalogSource = readFileSync(
  join(TEST_DIR, "contract.steps.ts"),
  "utf-8"
);

/**
 * The catalog's source with every run of whitespace removed, so a fire call the
 * formatter wraps across lines reads the same as one on a single line.
 */
const unwrappedCatalog = catalogSource.replace(/\s+/g, "");

/** The two constants the catalog fires actions through — one per scenario key. */
const COVERED_ACTION_MAPS = [
  "CONTRACTS_COVERED_ACTIONS",
  "CONTRACT_COVERED_ACTIONS"
];

const {
  scenarios,
  driveable,
  partial,
  orphanStepDefs,
  duplicatedPatterns,
  malformedStepDefs
} = createTraceabilityCheck(featureText, contractSteps, stepCatalogs);

/** The `AC-<n>` ids a sibling spec names in a `describe`/`it` title. */
function acsNamedBySiblingSpecs(directory: string): string[] {
  const specs = filter(
    readdirSync(directory),
    file => file.endsWith(".test.ts") && file !== SELF
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

/** The `AC-<n>` ids tagged on the NAMED (driven) scenarios. */
function acTagsForScenarioNames(feature: string, names: string[]): string[] {
  const wanted = new Set(names);
  let pending: string[] = [];

  return uniq(
    flatMap(split(feature, "\n"), raw => {
      const line = raw.trim();
      if (line.startsWith("@")) {
        pending = [...pending, ...(line.match(/AC-\d+/g) ?? [])];
        return [];
      }
      const scenario = line.match(/^Scenario(?: Outline)?:\s*(.+)$/);
      if (scenario) {
        const acs = wanted.has(scenario[1].trim()) ? pending : [];
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

describe("contract — the module's one feature, both jobs", () => {
  it("proves every tagged AC by a driven scenario or a unit test, and back", () => {
    const tagged = featureAcTags(featureText);
    const drivenAcs = acTagsForScenarioNames(
      featureText,
      map(driveable, "name")
    );
    const named = acsNamedBySiblingSpecs(TEST_DIR);

    expect(tagged.length).toBeGreaterThan(0);
    expect(
      difference(tagged, union(drivenAcs, named)),
      "AC(s) the feature tags that no driven scenario carries and no unit test names"
    ).toEqual([]);
    expect(
      difference(named, tagged),
      "unit test(s) naming an AC the feature does not tag"
    ).toEqual([]);
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
    expect(driveable.length).toBeGreaterThan(0);
    expect(
      filter(split(catalogSource, "\n"), line => includes(line, "expect.")),
      "Step catalog uses a vitest matcher — it cannot run in the browser"
    ).toEqual([]);
    expect(
      reject(coveredActionIds, id =>
        some(COVERED_ACTION_MAPS, constant =>
          new RegExp(`fire\\w*!?\\((?:world,)?${constant}\\.${id}[,)]`).test(
            unwrappedCatalog
          )
        )
      ),
      "Declared covered but fired by no step"
    ).toEqual([]);
  });
});
