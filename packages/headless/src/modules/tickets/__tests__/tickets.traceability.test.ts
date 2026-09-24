// -----------------------------------------------------------------------------
/**
 * @module tickets/__tests__/tickets.traceability
 * @description The module's ONE traceability gate, carrying BOTH jobs: the
 * AC link (every non-dropped, non-absorbed `@AC-*` tag in `tickets.feature`
 * is named by a sibling spec's `describe`/`it` title), and the
 * spec-to-catalog drift gate over `tickets.steps.ts`.
 *
 * BOTH KEYS, one gate. `tickets.steps.ts` serves the COLLECTION page
 * (`tickets`) and the self-drawn MANAGER page (`ticket`) —
 * `stepCatalogs` is keyed by MODULE, so one catalog covers both — and the
 * covered-action check reads the ids through either key's constant rather than
 * one hardcoded name. The driveable count in the test NAME therefore counts
 * both surfaces' scenarios, which is why it moves when either gains steps.
 *
 * GENERIC BY CONSTRUCTION — the second gate reads the WHOLE feature and the
 * WHOLE catalog, so there is no hardcoded scenario count, no per-scenario list
 * and no exception list. A scenario or a definition appended later is inside
 * this verdict the moment it lands, and the driveable count is in the test
 * NAME rather than asserted, so a spec outgrowing its catalog is a number the
 * operator reads instead of a silence.
 *
 * The verdicts: an orphan step definition FAILS (dead code, or a scenario
 * renamed underneath it); a scenario whose steps match only in PART FAILS (the
 * dangerous case — it reads as driveable and silently is not); a malformed
 * step pattern FAILS; a pattern another module's catalog already claims FAILS;
 * an action id the catalog declares covered that no step fires FAILS. A
 * scenario nothing matches PASSES — under ADR-020 Amendment 5 that is a
 * capability written down and deliberately not driven by this key, which is a
 * legitimate state.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — the feature still promises it, but
 * no test protects it — or a test claims to cover an AC that was renumbered
 * or retired underneath it. Or the playground plays a track that no longer
 * drives what it claims to.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import ticketsSteps, { coveredActionIds } from "./tickets.steps";
import {
  difference,
  filter,
  flatMap,
  includes,
  map,
  reject,
  some,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const featureText = readFileSync(join(TEST_DIR, "tickets.feature"), "utf-8");

const catalogSource = readFileSync(join(TEST_DIR, "tickets.steps.ts"), "utf-8");

/**
 * The catalog's source with every run of whitespace collapsed away, so the
 * "declared covered but fired by no step" check reads a `fire(...)` call the
 * formatter has wrapped across lines exactly as it reads one that fits on one.
 */
const unwrappedCatalog = catalogSource.replace(/\s+/g, "");

/**
 * The two constants the catalog fires its actions through — one per scenario
 * KEY the one module serves (`tickets`, the collection; `ticket`,
 * the self-drawn manager). An id is covered when SOME step fires it through
 * either: the ids are graded, not the map they were read off, and the two cells
 * legitimately share a member name (`isReady`, `refresh`).
 *
 * Named here rather than derived so the check stays mechanical: a third key
 * would add a third constant, and an id fired through none of them still fails.
 */
const COVERED_ACTION_MAPS = [
  "TICKETS_COVERED_ACTIONS",
  "TICKET_COVERED_ACTIONS"
];

const {
  scenarios,
  driveable,
  partial,
  orphanStepDefs,
  duplicatedPatterns,
  malformedStepDefs
} = createTraceabilityCheck(featureText, ticketsSteps, stepCatalogs);

/** Every `@AC-<n>` tag on a scenario NOT tagged `@dropped` or `@absorbed`. */
function activeFeatureAcTags(text: string): string[] {
  const lines = text.split("\n");
  const tags: string[] = [];
  let pendingTagLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("@")) {
      pendingTagLines.push(trimmed);
      continue;
    }
    if (trimmed.startsWith("Scenario:")) {
      const joined = pendingTagLines.join(" ");
      if (!joined.includes("@dropped") && !joined.includes("@absorbed")) {
        for (const hit of joined.matchAll(/AC-\d+/g)) tags.push(hit[0]);
      }
    }
    if (!trimmed.startsWith("@")) pendingTagLines = [];
  }
  return uniq(tags);
}

/** The AC ids a sibling spec names in a `describe`/`it` title, as an ARRAY. */
function acsNamedBySiblingSpecs(directory: string): string[] {
  const specs = filter(
    readdirSync(directory),
    file =>
      (file.endsWith(".test.ts") || file.endsWith(".int.test.ts")) &&
      file !== "tickets.traceability.test.ts"
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

describe("tickets — the module's AC-link traceability gate", () => {
  it("links every active (non-dropped, non-absorbed) scenario tag to a proving spec", () => {
    const tagged = activeFeatureAcTags(featureText);
    const named = acsNamedBySiblingSpecs(TEST_DIR);

    expect(
      difference(tagged, named),
      "Unproven scenarios (no sibling spec names this AC)"
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
    expect(
      reject(coveredActionIds, id =>
        some(COVERED_ACTION_MAPS, constant =>
          includes(unwrappedCatalog, `fire(${constant}.${id}`)
        )
      ),
      "Declared covered but fired by no step"
    ).toEqual([]);
  });
});
