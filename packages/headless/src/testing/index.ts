// -----------------------------------------------------------------------------
/**
 * @module testing
 * @description The package's ONE test-artefact entry — every module's own
 * `.feature`, step catalog, `@internal` kit and recorded bodies, collected from
 * INSIDE the package and keyed by the module that owns them. Kept off the main
 * barrel, so nothing it collects can reach a production graph through `.`, and
 * the only specifier: the package publishes no per-module subpath beside it.
 *
 * Workspace-only by construction — `package.json`'s `files` ships `dist` alone,
 * so these `src` paths serve this repo's own lanes and never an installed
 * consumer.
 *
 * Discovery is the layout, never a list: a module is published here the moment
 * it keeps `src/modules/<module>/__tests__/<module>.feature`,
 * `<module>.steps.ts`, `<module>.internal-kit.ts`, `<module>.int-helpers.ts`,
 * `setup.integration.ts` or `__tests__/fixtures/*.json`. Nothing registers, and
 * no consumer names a file inside this package.
 *
 * Eager only where an artefact is inert: the app runtime seam that reaches the
 * recorded corpus imports this entry too, so the eager tier holds the playlist
 * text and the engine-free catalogs, and everything that boots a module or
 * parses a recording sits behind a loader.
 *
 * `import.meta.glob` is a Vite transform, so this entry serves the app graph and
 * the vitest lanes and is inert in a process that is neither.
 */

import { has, mapValues, reduce, set } from "lodash-es";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
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
          `@upmind-automation/headless/testing: "${moduleName}" holds more than one artefact of the same kind — "${path}" collides with one already collected. One .feature, one .steps.ts, one .internal-kit.ts and one .int-helpers.ts per module.`
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
 * Each module's ONE step catalog file, whole — engine-free by construction, so
 * the eager tier can hold it.
 */
export const stepModules: Record<string, StepModule> = byModule(
  import.meta.glob<StepModule>("../modules/*/__tests__/*.steps.ts", {
    eager: true
  })
);

/** Each module's step catalog, as that file's own default export. */
export const stepCatalogs: Record<string, StepCatalog> = mapValues(
  stepModules,
  "default"
);

/**
 * What a module's internal kit publishes: the `@internal` query-schema pair a
 * cross-package filter spec is driven from, plus whatever else that module's own
 * kit names.
 */
export type InternalKit = {
  useQuerySchema: () => JsonSchema7;
  useQueryUischema: () => UISchemaElement;
  [member: string]: unknown;
};

/**
 * Each module's `@internal` surface, keyed module -> loader, re-exported for the
 * test lanes of OTHER packages — the one lawful way across the boundary the
 * Module Visibility Law draws, since a relative path into `src/modules/**`
 * breaches it unseen.
 *
 * LAZY because a kit reaches its module's own `*.schemas.ts`, which boots that
 * module's platform singletons at import time: eager, one module's kit would
 * boot every module for every consumer of this entry — the app-runtime seam that
 * only ever wanted a playlist included.
 */
export const internalKits: Record<string, () => Promise<InternalKit>> =
  byModule(
    import.meta.glob<InternalKit>("../modules/*/__tests__/*.internal-kit.ts")
  );

/** One outbound request as a module's own observer recorded it. */
export type ObservedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
};

/**
 * What a module's integration kit publishes: the recorded wire bodies its own
 * `*.int.test.ts` files replay, the real session seed they boot behind, and the
 * handlers and observers they share. A glob types a whole namespace or nothing,
 * so — as with {@link InternalKit} — the members named here are the ones the
 * cross-package lanes drive, and the rest of a kit's surface arrives untyped.
 */
export type IntegrationKit = {
  recorded: Record<string, () => { data: unknown[] }>;
  seedClientSession: () => Promise<{ clientId: string; accessToken: string }>;
  installFilteredEmailsHandler: (
    server: unknown,
    clientId: string,
    options?: { delayMs?: number | ((params: URLSearchParams) => number) }
  ) => { reads: () => number };
  observeEmailRequests: () => {
    all: () => ObservedRequest[];
    first: () => ObservedRequest;
    matching: (fragment: string) => ObservedRequest[];
    stop: () => void;
  };
  [member: string]: unknown;
};

/**
 * Each module's shared integration scaffolding, keyed module -> loader, so a
 * cross-package spec drives the SAME recorded corpus its owning module does
 * rather than a copy of the wire.
 *
 * LAZY for {@link internalKits}' reason and one more: a kit reaches its module's
 * `setup.integration`, which registers the replay lifecycle on the calling
 * runner. Awaited at a spec's top level that is collection time, which is when a
 * hook may still be registered; eager it would run in the app graph, where there
 * is no runner to register with at all.
 */
export const integrationKits: Record<string, () => Promise<IntegrationKit>> =
  byModule(
    import.meta.glob<IntegrationKit>("../modules/*/__tests__/*.int-helpers.ts")
  );

/**
 * A module's replay lifecycle: the MSW handle its integration lane serves the
 * recorded corpus from, and the directory those recordings live in. The handle is
 * opaque here — it is made by a module's own setup and handed straight back to
 * that module's own handlers — so this entry never names msw.
 */
export type IntegrationSetup = {
  recordingsDir: string;
  server: unknown;
};

/**
 * Each module's replay lifecycle, keyed module -> loader. The handle this yields
 * is the one that module's kit closed over: both loaders resolve the same module
 * instance, so an override registered on it sits on the server the kit's own
 * handlers already answer from.
 */
export const integrationSetups: Record<
  string,
  () => Promise<IntegrationSetup>
> = byModule(
  import.meta.glob<IntegrationSetup>(
    "../modules/*/__tests__/setup.integration.ts"
  )
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
