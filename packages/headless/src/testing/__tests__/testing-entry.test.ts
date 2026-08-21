// -----------------------------------------------------------------------------
/**
 * @module testing/__tests__/testing-entry
 * @description The published test-artefact entry's four claims: it RESOLVES,
 * it keys every artefact by the module that owns it, it keeps the recorded
 * bodies LAZY, and the layout its keying depends on holds across the package —
 * one `.feature` and one `.steps.ts` per module.
 *
 * The oracle is the disk, never the entry: every expectation below is read
 * with `node:fs` off the module directories themselves, so a glob that silently
 * drops, mis-keys or re-parses an artefact is a difference rather than a
 * matching pair of assumptions.
 *
 * ## What Breaks If These Fail
 * A page's playlist, the catalog that plays it and the corpus a replay installs
 * all arrive through this one entry. Mis-keyed, a page plays another module's
 * scenarios; eager, every consumer parses the whole ~1.6MB corpus on every page.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import clientEmailsSteps from "../../modules/client-email/__tests__/client-email.steps";
import { featureText, recordedBodies, stepCatalogs } from "../index";
import {
  every,
  filter,
  first,
  flatten,
  includes,
  isFunction,
  keys,
  map,
  reject,
  some,
  sortBy,
  values
} from "lodash-es";

// -----------------------------------------------------------------------------

const MODULES_DIR = join(import.meta.dirname, "..", "..", "modules");
const PACKAGE_ROOT = join(import.meta.dirname, "..", "..", "..");
const CONSUMER_CWD = join(PACKAGE_ROOT, "..", "..", "playgrounds", "labs-nuxt");

const ENTRY = "@upmind-automation/headless/testing";

/** Every way of spelling a path INTO the entry rather than the entry itself. */
const PATHS_INTO_THE_ENTRY = [
  `${ENTRY}/index.ts`,
  `${ENTRY}/`,
  "@upmind-automation/headless/src/testing/index.ts",
  "@upmind-automation/headless/src/modules/client-email/__tests__/client-email.feature"
];

const testsDirOf = (module: string) => join(MODULES_DIR, module, "__tests__");

/**
 * Node's own resolver, in its own process whose cwd is a real consumer: no
 * Vite, no Vitest, no alias map, so what answers is the `exports` map itself.
 */
function resolveOutsideBundler(
  specifiers: string[]
): Record<string, { ok: boolean; url?: string; code?: string }> {
  const script = `
    const out = {};
    for (const specifier of ${JSON.stringify(specifiers)}) {
      try {
        out[specifier] = { ok: true, url: import.meta.resolve(specifier) };
      } catch (error) {
        out[specifier] = { ok: false, code: error.code };
      }
    }
    process.stdout.write(JSON.stringify(out));
  `;

  return JSON.parse(
    execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: CONSUMER_CWD,
      encoding: "utf8"
    })
  );
}

/** Every module directory the package holds, read off disk rather than listed. */
const moduleNames = map(
  filter(readdirSync(MODULES_DIR, { withFileTypes: true }), entry =>
    entry.isDirectory()
  ),
  entry => entry.name
);

/** The files a module's `__tests__/` holds, or nothing when it keeps none. */
function testArtefacts(module: string): string[] {
  try {
    return readdirSync(testsDirOf(module));
  } catch {
    return [];
  }
}

const artefactsEndingIn = (module: string, suffix: string) =>
  filter(testArtefacts(module), file => file.endsWith(suffix));

const modulesKeeping = (suffix: string) =>
  filter(moduleNames, module => some(artefactsEndingIn(module, suffix)));

// -----------------------------------------------------------------------------

describe("the published ./testing entry — it resolves as a package specifier", () => {
  it("answers the bare entry from the package's own exports map, with no bundler in play", () => {
    const resolved = resolveOutsideBundler([ENTRY]);

    expect(resolved[ENTRY].code).toBeUndefined();
    expect(resolved[ENTRY].url).toContain(
      "/packages/headless/src/testing/index.ts"
    );
  });

  it("publishes ONE specifier — every path into it stays refused by the resolver", () => {
    const resolved = resolveOutsideBundler(PATHS_INTO_THE_ENTRY);

    expect(
      map(PATHS_INTO_THE_ENTRY, specifier => resolved[specifier].code)
    ).toStrictEqual(
      map(PATHS_INTO_THE_ENTRY, () => "ERR_PACKAGE_PATH_NOT_EXPORTED")
    );
  });
});

describe("the published ./testing entry — artefacts keyed by their own module", () => {
  it("publishes the feature text of every module keeping one, keyed by that module's directory", () => {
    expect(sortBy(keys(featureText))).toStrictEqual(
      sortBy(modulesKeeping(".feature"))
    );
  });

  it("hands back each module's own file verbatim, never another module's", () => {
    const onDisk = map(keys(featureText), module =>
      readFileSync(
        join(testsDirOf(module), first(artefactsEndingIn(module, ".feature"))!),
        "utf-8"
      )
    );

    expect(values(featureText)).toStrictEqual(onDisk);
  });

  it("publishes the step catalog of every module keeping one, as that file's own default export", () => {
    expect(sortBy(keys(stepCatalogs))).toStrictEqual(
      sortBy(modulesKeeping(".steps.ts"))
    );
    expect(stepCatalogs["client-email"]).toBe(clientEmailsSteps);
  });

  it("keys the recorded bodies two levels deep — module, then fixture name without its extension", () => {
    const fixtureNames = map(
      filter(readdirSync(join(testsDirOf("client-email"), "fixtures")), file =>
        file.endsWith(".json")
      ),
      file => file.replace(/\.json$/, "")
    );

    expect(sortBy(keys(recordedBodies))).toStrictEqual(
      sortBy(
        filter(moduleNames, module =>
          includes(testArtefacts(module), "fixtures")
        )
      )
    );
    expect(sortBy(keys(recordedBodies["client-email"]))).toStrictEqual(
      sortBy(fixtureNames)
    );
  });
});

describe("the published ./testing entry — the corpus stays lazy", () => {
  it("publishes every recorded body as a loader, so nothing is parsed until a replay asks", () => {
    const loaders = flatten(map(values(recordedBodies), values));

    expect(loaders.length).toBeGreaterThan(1);
    expect(every(loaders, isFunction)).toBe(true);
  });

  it("resolves a loader to the committed file itself", async () => {
    const name = "get-clients-id-emails-case-page-1";
    const body = await recordedBodies["client-email"][name]();

    expect(body).toStrictEqual(
      JSON.parse(
        readFileSync(
          join(testsDirOf("client-email"), "fixtures", `${name}.json`),
          "utf-8"
        )
      )
    );
  });
});

describe("the published ./testing entry — the layout its keying depends on", () => {
  it("keeps at most one .feature and one .steps.ts per module, which is what makes the module key total", () => {
    const collisions = reject(
      map(moduleNames, module => ({
        module,
        features: artefactsEndingIn(module, ".feature"),
        catalogs: artefactsEndingIn(module, ".steps.ts")
      })),
      entry => entry.features.length < 2 && entry.catalogs.length < 2
    );

    expect(collisions).toStrictEqual([]);
  });
});
