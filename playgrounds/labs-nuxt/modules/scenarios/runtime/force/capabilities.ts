// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/capabilities
 * @description Which forced states a module can be put into, MEASURED off its
 * own recordings. The governing principle is one sentence: a preset is offered
 * only when the corpus can honestly answer it, and nothing is authored to make
 * one answerable (`S13`).
 *
 * Every predicate reads `request.method` and `response.status` — the
 * self-describing quartet every recording carries — so no fixture name appears
 * in this file and a module publishing recordings needs no entry anywhere to be
 * served. That is the whole of FE-3113: the old system offered four presets to
 * every module because it was pinned to the one module whose corpus happened to
 * answer all four.
 *
 * `FORCE_URL_PRESETS` stays the master vocabulary. {@link availablePresets}
 * FILTERS it; nothing here re-spells it, so a preset added to the vocabulary is
 * one this file must be taught to measure rather than one it silently drops.
 */

import { FORCE_URL_PRESETS } from "../composables/useForcedState.types";
import {
  filter,
  find,
  isArray,
  isEmpty,
  get,
  toUpper,
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
 * What `bodies` can answer. The failure carried back is the module's OWN
 * refusal, preferred as a WRITE because that is the half `error-action` is
 * named for; a module whose only refusal is a read still gets `error-collection`
 * off it, and a module with no refusal at all gets neither error state rather
 * than a status this file made up.
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
 * The presets `caps` can be served, in the vocabulary's own order. A module that
 * can answer none — no recordings at all — offers none, which leaves its page
 * Live (`S12`).
 */
export function availablePresets(
  caps: CorpusCapabilities
): readonly ForceUrlPreset[] {
  const answerable: Record<ForceUrlPreset, boolean> = {
    empty: caps.canEmpty,
    loading: caps.canLoading,
    "error-action": caps.canErrorAction,
    "error-collection": caps.canErrorCollection
  };

  return filter(FORCE_URL_PRESETS, preset => answerable[preset]);
}
