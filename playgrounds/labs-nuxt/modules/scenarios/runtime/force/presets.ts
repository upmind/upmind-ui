// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/presets
 * @description The answers a forced page can give, over the ONE corpus:
 * `empty` is the recorded collection with its rows removed, `error-action` and
 * `error-collection` are the recording that FAILED aimed at the write and at the
 * read respectively, `loading` is no answer at all, and `replay` is the answer
 * the resolver already picks. Same corpus, a different answer: the only thing a
 * preset may change about a recording is which of them is served, so nothing
 * here authors a body and no response literal appears in this file (`S13` ·
 * `AC8.5`).
 *
 * The two failures are named apart because they are different states (`R6-19`).
 * One recording failed and it is a WRITE, so `error-action` is the faithful half
 * — the read is served as recorded, the row's write gets the recorded refusal
 * and the list stays intact. `error-collection` fails the read at that same
 * recorded status and serves NO body, because the sentence on record answers a
 * set-default and a read that borrowed it would say the very thing the ruling
 * called a conflation. A recorded failing collection read would replace this;
 * the corpus holds none.
 *
 * A request the corpus does not own is answered by nobody — the caller passes it
 * through, which is what keeps forcing to this module's own endpoints (`AC8.3`).
 *
 * Bodies arrive as an ARGUMENT, exactly as the resolver's do: app runtime's are
 * the `ESC6` seam's (`runtimeCorpus()`), a spec's are its own lawful read of the
 * same committed files, and no `@upmind-automation/headless/testing/*` specifier
 * appears here either — eslint 8g reds one outside the four test-lane globs, and
 * `lint` is a gate.
 *
 * Transport-free by design: an answer is data, so which state a preset forces is
 * provable without a service worker. `handlers.ts` is the only file that turns
 * one into an msw response.
 */

import { resolveCorpusRequest } from "./corpus";
import { isArray, toUpper } from "lodash-es";
import type { CorpusResponse } from "./corpus";
import type { CorpusBodies, CorpusFixtureName } from "./corpus.source.types";
import type { ForcePreset } from "../composables/useForcedState.types";

// -----------------------------------------------------------------------------

/**
 * The one recording that failed: staging's own 409 refusing to make an
 * unverified address the default, carrying the API's own sentence (`S14`).
 */
const RECORDED_FAILURE: CorpusFixtureName =
  "put-clients-id-emails-id-case-set-default-unverified";

/** The answer `loading` gives: none, and none is coming. */
export const PENDING = "pending" as const;

/**
 * What a preset answers one request with — a recorded response, `PENDING`, or
 * `undefined` for a request the corpus does not own.
 */
export type PresetAnswer = CorpusResponse | typeof PENDING | undefined;

/**
 * The same recorded envelope with its rows removed — the empty state as the
 * recording itself would have carried it, rather than a body written to look
 * like one. A member or acknowledgement recording has no rows to remove and is
 * served exactly as recorded.
 */
function withoutRows(response: CorpusResponse): CorpusResponse {
  const body = response.body as { data?: unknown };

  return isArray(body?.data)
    ? { ...response, body: { ...body, data: [], total: 0 } }
    : response;
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
  url: URL
): PresetAnswer {
  const served = resolveCorpusRequest(bodies, method, url);

  if (!served) return undefined;
  if (preset === "loading") return PENDING;

  const failure = bodies[RECORDED_FAILURE].response;

  // Aimed at the half of the exchange the preset is named for: the other half is
  // served exactly as recorded, which is what keeps a refused row inside a list
  // that still has its rows.
  if (preset === "error-action") return isRead(method) ? served : failure;
  if (preset === "error-collection")
    return isRead(method) ? withoutBody(failure) : served;

  return preset === "empty" ? withoutRows(served) : served;
}
