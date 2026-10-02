// -----------------------------------------------------------------------------
/**
 * @module testing/fixtures
 * @description The package's RECORDINGS-ONLY entry — every module's committed
 * `__tests__/fixtures/*.json` and its scenario recordings
 * (`__tests__/scenarios/<scenario>/<NN>/*.json`), keyed by the module that
 * owns them, and nothing else. No `.feature`, no step catalog, no `@internal` kit, no integration
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

import { kebabCase, padStart, reduce, set } from "lodash-es";

// -----------------------------------------------------------------------------

const FIXTURE = /\/modules\/([^/]+)\/__tests__\/fixtures\/(.+)\.json$/;

const SCENARIO_FIXTURE =
  /\/modules\/([^/]+)\/__tests__\/scenarios\/([^/]+)\/(\d+)\/(.+)\.json$/;

// -----------------------------------------------------------------------------

/** A scenario's folder name — its `.feature` title, kebab-cased (FE-3145). */
export const scenarioSlug = (scenario: string): string => kebabCase(scenario);

/** A step's folder name — its 1-based place in the scenario, two digits. */
export const stepKey = (index: number): string =>
  padStart(String(index + 1), 2, "0");

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

/**
 * Each module's SCENARIO recordings (FE-3145), keyed module -> scenario slug
 * -> step key -> fixture name -> loader: the answers each step of each
 * scenario recorded, from `__tests__/scenarios/<scenario>/<NN>/*.json`. Lazy
 * for the same reason {@link recordedBodies} is. A step that made no request
 * holds no fixture, so it has no key here.
 */
export const scenarioRecordings: Record<
  string,
  Record<string, Record<string, Record<string, () => Promise<unknown>>>>
> = reduce(
  import.meta.glob<unknown>("../modules/*/__tests__/scenarios/*/*/*.json", {
    import: "default"
  }),
  (recordings, load, path) => {
    const [, moduleName, scenario, step, name] =
      SCENARIO_FIXTURE.exec(path) ?? [];

    return moduleName
      ? set(recordings, [moduleName, scenario, step, name], load)
      : recordings;
  },
  {} as Record<
    string,
    Record<string, Record<string, Record<string, () => Promise<unknown>>>>
  >
);
