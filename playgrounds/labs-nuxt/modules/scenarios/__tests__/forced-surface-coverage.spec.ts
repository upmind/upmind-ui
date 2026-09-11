// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/forced-surface-coverage.spec
 * @description FE-3113 `AC4` — every routed scenario is proven on its own page,
 * under every preset its recordings can answer.
 *
 * ## Job To Be Done
 * The rendered proof (`runtime/components/__tests__/forced-surface.harness.ts`)
 * runs one module per file, because each module's replay lifecycle installs its
 * own request interceptor over the same globals and the second one loaded
 * answers the first one's page. One file per module is a list, and a list goes
 * stale silently: a scenario directory added tomorrow would simply never be
 * forced, and the matrix would report the same green over one module fewer.
 *
 * So the LAYOUT is the check. The scenario directories are read off disk — the
 * same discovery the Nuxt module registers routes by — and each must have a
 * spec of its own.
 *
 * ## What Breaks If These Fail
 * A page ships with a force picker nobody ever armed, and the story's "every
 * cell verified" claim quietly covers one route fewer than the app offers.
 *
 * Negative control: `forced-surface-coverage.renamed-proof.must-fail.patch`.
 */

import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { filter, map, some } from "lodash-es";

// -----------------------------------------------------------------------------

const scenarios = resolve(import.meta.dirname, "..");

const proofs = join(scenarios, "runtime/components/__tests__");

/**
 * A module that DRAWS ITSELF has no force picker and no playground surfaces, so
 * there are no forced states to arm on it and nothing for this gate to demand.
 * The switch is the same file the registrar routes on.
 */
const drawsItself = (directory: string): boolean =>
  some(readdirSync(join(scenarios, directory)), file =>
    file.endsWith(".page.vue")
  );

/** Every declared scenario the shared playground draws. */
const declared = map(
  filter(
    map(
      filter(
        readdirSync(scenarios, { withFileTypes: true }),
        entry =>
          entry.isDirectory() &&
          entry.name.startsWith("use") &&
          !drawsItself(entry.name)
      ),
      directory =>
        map(
          filter(readdirSync(join(scenarios, directory.name)), file =>
            file.endsWith(".scenario.ts")
          ),
          file => join(scenarios, directory.name, file)
        )[0]
    ),
    Boolean
  ),
  file => basename(file, ".scenario.ts")
);

// -----------------------------------------------------------------------------

describe("AC4 every routed scenario has its presets proven on its own page", () => {
  it("discovers the scenarios off the layout, so the claim cannot go stale", () => {
    expect(
      declared.length,
      "no scenario directory was discovered — this gate would pass over an empty tree"
    ).toBeGreaterThan(1);
  });

  it("has a rendered-preset spec for every one of them", () => {
    const missing = filter(
      declared,
      module => !existsSync(join(proofs, `forced-surface.${module}.spec.ts`))
    );

    expect(
      missing,
      `these scenarios route a page whose forced states nothing arms: ${missing.join(", ")}`
    ).toEqual([]);
  });

  it("has no rendered-preset spec for a scenario that no longer exists", () => {
    const orphaned = map(
      filter(
        readdirSync(proofs),
        file =>
          file.startsWith("forced-surface.") &&
          file.endsWith(".spec.ts") &&
          !declared.includes(
            basename(file, ".spec.ts").replace("forced-surface.", "")
          )
      ),
      file => join(basename(dirname(proofs)), file)
    );

    expect(
      orphaned,
      `these specs force a scenario the tree no longer declares: ${orphaned.join(", ")}`
    ).toEqual([]);
  });
});
