// -----------------------------------------------------------------------------
/**
 * @module fixtures
 * @description The package's RECORDINGS-ONLY entry — every module's committed
 * `__tests__/fixtures/*.json`, keyed by the module that owns them, and nothing
 * else. No `.feature`, no step catalog, no `@internal` kit, no integration
 * setup.
 *
 * That separation is what this entry exists for (FE-3113). `./testing`
 * re-exports what is published here, so its own consumers are unchanged, but
 * `./testing` also carries scaffolding that boots modules and registers runner
 * lifecycles — which is why eslint keeps THAT entry behind one named
 * app-runtime seam. This entry carries none of it, so app runtime may name it
 * from any file without reopening the harness door.
 *
 * Workspace-only by construction, exactly as `./testing` is: `package.json`'s
 * `files` ships `dist` alone, so these `src` paths serve this repo's own lanes
 * and never an installed consumer.
 *
 * Discovery is the layout, never a list: a module publishes its recordings the
 * moment it keeps `src/modules/<module>/__tests__/fixtures/*.json`.
 *
 * `import.meta.glob` is a Vite transform, so this entry serves the app graph and
 * the vitest lanes and is inert in a process that is neither.
 */

import { reduce, set } from "lodash-es";

// -----------------------------------------------------------------------------

const FIXTURE = /\/modules\/([^/]+)\/__tests__\/fixtures\/(.+)\.json$/;

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
