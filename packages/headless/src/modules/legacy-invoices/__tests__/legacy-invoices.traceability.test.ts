// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/__tests__/legacy-invoices.traceability
 * @description The module's ONE traceability gate, carrying BOTH jobs: the AC
 * link in both directions, and the spec-to-catalog drift gate.
 *
 * GENERIC BY CONSTRUCTION — it reads the WHOLE feature and the WHOLE catalog,
 * so there is no hardcoded scenario count, no per-scenario list and no
 * exception list.
 *
 * The verdicts: an orphan step definition FAILS (dead code, or a scenario
 * renamed underneath it); a scenario whose steps match only in PART FAILS
 * (the dangerous case — it reads as driveable and silently is not); a
 * malformed step pattern FAILS; a pattern another module's catalog already
 * claims FAILS. A scenario nothing matches PASSES — a capability written
 * down and not yet driven is a legitimate state (this module's `useDetail`
 * scenarios today: no `World`-drive convention exists yet for a second,
 * detail-scoped cell — see `legacy-invoices.steps.ts`'s header).
 *
 * AC-15's own proving specification lives in `labs-nuxt` (decision D-35),
 * outside this package — a declared EXTRA path this gate reads, not an
 * exception list. If that file is absent, AC-15 finds no sibling spec naming
 * it and the AC-link half of this gate reds — a missing file fails the gate
 * rather than dropping AC-15 in silence (design.md D-35).
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
  parseFeatureScenarios
} from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import legacyInvoicesSteps from "./legacy-invoices.steps";
import {
  difference,
  filter,
  flatMap,
  includes,
  map,
  reject,
  split,
  union,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;

const featureText = readFileSync(
  join(TEST_DIR, "legacy-invoices.feature"),
  "utf-8"
);

const catalogSource = readFileSync(
  join(TEST_DIR, "legacy-invoices.steps.ts"),
  "utf-8"
);

const {
  scenarios,
  driveable,
  partial,
  orphanStepDefs,
  duplicatedPatterns,
  malformedStepDefs
} = createTraceabilityCheck(featureText, legacyInvoicesSteps, stepCatalogs);

/**
 * Every `@AC-<n>` on a scenario that makes a live demand: NOT `@todo` (a named,
 * verified blocker), NOT `@moved` (the behaviour belongs to another module —
 * query / session-store / auth), NOT `@dropped` / `@absorbed`.
 */
function activeFeatureAcTags(text: string): string[] {
  const tags: string[] = [];
  let pending: string[] = [];
  for (const line of split(text, "\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("@")) {
      pending.push(trimmed);
      continue;
    }
    if (/^Scenario(?: Outline)?:/.test(trimmed)) {
      const joined = pending.join(" ");
      if (
        !includes(joined, "@dropped") &&
        !includes(joined, "@absorbed") &&
        !includes(joined, "@todo") &&
        !includes(joined, "@moved")
      )
        for (const hit of joined.matchAll(/AC-\d+/g)) tags.push(hit[0]);
    }
    pending = [];
  }
  return uniq(tags);
}

/** Every `@todo` scenario name (expanded outline rows included). */
function todoScenarioNames(text: string): string[] {
  return map(
    filter(parseFeatureScenarios(text), s => includes(s.tags, "@todo")),
    "name"
  );
}

function acIdsInTitles(source: string): string[] {
  const titles = map(
    [...source.matchAll(/(?:describe|it)\(\s*["'`]([^"'`]*)["'`]/g)],
    match => match[1]
  );
  return flatMap(titles, title =>
    map([...title.matchAll(/AC-\d+/g)], hit => hit[0])
  );
}

/**
 * The AC ids a sibling spec names in a `describe`/`it` title, as an ARRAY —
 * lodash `difference` reads a Set as having no elements, so a Set on either
 * side of the link assertion below would pass vacuously in both directions.
 */
function acsNamedBySiblingSpecs(directory: string): string[] {
  const specs = filter(
    readdirSync(directory),
    file =>
      file.endsWith(".test.ts") &&
      file !== "legacy-invoices.traceability.test.ts"
  );

  return uniq(
    flatMap(specs, file =>
      acIdsInTitles(readFileSync(join(directory, file), "utf-8"))
    )
  );
}

// -----------------------------------------------------------------------------

describe("legacy-invoices — the module's AC-link traceability gate", () => {
  it("links every active scenario tag to a driven scenario or a proving spec", () => {
    const tagged = activeFeatureAcTags(featureText);
    // A driven scenario proves the AC its OWN tags carry; a non-driven active
    // scenario's AC must be named by a sibling spec (a unit test, or AC-15's
    // labs declaration spec at labs-nuxt/modules/scenarios/__tests__/, D-35).
    const drivenAcs = uniq(
      flatMap(driveable, s =>
        flatMap(s.tags ?? [], (t: string) =>
          map([...t.matchAll(/AC-\d+/g)], h => h[0])
        )
      )
    );
    const proven = union(drivenAcs, acsNamedBySiblingSpecs(TEST_DIR));

    expect(
      difference(tagged, proven),
      "Unproven scenarios (no driven scenario carries this AC and no sibling spec names it)"
    ).toEqual([]);
  });

  it(`drives ${driveable.length} of ${scenarios.length} scenarios`, () => {
    const todo = new Set(todoScenarioNames(featureText));
    expect(
      reject(map(partial, "name"), name => todo.has(name)),
      "Half-matched scenarios"
    ).toEqual([]);
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
    // browser (the labs playground drives the same steps). `expect` is a
    // vitest global — a step touching it dies in the browser.
    expect(
      filter(split(catalogSource, "\n"), line => includes(line, "expect.")),
      "Step catalog uses a vitest matcher — it cannot run in the browser"
    ).toEqual([]);
  });
});
