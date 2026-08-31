// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/__tests__/zero-concrete-references.spec
 * @description FE-3113 — the zero-concrete-references law (operator ruling,
 * 2026-08-27): a single concrete module reference anywhere under
 * `modules/scenarios/runtime/` is a violation. Discovery and registration are
 * the only mechanisms.
 *
 * ## Job To Be Done
 * The whole story is "stop force being one module's affordance", and the way it
 * regresses is not a failing assertion — it is one convenient constant. The
 * ruling names the live violation it closed, `MODULE_QUERY_KEY = ["client",
 * "emails"]`, kept because a forced arm has to drop the cache it contradicts
 * and the key could not be derived from the url. Nothing about that pressure
 * went away: the next module whose key does not follow its path invites exactly
 * the same line back.
 *
 * So the law is checked structurally, over the tree, against a module list
 * DISCOVERED from the headless package rather than written down here — a module
 * added tomorrow is in scope the day it lands.
 *
 * Comments are stripped before matching: a module named in a doc comment is
 * documentation of the constraint, and `useForcedState.types.ts` documents this
 * very ruling. Only executable text is a reference.
 *
 * ## What Breaks If These Fail
 * Force silently becomes one module's feature again — the second module's page
 * offers presets that arm the first module's endpoints, and the failure reads
 * as "the picker did nothing" rather than as the hardcoded line it is.
 *
 * Negative control: `zero-concrete-references.pinned-module.must-fail.patch`.
 *
 * @anchor force-state.feature
 * @anchor AC-ZCR
 */

import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { filter, flatMap, includes, map, some } from "lodash-es";

// -----------------------------------------------------------------------------

const RUNTIME = resolve(import.meta.dirname, "../..");

const MODULES_DIR = join(
  dirname(
    createRequire(import.meta.url).resolve(
      "@upmind-automation/headless/package.json"
    )
  ),
  "src/modules"
);

/** Every headless module, discovered off the layout — never a list kept here. */
const MODULES = map(
  filter(readdirSync(MODULES_DIR, { withFileTypes: true }), entry =>
    entry.isDirectory()
  ),
  entry => entry.name
);

/**
 * A module whose name cannot also be an ordinary English word in this code —
 * `scope`, `query` and `feedback` are all module directories AND everyday
 * identifiers here, so only the compound names are matched bare. Every module,
 * compound or not, is still matched in its import-path form below.
 */
const COMPOUND = filter(MODULES, module => includes(module, "-"));

const sourceFiles = (dir: string): string[] =>
  flatMap(readdirSync(dir, { withFileTypes: true }), entry => {
    const full = join(dir, entry.name);

    if (entry.isDirectory())
      return entry.name === "__tests__" ? [] : sourceFiles(full);

    return /\.(ts|vue)$/.test(entry.name) ? [full] : [];
  });

const FILES = sourceFiles(RUNTIME);

/** The executable text of a file — comments carry no reference. */
const code = (file: string) =>
  readFileSync(file, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1")
    .replace(/<!--[\s\S]*?-->/g, "");

const named = (file: string) => relative(RUNTIME, file);

const offenders = (matches: (source: string) => string[]) =>
  flatMap(FILES, file =>
    map(matches(code(file)), hit => `${named(file)} → ${hit}`)
  );

// -----------------------------------------------------------------------------

describe("the runtime names no module, path or endpoint of its own", () => {
  it("has a tree and a module list to grade against", () => {
    expect(
      FILES.length,
      "no runtime source file was discovered — every claim below would pass over an empty tree"
    ).toBeGreaterThan(1);
    expect(
      COMPOUND.length,
      "no compound module name was discovered — the bare-name claim would have no subject"
    ).toBeGreaterThan(1);
    expect(
      some(FILES, file => includes(file, "/force/")),
      "the force directory this law was written for is not in the scanned tree"
    ).toBe(true);
  });

  it("quotes no module name as a literal", () => {
    expect(
      offenders(source =>
        filter(COMPOUND, module =>
          new RegExp(`["'\`]${module}["'\`]`).test(source)
        )
      ),
      "runtime code names a module — discovery and registration are the only mechanisms"
    ).toEqual([]);
  });

  it("reaches for no module by path", () => {
    expect(
      offenders(source =>
        filter(MODULES, module =>
          new RegExp(`modules/${module}\\b`).test(source)
        )
      ),
      "runtime code imports or resolves one module's directory by name"
    ).toEqual([]);
  });

  it("writes no endpoint literal", () => {
    expect(
      offenders(source =>
        map(source.match(/["'`][^"'`\n]*\/api\/[^"'`\n]*["'`]/g) ?? [], hit =>
          hit.slice(0, 60)
        )
      ),
      "runtime code carries an endpoint literal — routes derive from the recorded paths"
    ).toEqual([]);
  });

  it("pins no module's cache key", () => {
    expect(
      // No leading `\b`: the constant the ruling deleted was `MODULE_QUERY_KEY`,
      // and an underscore is a word character, so a left boundary matches nothing.
      offenders(source => map(source.match(/QUERY_KEY\b/g) ?? [], hit => hit)),
      "the constant the ruling deleted is back — arming calls the booted module's own invalidate"
    ).toEqual([]);
  });
});
