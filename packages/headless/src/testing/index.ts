// -----------------------------------------------------------------------------
/**
 * @module testing
 * @description The package's ONE test-HARNESS entry — every module's own
 * `.feature`, step catalog, `@internal` kit and replay lifecycle, collected from
 * INSIDE the package and keyed by the module that owns them. Kept off the main
 * barrel, so nothing it collects can reach a production graph through `.`, and
 * the only specifier: the package publishes no per-module subpath beside it.
 *
 * The recorded bodies moved to `./fixtures` (FE-3113) and are re-exported here
 * unchanged. That entry carries recordings and nothing else, which is what lets
 * app runtime reach a recording from any file while the harness — the half that
 * boots modules and registers runner lifecycles — stays behind this one's named
 * seam.
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
 * Eager only where an artefact is inert: the playlist text and the engine-free
 * catalogs are eager, and everything that boots a module or parses a recording
 * sits behind a loader. Those inert two now LIVE on `./features` (FE-3133) and
 * are re-exported below — the app-runtime seam reaches them there, because a
 * lazy glob is still a module a bundler must resolve, and this entry's
 * `setup.integration.ts` reaches msw's node-only interceptors.
 *
 * `import.meta.glob` is a Vite transform, so this entry serves the app graph and
 * the vitest lanes and is inert in a process that is neither.
 */

import { keyByModule } from "./testing.utils";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

/**
 * The browser-safe artefacts — each module's playlist text and its engine-free
 * step catalog — re-exported unchanged, so a spec lane still reaches both halves
 * through this one specifier.
 *
 * They are DEFINED on `./features` (FE-3133) rather than here so an app-runtime
 * consumer can carry them without the harness globs below. Those globs are lazy
 * and never run in an app graph, but a bundler still resolves every module they
 * name, and `setup.integration.ts` reaches msw's node-only interceptors — which
 * failed the production build of any app that imported this entry.
 */
export {
  featureText,
  stepModules,
  stepCatalogs,
  type StepModule
} from "./features";

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
  keyByModule(
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
  keyByModule(
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
> = keyByModule(
  import.meta.glob<IntegrationSetup>(
    "../modules/*/__tests__/setup.integration.ts"
  )
);

/**
 * Each module's recorded bodies, keyed module -> fixture name -> loader.
 *
 * Re-exported from `./fixtures` rather than globbed here (FE-3113): the
 * recordings are the one artefact app runtime may reach from any file, so they
 * are published on their own entry and this one carries them along so its
 * existing consumers are unchanged.
 */
export { recordedBodies } from "./fixtures";

/**
 * The in-process `World` a module's own `*.replay.int.test.ts` boots its
 * composables through — the third executor of the one BDD seam, beside the
 * harness's fixture world and the playground's in-page one.
 *
 * A static export, not a glob: it is ONE shared implementation rather than a
 * per-module artefact, so the one-artefact-per-kind rule `keyByModule` enforces
 * does not apply to it, and nothing here changes what that helper collects.
 */
export {
  createNodeWorld,
  type NodeComposable,
  type NodeScopedCell,
  type NodeWorldJourneys,
  type NodeWorldSource
} from "./node-world";
export { installCorpusReplay, loadModuleCorpus } from "./corpus-replay";
