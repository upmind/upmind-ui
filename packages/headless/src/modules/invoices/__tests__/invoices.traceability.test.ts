// -----------------------------------------------------------------------------
/**
 * @module invoices/__tests__/invoices.traceability
 * @description The module's ONE traceability gate, carrying BOTH jobs: the AC
 * link in both directions, and the spec-to-catalog drift gate.
 *
 * GENERIC BY CONSTRUCTION — it reads the WHOLE feature and the WHOLE catalog, so
 * there is no hardcoded scenario count, no per-scenario list and no exception
 * list. A tagged AC is proven either by a DRIVEN scenario carrying that tag or
 * by a sibling unit spec naming it in a title (FE-3145, ADR 035 Am.1: a
 * capability the collection catalog drives, or one a pure unit test proves —
 * the `useInvoice` detail-cell capabilities the feature marks `@todo` are
 * exempt, being neither driven nor tagged on a live scenario).
 *
 * The drift verdicts: an orphan step definition FAILS; a scenario whose steps
 * match only in PART FAILS (it reads as driveable and silently is not); a
 * malformed step pattern FAILS; a pattern another module's catalog already
 * claims FAILS; a declared-covered action id whose live arity drifts from its
 * pinned public contract FAILS.
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
import { useInvoices } from "..";
import { stepCatalogs } from "../../../testing";
import invoicesSteps, { coveredActionIds } from "./invoices.steps";
import {
  difference,
  filter,
  flatMap,
  includes,
  isFunction,
  map,
  reject,
  split,
  union,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const SELF = "invoices.traceability.test.ts";

const featureText = readFileSync(join(TEST_DIR, "invoices.feature"), "utf-8");
const catalogSource = readFileSync(
  join(TEST_DIR, "invoices.steps.ts"),
  "utf-8"
);

const {
  scenarios,
  driveable,
  partial,
  orphanStepDefs,
  duplicatedPatterns,
  malformedStepDefs
} = createTraceabilityCheck(featureText, invoicesSteps, stepCatalogs);

/**
 * The `AC-<n>` ids a sibling spec names in a `describe`/`it` title — the pure
 * unit proof half of the link. FILE-LOCAL: it reads the test directory, and
 * `node:fs` may never enter the module's own barrel, which is production source.
 */
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

/**
 * The `AC-<n>` ids tagged on the NAMED (driven) scenarios, read from the feature
 * — so a driven scenario's own `@AC-N` tag proves that AC without a sibling spec
 * having to name it in a title.
 */
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

/**
 * The arity `useInvoices().as("self").useActions()` publicly declares for every
 * action `coveredActionIds` names — pinning this catches an action silently
 * regaining a pre-conformance signature (`sortBy` back to `(field, dir)`).
 */
const EXPECTED_ACTION_ARITY: Record<string, number> = {
  isReady: 0,
  refresh: 0,
  setCriteria: 1,
  sortBy: 1,
  filterCreditNotes: 0,
  filterBy: 1,
  setPage: 1,
  setLimit: 1,
  search: 1,
  nextPage: 0,
  prevPage: 0
};

// -----------------------------------------------------------------------------

describe("invoices — the module's one feature, both jobs", () => {
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
      "AC(s) the feature tags that no driven scenario carries and no unit test names"
    ).toEqual([]);
    expect(
      difference(named, tagged),
      "unit test(s) naming an AC the feature does not tag on a live scenario"
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

    // The catalog runs in vitest AND the browser playground; `expect` is a
    // vitest global that dies in the browser, so the catalog may hold none.
    expect(
      filter(split(catalogSource, "\n"), line => includes(line, "expect.")),
      "Step catalog uses a vitest matcher — it cannot run in the browser"
    ).toEqual([]);

    // A live check against the REAL action surface: every declared-covered id is
    // an actual function AND its arity matches the pinned public contract.
    const liveActions = useInvoices().as("self").useActions() as Record<
      string,
      unknown
    >;

    expect(
      difference(coveredActionIds, Object.keys(EXPECTED_ACTION_ARITY)),
      "Covered action id has no pinned expected arity in this test — add one"
    ).toEqual([]);
    expect(
      reject(coveredActionIds, id => isFunction(liveActions[id])),
      "Declared covered but not a live action member"
    ).toEqual([]);
    expect(
      filter(
        coveredActionIds,
        id =>
          isFunction(liveActions[id]) &&
          (liveActions[id] as (...args: unknown[]) => unknown).length !==
            EXPECTED_ACTION_ARITY[id]
      ),
      "Declared-covered action's arity drifted from its pinned public contract"
    ).toEqual([]);
  });
});
