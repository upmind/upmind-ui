// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/capabilities
 * @description Which forced states a module can HONESTLY be put into, measured
 * off its own committed recordings.
 *
 * An earlier build read the offer out of the `.feature` PROSE — two regexes
 * hunting phrases like "loading, empty, or errored". Three modules word their
 * features differently, so they derived zero presets and got no force affordance
 * at all, while every one of their states answered correctly when called
 * directly. Prose matching is guessing, and it is deleted (operator ruling,
 * 2026-08-27, revised).
 *
 * What replaced it is what the recordings already carry: each states its own
 * `request.method` and `response.status`, so a preset is offered when the corpus
 * can ANSWER it — no wording, no fixture names, no per-module branch.
 *
 * `FORCE_URL_PRESETS` stays the master vocabulary. Every function here FILTERS
 * it and none re-spells it, so a preset added to the vocabulary is one this file
 * must be taught to measure rather than one it silently drops.
 */

import { FORCE_URL_PRESETS } from "../composables/useForcedState.types";
import {
  filter,
  find,
  isArray,
  isEmpty,
  get,
  some,
  toUpper,
  trim,
  values
} from "lodash-es";
import type { CorpusCapabilities } from "./capabilities.types";
import type { RecordedFixture } from "./corpus.source.types";
import type { ForceUrlPreset } from "../composables/useForcedState.types";

// -----------------------------------------------------------------------------

/** At or above it the server refused; below it the exchange succeeded. */
const REFUSED_FROM = 400;

function isRead(fixture: RecordedFixture): boolean {
  return toUpper(fixture.request.method) === "GET";
}

function isRefusal(fixture: RecordedFixture): boolean {
  return fixture.response.status >= REFUSED_FROM;
}

/** A read that came back with rows — the only recording `empty` can subtract from. */
function isCollectionRead(fixture: RecordedFixture): boolean {
  return (
    isRead(fixture) &&
    !isRefusal(fixture) &&
    isArray(get(fixture.response, ["body", "data"]))
  );
}

// -----------------------------------------------------------------------------

/**
 * What `bodies` can answer — a method and a status per recording, and nothing
 * else. The failure carried back is the module's OWN refusal, preferred as a
 * WRITE because that is the half `error-action` is named for.
 *
 * Both error states require a RECORDED refusal: a status and a body staging
 * actually sent. Nothing is authored to stand in for one (`S13`), so a module
 * holding no refusal is offered no forced failure and {@link captureGaps}
 * reports the absence.
 *
 * @param bodies One module's recordings, keyed by fixture name.
 */
export function corpusCapabilities(
  bodies: Record<string, RecordedFixture>
): CorpusCapabilities {
  const fixtures = values(bodies);
  const refusals = filter(fixtures, isRefusal);

  const failedWrite = find(refusals, fixture => !isRead(fixture));
  const failure = failedWrite ?? refusals[0];

  return {
    canEmpty: !!find(fixtures, isCollectionRead),
    canLoading: !isEmpty(fixtures),
    canErrorCollection: !!failure,
    canErrorAction: !!failedWrite,
    failure
  };
}

/**
 * The presets `bodies` can be forced into, in the vocabulary's own order — what
 * the module OFFERS. A module with no recordings offers nothing, which leaves
 * its page Live (`S12`).
 *
 * @param bodies One module's recordings, keyed by fixture name.
 */
export function answerablePresets(
  bodies: Record<string, RecordedFixture>
): readonly ForceUrlPreset[] {
  const caps = corpusCapabilities(bodies);

  const answerable: Record<ForceUrlPreset, boolean> = {
    empty: caps.canEmpty,
    loading: caps.canLoading,
    "error-action": caps.canErrorAction,
    "error-collection": caps.canErrorCollection
  };

  return filter(FORCE_URL_PRESETS, preset => answerable[preset]);
}

/**
 * The states this module's SURFACE has, whether or not the evidence to force
 * them exists.
 *
 * A refusal is the only thing a corpus can OWE. The other two are structural: a
 * module with no collection read has no rows to remove, so `empty` there is a
 * state the surface lacks rather than a capture nobody took, and `loading` needs
 * no evidence beyond a recording existing.
 */
function hostablePresets(
  bodies: Record<string, RecordedFixture>
): readonly ForceUrlPreset[] {
  const fixtures = values(bodies);
  const caps = corpusCapabilities(bodies);

  const hostable: Record<ForceUrlPreset, boolean> = {
    empty: caps.canEmpty,
    loading: caps.canLoading,
    "error-collection": some(fixtures, isRead),
    "error-action": some(fixtures, fixture => !isRead(fixture))
  };

  return filter(FORCE_URL_PRESETS, preset => hostable[preset]);
}

/**
 * The states the module's surface has that its own recordings cannot answer,
 * named loudly so a capture that never happened reads as missing EVIDENCE
 * rather than as absent capability (`AC5`).
 *
 * The `.feature` gates it: a module with no committed feature is not a
 * documented surface, so it declares nothing and owes nothing. One with a
 * feature owes a refusal for each half of the exchange it records — a module
 * that READS and holds no refusal owes an `error-collection` capture; one that
 * WRITES and holds no failing write owes an `error-action` capture. That debt is
 * filled in the module's own `.fixtures.ts`, never borrowed from another's.
 *
 * @param feature The module's committed `.feature` text.
 * @param bodies That module's own recordings, keyed by fixture name.
 */
export function captureGaps(
  feature: string,
  bodies: Record<string, RecordedFixture>
): readonly ForceUrlPreset[] {
  if (isEmpty(trim(feature))) return [];

  const answerable = answerablePresets(bodies);

  return filter(
    hostablePresets(bodies),
    preset => !some(answerable, entry => entry === preset)
  );
}
