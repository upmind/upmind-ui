// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/corpus.source
 * @description The ONE seam through which app runtime reaches the committed
 * headless test artefacts: the client-email playlist text, the step catalog that
 * plays it and the ten recorded bodies. Every consumer — the corpus resolver,
 * the force handlers, the track parser and the scenario declaration — imports
 * this module instead of naming `@upmind-automation/headless/testing` itself, so
 * the reach is one file wide and no consumer's import moves if the interior is
 * ever swapped again.
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
 */

import {
  featureText as publishedFeatures,
  recordedBodies,
  stepCatalogs
} from "@upmind-automation/headless/testing";
import { CORPUS_FIXTURE_NAMES } from "./corpus.source.types";
import { map, zipObject } from "lodash-es";
import type { CorpusBodies } from "./corpus.source.types";
import type { FeatureTracksSource } from "../composables/useFeatureTracks.types";
import type { StepCatalog } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The MODULE whose artefacts the entry above reaches — the name a declaration's
 * `tracks` channel carries, and the key every artefact is published under. One
 * name, not a registration list: the interior is what widens as headless's
 * `./testing` entry publishes more, and every consumer already asks by module
 * name rather than by import.
 */
const REACHED_MODULE = "client-email";

/**
 * The module's ONE feature, verbatim from
 * `packages/headless/src/modules/client-email/__tests__/client-email.feature` —
 * its whole capability spec, of which the `CLIENT_EMAIL_TRACK_COUNT` scenarios
 * the catalog matches are the tracks the bar renders after Live.
 */
export const featureText: string = publishedFeatures[REACHED_MODULE];

/**
 * The module's ONE step catalog — the same `defineSteps` catalog the Playwright
 * lane registers, never a playground copy (`S13`). Engine-free by construction,
 * so app runtime pays no test runner for holding it.
 */
export const stepCatalog: StepCatalog = stepCatalogs[REACHED_MODULE];

/**
 * Whether the committed artefacts are reachable from app runtime — the one flag
 * an arm guard reads, since forcing and replay have no data to run on without
 * them. Derived from the playlist rather than declared beside it, so the claim
 * cannot outlive the reach it describes; annotated rather than inferred so a
 * consumer's branch on it is not narrowed to dead code.
 */
export const isCorpusSourceResolved: boolean = featureText.length > 0;

// The entry keeps every body behind its own loader so no page parses the whole
// ~2.2MB corpus. This seam awaits its module's ten at import time rather than
// inside `corpusBodies()`, which keeps the seam's surface synchronous and leaves
// every consumer's call site where it was.
const bodies = zipObject(
  CORPUS_FIXTURE_NAMES,
  await Promise.all(
    map(CORPUS_FIXTURE_NAMES, name => recordedBodies[REACHED_MODULE][name]())
  )
) as CorpusBodies;

/**
 * One module's committed playlist and the catalog that plays it, asked for by
 * the module's own name. A module this seam does not reach yields nothing,
 * which leaves that page Live-only rather than half-armed (`S12`).
 */
export function featureTracksFor(
  module: string
): FeatureTracksSource | undefined {
  if (module !== REACHED_MODULE) return undefined;

  return { feature: featureText, catalog: stepCatalog };
}

/**
 * The ten recorded bodies, keyed by fixture name — each one the committed file
 * itself, envelope and all, handed through untouched.
 */
export function corpusBodies(): CorpusBodies {
  return bodies;
}
