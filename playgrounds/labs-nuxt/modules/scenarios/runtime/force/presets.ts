// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/presets
 * @description The answers a forced page can give, over ONE module's corpus:
 * `empty` is the recorded read with what it carried taken away — a collection's
 * rows, or a single record — `error-action` and `error-collection` are the
 * recording that FAILED aimed at the write and at the read respectively,
 * `loading` is no answer at all, and `replay` is the answer the resolver already
 * picks. Same corpus, a different answer: the only thing a preset may change
 * about a recording is which of them is served, so nothing here authors a body
 * and no response literal appears in this file (`S13` · `AC8.5`).
 *
 * The two failures are named apart because they are different states (`R6-19`).
 * Where the module's refusal is a WRITE, `error-action` is the faithful half —
 * the read is served as recorded, the row's write gets the recorded refusal and
 * the list stays intact. `error-collection` fails the read at that same recorded
 * status and serves NO body, because a sentence recorded against a write would,
 * lent to a read, say the very thing the ruling called a conflation.
 *
 * A forced state is also the state on ARMING, requiring no interaction at all
 * (operator ruling, 2026-08-28): {@link presetRefusal} hands the surface that
 * same recording's SENTENCE, so a row draws refused with nothing fired, while
 * {@link presetAnswer} still refuses a write the operator does fire.
 *
 * UN-PINNED (FE-3113): which recording failed is the MODULE's own business, so
 * it arrives as an argument beside the bodies rather than as a fixture name
 * spelt here. That constant was the single line pinning the whole force system
 * to `client-email`. A module with no refusal on record answers NEITHER failure
 * — `capabilities.ts` offers neither preset, and this file serves the request as
 * recorded rather than inventing one to refuse it with. The 500 a read used to
 * fall back to was a status nobody recorded, served while the UI warned the
 * corpus could not answer it; fabricated evidence is still fabricated when it
 * carries no body.
 *
 * A request the corpus does not own is answered by nobody — the caller passes it
 * through, which is what keeps forcing to this module's own endpoints (`AC8.3`).
 * The refused WRITE is the one exception: `error-action` is a STATE, not a
 * replay of one recorded exchange, and the armed routes have already scoped the
 * request to this module's own subject (FE-3113 K2).
 *
 * Bodies arrive as an ARGUMENT, exactly as the resolver's do: app runtime's are
 * the `ESC6` seam's (`runtimeCorpus()`), a spec's are its own lawful read of the
 * same committed files, and no `@upmind-automation/headless/testing` specifier
 * appears here either — eslint 8g reds one outside the four test-lane globs, and
 * `lint` is a gate.
 *
 * Transport-free by design: an answer is data, so which state a preset forces is
 * provable without a service worker. `handlers.ts` is the only file that turns
 * one into an msw response.
 */

import { corpusCapabilities } from "./capabilities";
import { resolveCorpusRefusal, resolveCorpusRequest } from "./corpus";
import { get, isArray, isObject, isString, toUpper } from "lodash-es";
import type { CorpusBodies, CorpusResponse } from "./corpus";
import type { RecordedFixture } from "./corpus.source.types";
import type { ForcePreset } from "../composables/useForcedState.types";

// -----------------------------------------------------------------------------

/** The answer `loading` gives: none, and none is coming. */
export const PENDING = "pending" as const;

/**
 * What a preset answers one request with — a recorded response, `PENDING`, or
 * `undefined` for a request the corpus does not own.
 */
export type PresetAnswer = CorpusResponse | typeof PENDING | undefined;

/**
 * The same recorded envelope with what it CARRIED taken away — a collection
 * loses its rows, a member loses its record, an acknowledgement carrying no data
 * is served as recorded. The empty state as the recording itself would have
 * carried it, rather than a body written to look like one.
 */
function withoutRecords(response: CorpusResponse): CorpusResponse {
  const body = response.body as { data?: unknown };

  if (!isObject(body?.data)) return response;

  return isArray(body.data)
    ? { ...response, body: { ...body, data: [], total: 0 } }
    : { ...response, body: { ...body, data: null } };
}

/**
 * The recorded refusal's STATUS with its sentence withheld — the answer a failed
 * READ gets. The sentence on record refuses a set-default, and a collection that
 * borrowed it would say the wrong thing out loud (`R6-19`); withholding it is a
 * subtraction from a recording, never a body written here.
 */
function withoutBody(response: CorpusResponse): CorpusResponse {
  return { ...response, body: undefined };
}

/** A read, as opposed to one of the module's writes. */
function isRead(method: string): boolean {
  return toUpper(method) === "GET";
}

/**
 * The sentence an armed `error-action` marks a row with, or none where the
 * module recorded no refused write.
 *
 * COPY, where every other preset needs only an answer to a request: this one
 * renders with nothing fired, so the row needs the words.
 *
 * Both halves come off the SAME recording — this reads its sentence,
 * {@link presetAnswer} serves its status to a real write — so neither is
 * authored (`S13`) and the two cannot disagree. Which recording is
 * `capabilities.ts`'s measurement: the failing WRITE `canErrorAction` is
 * offered on, never a read's refusal lent to a change.
 *
 * @param bodies One module's recordings.
 * @returns The recorded sentence, or none where no write refusal is on record.
 */
export function presetRefusal(bodies: CorpusBodies): string | undefined {
  const { response } = corpusCapabilities(bodies).refusedWrite ?? {};

  const message =
    get(response, ["body", "error", "message"]) ??
    get(response, ["body", "message"]);

  return isString(message) ? message : undefined;
}

// -----------------------------------------------------------------------------

/**
 * The answer `preset` gives this request, over the recorded corpus.
 *
 * Every preset goes through the ONE resolver first, so a preset changes the
 * answer and never which recordings exist: a filtered or sorted read still
 * reaches the wire and still narrows under `empty`, and a path this module does
 * not own is nobody's to answer.
 */
export function presetAnswer(
  preset: ForcePreset,
  bodies: CorpusBodies,
  method: string,
  url: URL,
  recordedFailure?: RecordedFixture
): PresetAnswer {
  const served = resolveCorpusRequest(bodies, method, url);

  // ABOVE the `!served` guard deliberately: the acted-on row carries an id no
  // capture run addressed, so a write that had to resolve first was answered by
  // nobody and reached the real API under a forced chip.
  if (preset === "error-action" && !isRead(method))
    return resolveCorpusRefusal(bodies, method, url)?.response ?? served;

  if (!served) return undefined;
  if (preset === "loading") return PENDING;

  if (preset === "error-action") return served;

  const failure = recordedFailure?.response;

  if (preset === "error-collection")
    return isRead(method) && failure ? withoutBody(failure) : served;

  // A write is left exactly as recorded: `empty` is a state of the READ, and a
  // one-record surface's member read is still a read. Emptying an
  // acknowledgement would take the saved record away from the very save that
  // just returned it.
  return preset === "empty" && isRead(method) ? withoutRecords(served) : served;
}
