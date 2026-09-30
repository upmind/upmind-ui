// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/corpus.source
 * @description The ONE seam through which app runtime reaches the committed
 * headless test artefacts: the playlist text, the step catalog that plays it,
 * and the recorded bodies. Every consumer — the corpus resolver, the force
 * handlers, the track parser and the scenario declaration — imports this module
 * instead of naming `@upmind-automation/headless/testing` itself, so the reach
 * is one file wide and no consumer's import moves if the interior is ever
 * swapped again.
 *
 * RULED by the operator on 2026-08-12 (`ESC6`, route (a) — the front door): a
 * playground whose whole subject is the recorded scenarios has access to them by
 * implication of the approved north-star concept. Three landed pieces carry it,
 * and this seam is the only one any app file names:
 *
 * - `eslint.config.mjs` block 8h lists THIS file beside the test lanes, so the
 *   boundary now reads "app runtime reaches recorded artefacts through exactly
 *   one named seam"; 8g still reds the specifier in every other app file;
 * - `packages/headless`'s `exports` map publishes ONE `./testing` entry carrying
 *   the `.feature` beside the step catalog and the recorded fixtures (`ESC1`),
 *   keyed by the module that owns them;
 * - the anchored `@upmind-automation/headless` alias (`nuxt.config.ts` ·
 *   `vitest.config.ts`) is exact-match, so that subpath falls through to that
 *   map instead of being rewritten through `index.ts`.
 *
 * Nothing is copied into the playground and nothing is authored: every byte
 * below is the committed recording, reached by its published specifier (`S13`).
 *
 * DECOUPLED (FE-3094): the seam no longer hardcodes any module name. The module
 * is a parameter, and fixture names are derived from the published keys.
 *
 * NARROWED (FE-3133): this seam now names the two entries that publish INERT
 * artefacts — `./features` for the playlist text and the engine-free step catalogs,
 * `./fixtures` for the recordings — instead of `./testing`. That entry also
 * globs the harness half; the globs are lazy, but a bundler still resolves every
 * module they name, and `setup.integration.ts` reaches msw's node-only
 * interceptors, which failed this playground's production build outright. The
 * boundary is unchanged in spirit: app runtime reaches recorded artefacts, never
 * the harness that boots modules and registers runner lifecycles.
 */

import {
  featureText as publishedFeatures,
  stepCatalogs
} from "@upmind-automation/headless/features";
import {
  recordedBodies,
  scenarioRecordings,
  scenarioSlug,
  stepKey
} from "@upmind-automation/headless/fixtures";
import { get, isEmpty, keys, zipObject } from "lodash-es";
import type { RecordedFixture } from "./corpus.source.types";
import type { FeatureTracksSource } from "../composables/useFeatureTracks.types";

// -----------------------------------------------------------------------------

/** The modules that have published test artefacts, derived from headless/testing. */
export const availableModules = keys(publishedFeatures);

/**
 * Whether a given module has published test artefacts reachable from app runtime.
 * Used by arm guards since forcing and replay have no data to run on without them.
 */
export function isModuleResolved(module: string): boolean {
  return Boolean(publishedFeatures[module]);
}

/**
 * One module's committed playlist and the catalog that plays it, asked for by
 * the module's own name. A module this seam does not reach yields nothing,
 * which leaves that page Live-only rather than half-armed (`S12`).
 */
export function featureTracksFor(
  module: string
): FeatureTracksSource | undefined {
  const feature = publishedFeatures[module];
  const catalog = stepCatalogs[module];

  if (!feature || !catalog) return undefined;

  return { feature, catalog };
}

/** Cache for loaded corpus bodies by module. */
const loadedBodies: Record<string, Record<string, RecordedFixture>> = {};

/**
 * Load a module's recorded bodies. Async because each body is behind a lazy
 * loader in headless/testing. Caches results so subsequent calls are sync.
 */
export async function loadCorpusBodies(
  module: string
): Promise<Record<string, RecordedFixture> | undefined> {
  if (loadedBodies[module]) return loadedBodies[module];

  const moduleBodies = recordedBodies[module];
  if (!moduleBodies) return undefined;

  const fixtureNames = keys(moduleBodies);
  const fixtures = await Promise.all(
    fixtureNames.map(name => moduleBodies[name]())
  );

  loadedBodies[module] = zipObject(fixtureNames, fixtures) as Record<
    string,
    RecordedFixture
  >;
  return loadedBodies[module];
}

/**
 * Get a module's corpus bodies synchronously. Returns undefined if not yet loaded.
 * Call loadCorpusBodies() first to ensure the module is loaded.
 */
export function getCorpusBodies(
  module: string
): Record<string, RecordedFixture> | undefined {
  return loadedBodies[module];
}

/**
 * Get the fixture names available for a module, derived from the published keys.
 */
export function getFixtureNames(module: string): string[] {
  const moduleBodies = recordedBodies[module];
  return moduleBodies ? keys(moduleBodies) : [];
}

/**
 * One module's committed `.feature` — the source of truth for which forced
 * states it declares (operator ruling, 2026-08-27). Already published by the
 * seam; named here so the capability derivation reads the SPEC rather than
 * inspecting recordings. A module this seam does not reach yields `""`, which
 * declares nothing.
 */
export function featureTextFor(module: string): string {
  return publishedFeatures[module] ?? "";
}

// -----------------------------------------------------------------------------

/**
 * Whether `module` records its scenarios one by one (FE-3145): each scenario of
 * its `.feature` holds its own step recordings, so a track replays THOSE and
 * nothing else. A module that does not yet is replayed from its shared corpus.
 */
export function recordsScenarios(module: string): boolean {
  return !isEmpty(scenarioRecordings[module]);
}

/**
 * The fixtures ONE step of ONE scenario recorded, loaded — keyed by fixture
 * name. Empty for a step that made no request.
 *
 * @param module The module whose scenario it is.
 * @param scenario The scenario's `.feature` title, verbatim.
 * @param index The step's 0-based place in the scenario, Background first.
 */
export async function loadStepFixtures(
  module: string,
  scenario: string,
  index: number
): Promise<Record<string, RecordedFixture>> {
  const loaders: Record<string, () => Promise<unknown>> = get(
    scenarioRecordings,
    [module, scenarioSlug(scenario), stepKey(index)],
    {}
  );
  const names = keys(loaders);
  const fixtures = await Promise.all(names.map(name => loaders[name]()));

  return zipObject(names, fixtures) as Record<string, RecordedFixture>;
}
