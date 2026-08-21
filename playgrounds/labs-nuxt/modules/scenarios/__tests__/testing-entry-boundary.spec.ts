// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/testing-entry-boundary.spec
 * @description The lint boundary governing headless's published test entry,
 * measured by RUNNING the repo's own ESLint over each position rather than by
 * reading its config: the entry is admitted in the test lane and in the ONE
 * app-runtime seam block 8h names, refused everywhere else in the playground,
 * and no position anywhere admits a path INTO the package.
 *
 * The matrix is (position × specifier) so a widened lookahead shows up as a
 * cell that changed, not as a rule that disappeared.
 *
 * ## What Breaks If These Fail
 * Admitted too widely, recorded fixtures and step catalogs enter the product
 * bundle; refused too widely, the entry cannot be reached at all and the seam
 * goes back to naming files inside another package.
 */

import { join } from "node:path";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";
import { filter, fromPairs, map, reject } from "lodash-es";

// -----------------------------------------------------------------------------

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..", "..", "..");

const ENTRY = "@upmind-automation/headless/testing";
const INTO_THE_PACKAGE =
  "@upmind-automation/headless/src/modules/client-email/__tests__/client-email.steps";

const TEST_LANE = "playgrounds/labs-nuxt/tests/e2e/catalogs.ts";
const NAMED_APP_SEAM =
  "playgrounds/labs-nuxt/modules/scenarios/runtime/force/corpus.source.ts";

/** App-runtime files block 8h does NOT name — the refusal side of the boundary. */
const APP_RUNTIME = [
  "playgrounds/labs-nuxt/modules/scenarios/runtime/registry.ts",
  "playgrounds/labs-nuxt/modules/scenarios/runtime/ScenarioPlayground.vue",
  "playgrounds/labs-nuxt/app/composables/useNavigation.ts"
];

const POSITIONS = [TEST_LANE, NAMED_APP_SEAM, ...APP_RUNTIME];
const SPECIFIERS = [ENTRY, INTO_THE_PACKAGE];

/** The same import, spelled the way the position's own parser reads a file. */
function importing(position: string, specifier: string): string {
  const statement = `import { thing } from "${specifier}";\n\nconst consumed = thing;\n`;

  return position.endsWith(".vue")
    ? `<script setup lang="ts">\n${statement}</script>\n\n<template>\n  <div>{{ consumed }}</div>\n</template>\n`
    : `${statement}\nexport default consumed;\n`;
}

/** Every restricted-import complaint one position raises about one specifier. */
let restricted: Record<string, Record<string, string[]>>;

const complaintsAt = (position: string, specifier: string) =>
  restricted[position][specifier];

// -----------------------------------------------------------------------------

beforeAll(async () => {
  const eslint = new ESLint({ cwd: REPO_ROOT });

  const lint = async (filePath: string, specifier: string) => {
    const [result] = await eslint.lintText(importing(filePath, specifier), {
      filePath: join(REPO_ROOT, filePath),
      warnIgnored: false
    });

    return map(
      filter(
        result.messages,
        message => message.ruleId === "no-restricted-imports"
      ),
      "message"
    );
  };

  restricted = fromPairs(
    await Promise.all(
      map(POSITIONS, async position => [
        position,
        fromPairs(
          await Promise.all(
            map(SPECIFIERS, async specifier => [
              specifier,
              await lint(position, specifier)
            ])
          )
        )
      ])
    )
  );
}, 120000);

// -----------------------------------------------------------------------------

describe("the lint boundary — who may reach the published test entry", () => {
  it("admits the bare entry in the test lane", () => {
    expect(complaintsAt(TEST_LANE, ENTRY)).toStrictEqual([]);
  });

  it("admits it in the ONE app-runtime seam the config names, and nowhere else in the app", () => {
    expect(complaintsAt(NAMED_APP_SEAM, ENTRY)).toStrictEqual([]);
    expect(
      reject(APP_RUNTIME, position => complaintsAt(position, ENTRY).length > 0)
    ).toStrictEqual([]);
  });

  it("refuses a path INTO the package from every position, the test lane included", () => {
    expect(
      reject(
        POSITIONS,
        position => complaintsAt(position, INTO_THE_PACKAGE).length > 0
      )
    ).toStrictEqual([]);
  });

  it("names the entry in what it says, so a refusal points at the way in", () => {
    const complaint = complaintsAt(APP_RUNTIME[0], ENTRY)[0];

    expect(complaint).toContain('"./testing"');
  });
});
