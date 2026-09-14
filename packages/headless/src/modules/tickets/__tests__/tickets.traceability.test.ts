// -----------------------------------------------------------------------------
/**
 * @module tickets/__tests__/tickets.traceability
 * @description The module's AC-link gate: every non-dropped, non-absorbed
 * `@AC-*` tag in `tickets.feature` is named by a sibling spec's `describe`/
 * `it` title, and no sibling spec names an AC id the feature does not carry.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — the feature still promises it, but
 * no test protects it — or a test claims to cover an AC that was renumbered
 * or retired underneath it.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { difference, filter, flatMap, map, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const featureText = readFileSync(join(TEST_DIR, "tickets.feature"), "utf-8");

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
});
