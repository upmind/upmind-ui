// -----------------------------------------------------------------------------
/**
 * @module contract-product/__tests__/contract-product.traceability
 * @description The module's ONE traceability gate, carrying BOTH jobs: the AC
 * link (every non-dropped, non-absorbed, non-todo `@AC-*` tag in
 * `contract-product.feature` is proven — by a DRIVEN scenario carrying it, or
 * by a sibling unit spec naming it) and the spec-to-catalog drift gate over
 * `contract-product.steps.ts`.
 *
 * BOTH KEYS, one gate. `contract-product.steps.ts` serves the COLLECTION
 * (`contract_products`) and the MANAGER (`contract_product`); `stepCatalogs` is
 * keyed by MODULE, so one catalog covers both, and the covered-action check
 * reads the ids through either key's constant.
 *
 * A `@todo` scenario is a capability written down and deliberately NOT driven —
 * a named, verified blocker keeps it out of the AC-link's demand set, exactly
 * as `@dropped` / `@absorbed` are.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof, or a test claims an AC that was
 * renumbered underneath it, or the playground plays a track that no longer
 * drives what it claims to.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTraceabilityCheck,
  parseFeatureScenarios
} from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import contractProductSteps, {
  coveredActionIds
} from "./contract-product.steps";
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
const featureText = readFileSync(
  join(TEST_DIR, "contract-product.feature"),
  "utf-8"
);

const catalogSource = readFileSync(
  join(TEST_DIR, "contract-product.steps.ts"),
  "utf-8"
);

/** The catalog's source, whitespace collapsed, so a wrapped `fire(...)` reads whole. */
const unwrappedCatalog = catalogSource.replace(/\s+/g, "");

/** The two constants the catalog fires its actions through — one per scenario KEY. */
const COVERED_ACTION_MAPS = [
  "CONTRACT_PRODUCTS_COVERED_ACTIONS",
  "CONTRACT_PRODUCT_COVERED_ACTIONS"
];

const {
  scenarios,
  driveable,
  partial,
  orphanStepDefs,
  duplicatedPatterns,
  malformedStepDefs
} = createTraceabilityCheck(featureText, contractProductSteps, stepCatalogs);

/** Every `@AC-<n>` tag on a scenario NOT tagged `@dropped`, `@absorbed` or `@todo`. */
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
    if (/^Scenario(?: Outline)?:/.test(trimmed)) {
      const joined = pendingTagLines.join(" ");
      if (
        !joined.includes("@dropped") &&
        !joined.includes("@absorbed") &&
        !joined.includes("@todo")
      ) {
        for (const hit of joined.matchAll(/AC-\d+/g)) tags.push(hit[0]);
      }
    }
    if (!trimmed.startsWith("@")) pendingTagLines = [];
  }
  return uniq(tags);
}

/** Every scenario name (expanded outline rows included) tagged `@todo`. */
function todoScenarioNames(text: string): string[] {
  return map(
    filter(parseFeatureScenarios(text), s => includes(s.tags, "@todo")),
    "name"
  );
}

/** The AC ids a sibling spec names in a `describe`/`it` title, as an ARRAY. */
function acsNamedBySiblingSpecs(directory: string): string[] {
  const specs = filter(
    readdirSync(directory),
    file =>
      (file.endsWith(".test.ts") || file.endsWith(".int.test.ts")) &&
      file !== "contract-product.traceability.test.ts"
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

describe("contract-product — the module's AC-link traceability gate", () => {
  it("links every active (non-dropped, non-absorbed, non-todo) scenario tag to a proving spec", () => {
    const tagged = activeFeatureAcTags(featureText);
    // A driven scenario proves the AC its OWN tags carry — read off the parsed
    // (expanded) scenario, so an outline row's `@AC-N` counts without matching
    // the base title line.
    const drivenAcs = uniq(
      flatMap(driveable, s =>
        flatMap(s.tags ?? [], (t: string) =>
          map([...t.matchAll(/AC-\d+/g)], h => h[0])
        )
      )
    );
    const named = acsNamedBySiblingSpecs(TEST_DIR);
    const proven = union(drivenAcs, named);

    expect(
      difference(tagged, proven),
      "Unproven scenarios (no driven scenario carries this AC and no sibling spec names it)"
    ).toEqual([]);
  });

  it(`drives ${driveable.length} of ${scenarios.length} scenarios`, () => {
    // A `@todo` scenario is deliberately not driven (a named, verified blocker),
    // so a step it happens to share with the catalog making it "half-matched" is
    // not a defect — the replay skips it. Only NON-todo half-matches are the
    // dangerous case the gate guards.
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
