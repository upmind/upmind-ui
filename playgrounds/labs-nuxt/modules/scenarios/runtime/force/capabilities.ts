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
 * A recording being ON RECORD is not enough for it to be SERVABLE: a forced
 * state is a picture of a state and may never have real consequences, so the one
 * refusal the app's session machinery acts on is measured out
 * ({@link isServableRefusal}) rather than served and signing the operator out.
 *
 * `FORCE_RECIPES` stays the master vocabulary. Every function here FILTERS
 * it and none re-spells it, so a preset added to the vocabulary is one this file
 * must be taught to measure rather than one it silently drops.
 */

import {
  isAbsentRecordRead,
  isServableRefusal,
  isServedRead
} from "@upmind-automation/test-fixtures/corpus-replay";
import { forcedStateRecipeId } from "./states";
import { FORCE_RECIPE_PENDING_WRITE, FORCE_RECIPES } from "./states.types";
import {
  compact,
  filter,
  find,
  flatMap,
  intersection,
  isArray,
  isEmpty,
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
import type { ForceMeasuredRecipe, ForceRecipe } from "./states.types";

// The corpus predicates are the shared replay's own; re-exported so the force
// layer keeps one vocabulary for "servable", "served" and "absent".
export { isAbsentRecordRead, isServableRefusal, isServedRead };

function isRead(fixture: RecordedFixture): boolean {
  return toUpper(fixture.request.method) === "GET";
}

// -----------------------------------------------------------------------------

/** A Gherkin tag line: `@tag` tokens and nothing else. */
const TAG_LINE = /^@[\w:.-]+(\s+@[\w:.-]+)*$/;

/**
 * The Gherkin tags a scenario carries when its subject is a request coming back
 * REFUSED — `@guard` for the refusal an unauthenticated caller gets, `@errors`
 * for the refusal a change gets.
 *
 * This vocabulary decides the REFUSAL half of {@link captureGaps} — the other
 * half, an uncaptured record absence, needs no declaration because every read
 * has one. Reading the TAGS rather than the prose is the point: the prose gate
 * this replaces matched the word "error" wherever it fell, and every module
 * wording a failure anywhere in 200 lines of English was billed for a capture it
 * never declared. A tag is the declaration itself, and a tag this list does not
 * know under-reports a debt rather than inventing one.
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

/** A read carrying ROWS — the collection `empty` subtracts them from. */
function isRowsRead(fixture: RecordedFixture): boolean {
  return (
    isServedRead(fixture) && isArray(get(fixture.response, ["body", "data"]))
  );
}

// -----------------------------------------------------------------------------

/**
 * What `bodies` can answer — a method and a status per recording, and nothing
 * else. The failure carried back is the module's OWN refusal, preferred as a
 * WRITE because that is the half `error-action` is named for.
 *
 * Both error states require a RECORDED refusal the intercept may serve: a status
 * and a body staging actually sent, minus the one the session machinery acts on
 * ({@link isServableRefusal}). Nothing is authored to stand in for one (`S13`),
 * so a module holding no such refusal is offered no forced failure and
 * {@link captureGaps} reports the absence. A read staging never refuses is
 * recorded through the generator's own `forceStatus` (`tests/fixtures/generator.ts`,
 * precedent `basket-billing.fixtures.ts`) — a real request, its response
 * overridden to the wire error envelope — never authored here.
 *
 * @param bodies One module's recordings, keyed by fixture name.
 */
export function corpusCapabilities(
  bodies: Record<string, RecordedFixture>
): CorpusCapabilities {
  const fixtures = values(bodies);
  const refusals = filter(fixtures, isServableRefusal);

  const failedWrite = find(refusals, fixture => !isRead(fixture));
  const failure = failedWrite ?? refusals[0];

  return {
    // Either subtraction the corpus can make honestly: a collection's rows
    // taken out of its own envelope, or the module's own recorded read for a
    // record that is not there.
    canEmpty: some(fixtures, isRowsRead) || some(fixtures, isAbsentRecordRead),
    canLoading: !isEmpty(fixtures),
    canErrorCollection: !!failure,
    canErrorAction: !!failedWrite,
    failure,
    refusedWrite: failedWrite
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
): readonly ForceMeasuredRecipe[] {
  const caps = corpusCapabilities(bodies);

  const answerable: Record<ForceMeasuredRecipe, boolean> = {
    empty: caps.canEmpty,
    loading: caps.canLoading,
    "error-action": caps.canErrorAction,
    "error-collection": caps.canErrorCollection
  };

  return filter(FORCE_RECIPES, preset => answerable[preset]);
}

/**
 * Whether `bodies` can answer ONE feature-derived state's recipe — the question
 * the offer asks per state now that the offer is the feature's (operator
 * ruling, 2026-09-12). It is {@link answerablePresets} asked about one recipe,
 * plus the one recipe that vocabulary does not measure: a held WRITE has no
 * body to serve, so the only evidence it needs is the module having recorded a
 * write at all — without one there is no route to hold a request on.
 *
 * @param recipe The recipe one derived state is answered by.
 * @param bodies That module's own recordings, keyed by fixture name.
 */
export function answersRecipe(
  recipe: ForceRecipe,
  bodies: Record<string, RecordedFixture>
): boolean {
  const answer = forcedStateRecipeId(recipe);

  if (answer === FORCE_RECIPE_PENDING_WRITE)
    return some(values(bodies), fixture => !isRead(fixture));

  return some(answerablePresets(bodies), offered => offered === answer);
}

/**
 * The states this module's SURFACE has, whether or not the evidence to force
 * them exists.
 *
 * The `.feature` IS the declaration: a module holding none has declared no
 * surface, so it hosts nothing and owes nothing (`S12`) — the same reading that
 * leaves such a module arming no route. Billing one for a capture it never
 * claimed is a false debt, the mirror of the fabricated refusal this story
 * deleted.
 *
 * `empty` is one of them: EVERY read has an absent answer, a collection's being
 * zero rows and a single record's being the record not there (operator ruling,
 * 2026-08-28 · S1). A module whose reads all carry a record and which has never
 * captured that absence owes the capture, exactly as an undeclared refusal is
 * owed — the crash it used to draw came from authoring the missing body instead.
 *
 * The two refusals are gated once more, on the `.feature`'s own scenario TAGS: a
 * module tagging no scenario as a refusal never claimed that surface, so it owes
 * no capture for it. Reading the TAGS rather than the prose is the point — the
 * prose gate this replaces billed every module wording a failure anywhere in 200
 * lines of English.
 *
 * `loading` needs no evidence beyond a recording existing, so it is never owed.
 */
function hostablePresets(
  feature: string,
  bodies: Record<string, RecordedFixture>
): readonly ForceMeasuredRecipe[] {
  if (isEmpty(trim(feature))) return [];

  const fixtures = values(bodies);

  const declaresRefusal = !isEmpty(
    intersection(declaredTags(feature), REFUSAL_TAGS)
  );

  const hostable: Record<ForceMeasuredRecipe, boolean> = {
    empty: some(fixtures, isServedRead),
    loading: !isEmpty(fixtures),
    // Read off the DECLARATION, never off what happens to be recorded: a
    // declared state with no recording behind it is a capture `captureGaps`
    // names out loud, not an offer that quietly disappears.
    "error-collection": declaresRefusal && some(fixtures, isRead),
    "error-action":
      declaresRefusal && some(fixtures, fixture => !isRead(fixture))
  };

  return filter(FORCE_RECIPES, preset => hostable[preset]);
}

/**
 * The states the module's surface has that its own recordings cannot answer,
 * named loudly so a capture that never happened reads as missing EVIDENCE
 * rather than as absent capability (`AC5`).
 *
 * A module that declares a refusal owes it for each half of the exchange it
 * records — one that READS and holds no servable refusal owes an
 * `error-collection` capture; one that WRITES and holds no failing write owes an
 * `error-action` capture. A module that reads a single RECORD and has never
 * captured that record's absence owes an `empty` capture. Every debt is filled
 * in the module's own `.fixtures.ts`, never borrowed from another's and never
 * written by hand.
 *
 * @param feature The module's committed `.feature` text.
 * @param bodies That module's own recordings, keyed by fixture name.
 */
export function captureGaps(
  feature: string,
  bodies: Record<string, RecordedFixture>
): readonly ForceMeasuredRecipe[] {
  const answerable = answerablePresets(bodies);

  return filter(
    hostablePresets(feature, bodies),
    preset => !some(answerable, entry => entry === preset)
  );
}
