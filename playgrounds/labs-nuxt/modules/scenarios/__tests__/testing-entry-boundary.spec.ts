// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/testing-entry-boundary.spec
 * @description The lint boundary governing headless's THREE published entries,
 * measured by RUNNING the repo's own ESLint over each position rather than by
 * reading its config.
 *
 * `./testing` also carries internal kits and integration kits, so it is admitted
 * in the test lane and in the ONE app-runtime seam block 8h names, and refused
 * everywhere else in the playground. `./fixtures` carries recordings ONLY, so
 * FE-3113 admits it from ANY app-runtime file without reopening that narrow
 * seam. `./features` carries the playlist text and the engine-free step catalogs
 * ONLY, so FE-3133 admits it the same way — that is what lets the app seam carry
 * the artefacts WITHOUT `./testing`'s harness globs, whose lazily-named
 * `setup.integration.ts` drags msw's node-only interceptors into a production
 * build. No entry opens the package: the allowlist is anchored, so a subpath
 * below any one of them is refused from every position.
 *
 * The matrix is (position × specifier) so a widened lookahead shows up as a
 * cell that changed, not as a rule that disappeared.
 *
 * ## What Breaks If These Fail
 * Admitted too widely, step catalogs enter the product bundle, or an unanchored
 * allowlist reopens the whole package under a recordings-shaped specifier;
 * refused too widely, an entry cannot be reached at all and the seam goes back
 * to naming files inside another package.
 *
 * Negative controls: `testing-entry-boundary.per-module-subpath.must-fail.patch`.
 *
 * Negative control OWED, developer lane (a mutant needs the config's own line):
 * an allowlist that matches the recordings entry UNANCHORED must red `refuses a
 * path BELOW the recordings entry from every position`. Filed as
 * `testing-entry-boundary.unanchored-recordings.must-fail.patch`.
 */

import { join, relative } from "node:path";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";
import { filter, flatMap, fromPairs, map, reject, sortBy } from "lodash-es";

// -----------------------------------------------------------------------------

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..", "..", "..");

const ENTRY = "@upmind-automation/headless/testing";
const RECORDINGS = "@upmind-automation/headless/fixtures";
const FEATURES = "@upmind-automation/headless/features";
const INTO_THE_PACKAGE =
  "@upmind-automation/headless/src/modules/client-email/__tests__/client-email.steps";
const INTO_THE_ENTRY = `${ENTRY}/recorded`;
const INTO_THE_RECORDINGS = `${RECORDINGS}/recorded`;
const INTO_THE_SCENARIOS = `${FEATURES}/recorded`;

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
const SPECIFIERS = [
  ENTRY,
  RECORDINGS,
  FEATURES,
  INTO_THE_PACKAGE,
  INTO_THE_ENTRY,
  INTO_THE_RECORDINGS,
  INTO_THE_SCENARIOS
];

/** The same import, spelled the way the position's own parser reads a file. */
function importing(position: string, specifier: string): string {
  const statement = `import { thing } from "${specifier}";\n\nconst consumed = thing;\n`;

  return position.endsWith(".vue")
    ? `<script setup lang="ts">\n${statement}</script>\n\n<template>\n  <div>{{ consumed }}</div>\n</template>\n`
    : `${statement}\nexport default consumed;\n`;
}

/** The playground as it stands on disk — the tree the synthetic matrix models. */
const PLAYGROUND = ["app", "modules"].map(
  root => `playgrounds/labs-nuxt/${root}/**/*.{ts,vue}`
);

/** Every restricted-import complaint one position raises about one specifier. */
let restricted: Record<string, Record<string, string[]>>;

/** Real files in the tree the boundary already refuses. */
let offenders: string[];

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

  offenders = flatMap(await eslint.lintFiles(PLAYGROUND), result =>
    map(
      filter(
        result.messages,
        message => message.ruleId === "no-restricted-imports"
      ),
      message => `${relative(REPO_ROOT, result.filePath)}: ${message.message}`
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

  it("refuses a path BELOW the entry itself — the entry is re-armed bare, never as a prefix", () => {
    expect(
      reject(
        POSITIONS,
        position => complaintsAt(position, INTO_THE_ENTRY).length > 0
      )
    ).toStrictEqual([]);
  });

  it("names the entry in what it says, so a refusal points at the way in", () => {
    const complaint = complaintsAt(APP_RUNTIME[0], ENTRY)[0];

    expect(complaint).toContain('"./testing"');
  });
});

describe("the lint boundary — who may reach the published recordings", () => {
  it("admits the recordings entry from every app-runtime position, not just the named seam", () => {
    expect(
      reject(
        POSITIONS,
        position => complaintsAt(position, RECORDINGS).length === 0
      )
    ).toStrictEqual([]);
  });

  it("refuses a path BELOW the recordings entry from every position", () => {
    expect(
      reject(
        POSITIONS,
        position => complaintsAt(position, INTO_THE_RECORDINGS).length > 0
      )
    ).toStrictEqual([]);
  });

  it("keeps the narrow test-entry seam exactly as it was, so recordings widened nothing else", () => {
    expect(
      reject(APP_RUNTIME, position => complaintsAt(position, ENTRY).length > 0)
    ).toStrictEqual([]);
  });
});

describe("the lint boundary — who may reach the published features", () => {
  it("admits the features entry from every app-runtime position, not just the named seam", () => {
    expect(
      reject(
        POSITIONS,
        position => complaintsAt(position, FEATURES).length === 0
      )
    ).toStrictEqual([]);
  });

  it("refuses a path BELOW the features entry from every position", () => {
    expect(
      reject(
        POSITIONS,
        position => complaintsAt(position, INTO_THE_SCENARIOS).length > 0
      )
    ).toStrictEqual([]);
  });

  it("keeps the narrow test-entry seam exactly as it was, so features widened nothing else", () => {
    expect(
      reject(APP_RUNTIME, position => complaintsAt(position, ENTRY).length > 0)
    ).toStrictEqual([]);
  });
});

describe("the lint boundary — the tree itself, not only the rule", () => {
  it("leaves no file in the playground the boundary refuses", () => {
    expect(sortBy(offenders)).toStrictEqual([]);
  });
});
