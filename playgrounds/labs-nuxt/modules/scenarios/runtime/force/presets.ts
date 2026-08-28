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
 * The refused WRITE is the one exception, and it is the point of the preset: the
 * armed routes have already scoped the request to this module's own subject, and
 * a state that only refuses the single row the capture run addressed is not a
 * state at all (FE-3113 K2). The refusal served is still the module's own.
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

import { resolveCorpusRefusal, resolveCorpusRequest } from "./corpus";
import { isArray, isObject, toUpper } from "lodash-es";
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
 * The same recorded envelope with what it CARRIED taken away — the empty state
 * as the recording itself would have carried it, rather than a body written to
 * look like one.
 *
 * A collection loses its rows; a MEMBER loses its record, because a one-record
 * surface is empty when the record is absent and `empty` is not exclusively "a
 * list with zero rows" (operator ruling, 2026-08-28). An acknowledgement
 * carrying no data at all has nothing to take away and is served as recorded.
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

  // The half `error-action` is NAMED for, and the one branch that answers a
  // request the corpus captured no exchange of. A preset is a STATE, not a
  // replay of one recorded exchange: the recorded refusal is bound to the row
  // the capture run addressed, the rows on screen are other rows, so requiring
  // this write to resolve first left every acted-on row passing through to the
  // real API under a forced chip. The refusal is still the module's OWN, and
  // `resolveCorpusRefusal` matches it by method and resource shape.
  if (preset === "error-action" && !isRead(method))
    return resolveCorpusRefusal(bodies, method, url)?.response ?? served;

  if (!served) return undefined;
  if (preset === "loading") return PENDING;

  // The other half of a named failure is served exactly as recorded, which is
  // what keeps a refused row inside a list that still has its rows.
  if (preset === "error-action") return served;

  // A read refuses at the module's own recorded STATUS with its sentence
  // withheld (`R6-19`), so a module holding no refusal answers neither failure
  // — the request is served as recorded rather than at a status this file made
  // up, and `answerablePresets` never offers the preset in the first place
  // (`S13`).
  const failure = recordedFailure?.response;

  if (preset === "error-collection")
    return isRead(method) && failure ? withoutBody(failure) : served;

  return preset === "empty" ? withoutRecords(served) : served;
}
