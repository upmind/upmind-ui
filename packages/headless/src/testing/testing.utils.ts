// -----------------------------------------------------------------------------
/**
 * @module testing/testing.utils
 * @description The testing entries' shared utils. Keys a globbed test artefact by the module that owns it. Shared
 * by the two published artefact entries — `./scenarios` (browser-safe) and
 * `./testing` (the harness half) — so both read one module key from one place.
 *
 * @internal Not published: the package's `exports` map carries no subpath below
 * an entry, and the lint boundary refuses one from every position.
 */

import { has, reduce, set } from "lodash-es";

// -----------------------------------------------------------------------------

const MODULE = /\/modules\/([^/]+)\/__tests__\//;

/**
 * Keys one artefact per module. THROWS when a module's `__tests__/` holds two of
 * the same kind: the module directory is the whole key, so last-wins would
 * publish one file, drop the other, and leave nothing to read the loss off.
 */
export const keyByModule = <T>(globbed: Record<string, T>): Record<string, T> =>
  reduce(
    globbed,
    (collected, artefact, path) => {
      const moduleName = MODULE.exec(path)?.[1] as string;

      if (has(collected, [moduleName]))
        throw new Error(
          `@upmind-automation/headless test artefacts: "${moduleName}" holds more than one artefact of the same kind — "${path}" collides with one already collected. One .feature, one .steps.ts, one .internal-kit.ts and one .int-helpers.ts per module.`
        );

      return set(collected, [moduleName], artefact);
    },
    {} as Record<string, T>
  );
