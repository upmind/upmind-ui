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
 * The deletion is of the OFFER's prose gate, not of the `.feature`. What a
 * module DOES is still declared there, and {@link captureGaps} still reads it —
 * structurally, off the scenario TAGS. The offer must never shrink on a wording
 * miss, and a capture debt is only owed where the surface was declared in the
 * first place.
 *
 * `FORCE_URL_PRESETS` stays the master vocabulary. Every function here FILTERS
 * it and none re-spells it, so a preset added to the vocabulary is one this file
 * must be taught to measure rather than one it silently drops.
 */

import { FORCE_URL_PRESETS } from "../composables/useForcedState.types";
import {
  compact,
  filter,
  find,
  flatMap,
  intersection,
  isEmpty,
  isObject,
  get,
  map,
  some,
  split,
  toLower,
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

/** A Gherkin tag line: `@tag` tokens and nothing else. */
const TAG_LINE = /^@[\w:.-]+(\s+@[\w:.-]+)*$/;

/**
 * The Gherkin tags a scenario carries when its subject is a request coming back
 * REFUSED — `@guard` for the refusal an unauthenticated caller gets, `@errors`
 * for the refusal a change gets.
 *
 * A refusal is the only thing {@link captureGaps} can report — `empty` and
 * `loading` are hostable exactly when they are answerable — so this vocabulary
 * decides the whole report. Reading the TAGS rather than the prose is the point:
 * the prose gate this replaces matched the word "error" wherever it fell, and
 * every module wording a failure anywhere in 200 lines of English was billed for
 * a capture it never declared. A tag is the declaration itself, and a tag this
 * list does not know under-reports a debt rather than inventing one.
 */
const REFUSAL_TAGS = ["guard", "errors"];

/** Every tag the feature's own tag lines carry, `@` and case dropped. */
function declaredTags(feature: string): string[] {
  const lines = filter(map(split(feature, "\n"), trim), line =>
    TAG_LINE.test(line)
  );

  return map(compact(flatMap(lines, line => split(line, /\s+/))), tag =>
    toLower(tag).slice(1)
  );
}

function isRead(fixture: RecordedFixture): boolean {
  return toUpper(fixture.request.method) === "GET";
}

function isRefusal(fixture: RecordedFixture): boolean {
  return fixture.response.status >= REFUSED_FROM;
}

/**
 * A read that came back carrying something — the recordings `empty` can
 * subtract from.
 *
 * Rows are not the only thing a surface can be empty OF. A module whose surface
 * is one RECORD has an empty state too — the record absent — and measuring only
 * collections left the profile module offering `loading` alone while every one
 * of its states answered (operator ruling, 2026-08-28). `isObject` covers both
 * and excludes the `data: null` a recording carries when it held nothing to
 * take away in the first place.
 */
function isEmptiableRead(fixture: RecordedFixture): boolean {
  return (
    isRead(fixture) &&
    !isRefusal(fixture) &&
    isObject(get(fixture.response, ["body", "data"]))
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
    canEmpty: !!find(fixtures, isEmptiableRead),
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
 * module whose reads carry nothing to take away has no `empty` to reach, so it
 * is a state the surface lacks rather than a capture nobody took, and `loading`
 * needs no evidence beyond a recording existing.
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
 * What the `.feature` DECLARES gates it, never merely that one exists: a module
 * tagging no scenario as a refusal never claimed that surface, so it owes no
 * capture for it. One that declares a refusal owes it for each half of the
 * exchange it records — a module that READS and holds no refusal owes an
 * `error-collection` capture; one that WRITES and holds no failing write owes an
 * `error-action` capture. That debt is filled in the module's own
 * `.fixtures.ts`, never borrowed from another's.
 *
 * @param feature The module's committed `.feature` text.
 * @param bodies That module's own recordings, keyed by fixture name.
 */
export function captureGaps(
  feature: string,
  bodies: Record<string, RecordedFixture>
): readonly ForceUrlPreset[] {
  if (isEmpty(intersection(declaredTags(feature), REFUSAL_TAGS))) return [];

  const answerable = answerablePresets(bodies);

  return filter(
    hostablePresets(bodies),
    preset => !some(answerable, entry => entry === preset)
  );
}
