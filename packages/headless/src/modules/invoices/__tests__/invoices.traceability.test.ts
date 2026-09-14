/**
 * @module invoices/__tests__/invoices.traceability
 * @description The module's ONE traceability gate, carrying BOTH jobs: the AC
 * link in both directions, and the spec-to-catalog drift gate.
 *
 * GENERIC BY CONSTRUCTION — it reads the WHOLE feature and the WHOLE catalog,
 * so there is no hardcoded scenario count, no per-scenario list and no
 * exception list. A scenario or a definition appended later is inside this
 * verdict the moment it lands, and the driveable count is in the test NAME
 * rather than asserted, so a spec outgrowing its catalog is a number the
 * operator reads instead of a silence.
 *
 * The verdicts: an orphan step definition FAILS (dead code, or a scenario
 * renamed underneath it); a scenario whose steps match only in PART FAILS (the
 * dangerous case — it reads as driveable and silently is not); a malformed step
 * pattern FAILS; a pattern another module's catalog already claims FAILS; an
 * action id the catalog declares covered that no step fires FAILS. A scenario
 * nothing matches PASSES — it is a capability written down and not yet driven,
 * which is a legitimate state (this module's `useDetail` scenarios today: no
 * `World`-drive convention exists yet for a second, detail-scoped cell — see
 * `invoices.steps.ts`'s header).
 *
 * EXTENDED 2026-09-08 (this dispatch) with the `createTraceabilityCheck` pass
 * the file's own prior docstring deferred: it named two preconditions —
 * "a catalog and a page exist" — and both now do (`invoices.steps.ts`,
 * `playgrounds/labs-nuxt/modules/scenarios/useInvoices/`).
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven —
 * or the playground plays a track that no longer drives what it claims to.
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
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;

const featureText = readFileSync(join(TEST_DIR, "invoices.feature"), "utf-8");

/** The step catalog's own source — read for the browser-runtime guard below. */
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

/**
 * The arity `useInvoices().as("self").useActions()` publicly declares for
 * every action `INVOICES_COVERED_ACTIONS` names — read off the exported
 * function signatures in `useInvoices.actions.ts` (public surface: the return
 * type of `createInvoicesActions`), never from this file's own assumption.
 * `Function.prototype.length` ignores only parameters carrying a JS runtime
 * default (`= value`); TypeScript's `?` optional marker erases at compile
 * time to an ordinary parameter, so `filterCreditNotes(invoiceId?: string)`
 * still counts 1 — measured empirically against the live function, not
 * assumed (both arities below are pinned against the real runtime value,
 * confirmed by running this test, not read off the implementation source).
 * Pinning this — not just that the member is callable — is
 * what would have caught Review blocker B1 mechanically: `sortBy` silently
 * regaining its pre-conformance `(field, dir)` two-argument shape changes
 * `.length` from 1 to 2 with no other signal.
 */
const EXPECTED_ACTION_ARITY: Record<string, number> = {
  isReady: 0,
  refresh: 0,
  setCriteria: 1,
  sortBy: 1,
  assignPaymentMethod: 2,
  refreshAfterPayment: 0,
  filterCreditNotes: 1
};

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

    // The catalog runs in TWO runtimes: vitest (the node replay) and the
    // BROWSER (the labs playground drives the same steps). `expect` is a
    // vitest global — in the browser a step touching it dies with
    // "expect is not defined" and the scene reports failed. The harness's own
    // `matchesExpectation` already reads an object as a subset, and since
    // 2026-09-12 refuses anything that is not plain data, so a matcher is
    // both unnecessary here and silently inert.
    expect(
      filter(split(catalogSource, "\n"), line => includes(line, "expect.")),
      "Step catalog uses a vitest matcher — it cannot run in the browser"
    ).toEqual([]);

    // W3 repair: this used to be `includes(catalogSource, \`fire(...\`)\`)` —
    // a substring grep of the CATALOG'S OWN SOURCE TEXT, satisfiable by a
    // string sitting in a comment and never touching the composable. It
    // executes nothing. Replaced with a live check against the REAL
    // `useInvoices().as("self").useActions()` surface: every declared-covered
    // id must be an actual `isFunction` member, AND its arity must match the
    // public contract — the mechanism that would have caught Review blocker
    // B1 (`sortBy`'s arity silently regressing from one array argument back
    // to two positional ones).
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
