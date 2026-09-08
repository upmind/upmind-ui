// -----------------------------------------------------------------------------
/**
 * @module testing/features
 * @description The BROWSER-SAFE half of the package's test artefacts, published as `./features`: each
 * module's `.feature` playlist text and its engine-free step catalog, keyed by
 * the module that owns them.
 *
 * ## Why this entry exists (FE-3133)
 * `./testing` collects these too, but it also globs the harness half — the
 * `@internal` kits, the integration kits and the replay `setup.integration.ts`.
 * Those are lazy, so they never RUN in an app graph, yet a bundler still has to
 * resolve every module a lazy glob names when it builds. `setup.integration.ts`
 * reaches msw's node interceptors, which have no browser condition, so any app
 * importing `./testing` failed its production build outright
 * (`No known conditions for "./ClientRequest" in "@mswjs/interceptors"`) — the
 * "step catalogs enter the product bundle" failure its own boundary spec names.
 *
 * So the split is by GRAPH, not by taste: this entry holds what app runtime may
 * legitimately carry, and `./testing` re-exports it unchanged for the spec lanes
 * that want both halves behind one specifier.
 *
 * Same shape as its sibling `./fixtures` (FE-3113), for the same reason: an entry that
 * carries inert artefacts and nothing else is reachable from any app-runtime
 * file, while the harness stays behind `./testing`'s single named seam.
 *
 * Discovery is the layout, never a list: a module is published here the moment
 * it keeps `src/modules/<module>/__tests__/<module>.feature` or
 * `<module>.steps.ts`.
 *
 * `import.meta.glob` is a Vite transform, so this entry serves the app graph and
 * the vitest lanes and is inert in a process that is neither.
 */

import { keyByModule } from "./testing.utils";
import { mapValues } from "lodash-es";
import type { StepCatalog } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * Each module's capability spec: the text its step catalog implements and the
 * playlist a scenario page plays.
 */
export const featureText: Record<string, string> = keyByModule(
  import.meta.glob<string>("../modules/*/__tests__/*.feature", {
    query: "?raw",
    import: "default",
    eager: true
  })
);

/**
 * What a module's step catalog file publishes: the catalog itself as the file's
 * default export, beside the action ids those steps drive — the covered set a
 * cross-package coverage gate grades a live cell against, taken from the catalog
 * rather than restated beside it.
 */
export type StepModule = {
  default: StepCatalog;
  coveredActionIds: readonly string[];
  [member: string]: unknown;
};

/**
 * Each module's ONE step catalog file, whole — engine-free by construction (a
 * catalog names `defineSteps`, its module's scope types and lodash, never that
 * module's schemas), so the eager tier can hold it and a browser can carry it.
 */
export const stepModules: Record<string, StepModule> = keyByModule(
  import.meta.glob<StepModule>("../modules/*/__tests__/*.steps.ts", {
    eager: true
  })
);

/** Each module's step catalog, as that file's own default export. */
export const stepCatalogs: Record<string, StepCatalog> = mapValues(
  stepModules,
  "default"
);
