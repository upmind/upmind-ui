// -----------------------------------------------------------------------------
/**
 * @module testing
 * @description The package's published test-artefact entry — every module's own
 * `.feature`, step catalog and recorded bodies, collected from INSIDE the
 * package and keyed by the module that owns them. Kept off the main barrel, so
 * nothing it collects can reach a production graph through `.`.
 *
 * Discovery is the layout, never a list: a module is published here the moment
 * it keeps `src/modules/<module>/__tests__/<module>.feature`,
 * `<module>.steps.ts` and `__tests__/fixtures/*.json`. Nothing registers, and no
 * consumer names a file inside this package.
 *
 * `import.meta.glob` is a Vite transform, so this entry serves the app graph and
 * the vitest lanes and is inert in a process that is neither.
 */

import { has, reduce, set } from "lodash-es";
import type { StepCatalog } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const MODULE = /\/modules\/([^/]+)\/__tests__\//;
const FIXTURE = /\/modules\/([^/]+)\/__tests__\/fixtures\/(.+)\.json$/;

/**
 * Keys one artefact per module. THROWS when a module's `__tests__/` holds two of
 * the same kind: the module directory is the whole key, so last-wins would
 * publish one file, drop the other, and leave nothing to read the loss off.
 */
const byModule = <T>(globbed: Record<string, T>): Record<string, T> =>
  reduce(
    globbed,
    (collected, artefact, path) => {
      const moduleName = MODULE.exec(path)?.[1] as string;

      if (has(collected, [moduleName]))
        throw new Error(
          `@upmind-automation/headless/testing: "${moduleName}" holds more than one artefact of the same kind — "${path}" collides with one already collected. One .feature and one .steps.ts per module.`
        );

      return set(collected, [moduleName], artefact);
    },
    {} as Record<string, T>
  );

/**
 * Each module's capability spec: the text its step catalog implements and the
 * playlist a scenario page plays.
 */
export const featureText: Record<string, string> = byModule(
  import.meta.glob<string>("../modules/*/__tests__/*.feature", {
    query: "?raw",
    import: "default",
    eager: true
  })
);

/**
 * Each module's ONE step catalog, taken as the file's own default export — the
 * only key a convention-driven glob can name without guessing.
 */
export const stepCatalogs: Record<string, StepCatalog> = byModule(
  import.meta.glob<StepCatalog>("../modules/*/__tests__/*.steps.ts", {
    import: "default",
    eager: true
  })
);

/**
 * Each module's recorded bodies, keyed module -> fixture name -> loader. Two
 * levels because a module holds MANY fixtures, and LAZY because eager would
 * parse the whole ~1.6MB corpus into every consumer's graph on every page,
 * whether or not a replay ever installs one.
 */
export const recordedBodies: Record<
  string,
  Record<string, () => Promise<unknown>>
> = reduce(
  import.meta.glob<unknown>("../modules/*/__tests__/fixtures/*.json", {
    import: "default"
  }),
  (bodies, load, path) => {
    const [, moduleName, name] = FIXTURE.exec(path) ?? [];

    return moduleName ? set(bodies, [moduleName, name], load) : bodies;
  },
  {} as Record<string, Record<string, () => Promise<unknown>>>
);
