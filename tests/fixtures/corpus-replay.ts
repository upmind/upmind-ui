// -----------------------------------------------------------------------------
/**
 * @module test-fixtures/corpus-replay
 * @description The ONE replay over a module's recorded corpus — the fake API
 * every executor shares: the labs page (`runtime/force`), the headless
 * feature-replay tests, and anything else that must answer a request the way
 * staging did. Moved here from `labs-nuxt/modules/scenarios/runtime/force/corpus.ts`
 * (2026-09-12) the day the headless replay tests were found hand-wiring a
 * second fake server per module; there is exactly one now, and it is this file.
 *
 * Reads resolve to the recording captured at the request's own endpoint, served
 * VERBATIM — a forced state is a static picture (FE-3145). A write is answered
 * by the recording of the SAME write (its request body), and a recorded refusal
 * is served as staging served it. Nothing here authors a body, and nothing here
 * mutates a recording: a request no recording holds is a capture gap, passed
 * through, never a stand-in slice (ADR 035).
 */

import { HttpResponse, http } from "msw";
import {
  filter,
  find,
  first,
  get,
  isEmpty,
  isEqual,
  isMatch,
  isNil,
  isPlainObject,
  isUndefined,
  map,
  sortBy,
  split,
  startsWith,
  toUpper,
  values
} from "lodash-es";
import type { HttpHandler, HttpResponseResolver, JsonBodyType } from "msw";

// -----------------------------------------------------------------------------

/** One recorded exchange, as the capture run stored it (a v3 fixture's request + response). */
export type RecordedFixture = {
  /** The request as captured — a write's `body` is what the capture run sent. */
  request: { method: string; path: string; body?: unknown };
  response: { status: number; body: unknown };
};

// -----------------------------------------------------------------------------

/** Every recorded body one module's resolver serves, keyed by fixture name. */
export type CorpusBodies = Readonly<Record<string, RecordedFixture>>;

/**
 * One record as the recorded wire carries it. Columns are the MODULE's own, so
 * none is named here — the criteria branching reads the column out of the
 * request's own `filter[col|op]` key.
 */
export type WireRecord = Record<string, unknown>;

/** The envelope every recorded read is wrapped in. */
export type WireEnvelope<T> = {
  status: string;
  data: T;
  total: number | null;
};

/** One resolved answer — the recording's own status and body, by construction. */
export type CorpusResponse = RecordedFixture["response"];

/** A recorded id segment: a uuid, or the capture run's own `mock-uuid-N` stand-in. */
const IDENTIFIER =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|mock-uuid-\d+)$/i;

/** At or above it the server refused; below it the exchange succeeded. */
const REFUSED_FROM = 400;

/**
 * Query keys that name what a read is ABOUT rather than which rows it wants.
 * `lang` picks the language a row is rendered IN, never which rows come back,
 * so a live read asking for one is answering the same question as a capture run
 * that never spelt it.
 */
const CRITERIA_IGNORED = ["case", "with", "lang"];

/**
 * Params whose comma-joined value names an unordered set (`keys` — which config
 * values to read) so a live read asking for the same keys in another order is the
 * same question. `keys` SELECTS which config values the response carries, so it
 * is identity in both naming and replay; only its element order is dropped.
 * Sorted before it enters the criteria, matching `fixtureIdentity`'s own
 * list-param normalisation.
 */
const NORMALIZE_LIST_PARAMS = ["keys"];

function criteriaValue(key: string, value: string): string {
  return NORMALIZE_LIST_PARAMS.includes(key)
    ? split(value, ",").filter(Boolean).sort().join(",")
    : value;
}

/** The offset a read asking for none was recorded at. */
const FIRST_PAGE = "0";

/**
 * The path's SHAPE: every id segment collapsed to a placeholder, so a request
 * addressed to one record finds the recording captured against another.
 */
function shapeOf(pathname: string): string {
  return map(filter(split(pathname, "/")), segment =>
    IDENTIFIER.test(segment) ? ":id" : segment
  ).join("/");
}

function fixtureShape(fixture: RecordedFixture): string {
  return shapeOf(first(split(fixture.request.path, "?")) ?? "");
}

/**
 * The concrete collection a recording was captured at — its path with the query
 * dropped and every id KEPT. Where {@link fixtureShape} deliberately forgets the
 * ids so a request finds a recording taken against another record, this
 * deliberately remembers them: two captures of the same endpoint under
 * different parents (`/countries/A/regions` and `/countries/B/regions`) hold
 * different rows, and pooling them together would answer either out of both.
 */
function collectionOf(fixture: RecordedFixture | undefined): string {
  return first(split(fixture?.request.path ?? "", "?")) ?? "";
}

function methodOf(fixture: RecordedFixture): string {
  return toUpper(fixture.request.method);
}

/**
 * The recordings captured at this request's own endpoint and method, in the
 * order they were recorded. A request the corpus never captured finds none, and
 * the caller passes it through (`AC8.3`).
 */
function matching(
  bodies: CorpusBodies,
  method: string,
  pathname: string
): RecordedFixture[] {
  const shape = shapeOf(pathname);
  const wanted = toUpper(method);

  return filter(
    values(bodies),
    fixture => methodOf(fixture) === wanted && fixtureShape(fixture) === shape
  );
}

// -----------------------------------------------------------------------------

/**
 * Resolves one request to its recorded answer, or `undefined` when no recording
 * was captured at that endpoint — the caller passes those through (`AC8.3`).
 *
 * A forced state is a static picture (FE-3145): the recording is served
 * VERBATIM. The request's own `filter[col|op]`, `order`/`sort` and
 * `limit`/`offset` pick WHICH recording answers, never re-derive its rows.
 */
export function resolveCorpusRequest(
  bodies: CorpusBodies,
  method: string,
  url: URL,
  sent?: unknown
): CorpusResponse | undefined {
  const { pathname, searchParams } = url;

  const candidates = matching(bodies, method, pathname);

  return pickRecording(candidates, searchParams, sent, pathname)?.response;
}

/**
 * The module's own recorded refusal for THIS request, matched by method and
 * resource shape — never by the record id the capture run happened to address,
 * which is the one row nobody is looking at.
 *
 * A write only ever takes a recorded WRITE refusal and a read a read's: a
 * sentence the API said about a change does not become something it said about
 * a read by being served to one. An auth refusal is taken by neither — forcing
 * one signs the operator out of the page they armed (FE-3113 P), so
 * `isServableRefusal` measures it out here exactly as it does in the offer.
 *
 * @param bodies One module's recordings.
 * @param method The request's own method.
 * @param url The request's own url; its ids are ignored.
 * @returns The refusal, or none where the corpus holds no matching one.
 */
export function resolveCorpusRefusal(
  bodies: CorpusBodies,
  method: string,
  url: URL
): RecordedFixture | undefined {
  const wanted = toUpper(method);
  const shape = shapeOf(url.pathname);

  const refusals = filter(
    values(bodies),
    fixture =>
      isServableRefusal(fixture) &&
      (methodOf(fixture) === "GET") === (wanted === "GET")
  );

  return (
    find(
      refusals,
      fixture => methodOf(fixture) === wanted && fixtureShape(fixture) === shape
    ) ??
    find(refusals, fixture => methodOf(fixture) === wanted) ??
    find(refusals, fixture => fixtureShape(fixture) === shape) ??
    first(refusals)
  );
}

/**
 * The module's own recorded read for a record that is NOT THERE — what `empty`
 * answers a single-record surface with. A collection empties by subtraction; a
 * member cannot, because an envelope with its record taken out is a shape no
 * capture returned, so this is a different RECORDING rather than a different
 * body (operator ruling, 2026-08-28 · S1).
 *
 * Matched by resource shape first, so a module holding several member reads
 * answers the one the request actually addressed.
 *
 * @param bodies One module's recordings.
 * @param url The request's own url; its ids are ignored.
 * @returns The absent-record recording, or none where the corpus holds no such
 * capture — which is the gap `captureGaps` reports.
 */
export function resolveCorpusAbsence(
  bodies: CorpusBodies,
  url: URL
): CorpusResponse | undefined {
  const shape = shapeOf(url.pathname);
  const absences = filter(values(bodies), isAbsentRecordRead);

  return (
    find(absences, fixture => fixtureShape(fixture) === shape) ??
    first(absences)
  )?.response;
}

/**
 * Which of the endpoint's recordings answers this request. A `case=` label is
 * the capture run's own name for a variant, so a request carrying one is
 * answered by the recording captured under it.
 *
 * Failing a label, the recording whose own criteria MATCH the request's wins —
 * a request naming no limit is answered by a capture that named none either,
 * rather than by whichever paged slice happens to sort first. That envelope is
 * what states the page size and the status, so picking a narrower capture
 * answers a full read at a page staging never returned.
 *
 * A request no recording asked is a CAPTURE GAP: none is returned and the caller
 * passes it through (`AC8.3`), never a stand-in slice that forces a state nobody
 * armed (ADR 035).
 */
/** The capture run's own `case` label for a recording, if it carries one. */
function labelOf(fixture: RecordedFixture): string | null {
  const [, search = ""] = split(fixture.request.path, "?");

  return new URLSearchParams(search).get("case");
}

function pickRecording(
  candidates: RecordedFixture[],
  params: URLSearchParams,
  sent?: unknown,
  pathname = ""
): RecordedFixture | undefined {
  const requestedCase = params.get("case");

  if (requestedCase) {
    const labelled = find(
      candidates,
      fixture => labelOf(fixture) === requestedCase
    );

    if (labelled) return labelled;
  }

  // A WRITE is answered by the recording of the SAME write: the capture run
  // stored what it sent, so the recording whose request body is what the page
  // just sent is the one that answers it — `enabled-off` for a `0`, never
  // whichever of thirteen PUT cases sorted first. Exact first, then the
  // recording the sent body extends (a save may carry more than the case did).
  const written = isPlainObject(sent)
    ? answersWrite(candidates, sent, pathname)
    : undefined;
  if (written) return written;

  const served = filter(
    candidates,
    fixture => fixture.response.status < REFUSED_FROM
  );
  const asked = criteriaOf(params);

  // A labelled capture answers its OWN case and nothing else. `criteriaOf`
  // drops the `case` label on purpose, so a variant captured under one compares
  // identical to the plain capture beside it — and an unlabelled request was
  // being answered by whichever of the two sorted first. That is how
  // client-notifications served the 3-row `case=after-save` opt-outs capture to
  // the plain `?limit=0` read staging recorded 2 rows for.
  const unlabelled = filter(served, fixture => !labelOf(fixture));
  const pool = requestedCase || isEmpty(unlabelled) ? served : unlabelled;

  const asking = (fixture: RecordedFixture) => {
    const [, search = ""] = split(fixture.request.path, "?");

    return criteriaOf(new URLSearchParams(search)) === asked;
  };

  // The recording that asked the SAME question answers, unlabelled first (the
  // tie-break above), then labelled: a `case=` label says why a capture was
  // taken, not what it asked, so `case=default` IS the plain read's own
  // recording when no unlabelled capture asked the same. Nothing else stands
  // in — a request no recording asked is a capture gap (ADR 035).
  return find(pool, asking) ?? find(served, asking);
}

function answersWrite(
  candidates: RecordedFixture[],
  sent: unknown,
  pathname: string
): RecordedFixture | undefined {
  const recorded = filter(candidates, fixture =>
    isPlainObject(fixture.request.body)
  );
  const sameBody = filter(recorded, fixture =>
    isEqual(fixture.request.body, sent)
  );
  const sameRecord = (fixture: RecordedFixture) =>
    collectionOf(fixture) === pathname;

  // The EXACT write takes its own recording whatever staging answered — a
  // refusal included: this brand refused `preferred_payment_currency_id`, and
  // a page saving it is told so, as staging told the capture run. Two
  // recordings of the same body are told apart by the RECORD they addressed
  // (`{default: true}` on a verified email was served; on an unverified one
  // refused), then a served answer stands ahead of a refused one, so a refusal
  // recorded against another record never answers a write to this one. Only
  // the looser match is kept to served answers, so a superset save is never
  // answered by a refusal recorded for a different body.
  return (
    find(sameBody, sameRecord) ??
    find(sameBody, fixture => fixture.response.status < REFUSED_FROM) ??
    first(sameBody) ??
    find(
      recorded,
      fixture =>
        fixture.response.status < REFUSED_FROM &&
        isMatch(sent as object, fixture.request.body as object)
    )
  );
}

/**
 * The criteria a request states, as one comparable sentence: the paging and
 * filtering keys in a fixed order, with the capture run's own `case` label and
 * the relation `with`/`keys` hints dropped. Those name what a recording is
 * ABOUT, not which rows it asked for, so two captures differing only there are
 * answering the same question.
 *
 * `offset=0` is dropped for the same reason it is never written down: it is the
 * first page, which is what a read naming no offset at all was recorded at. Spelling the default out loud is not a different question, and grading it
 * as one sent every unfiltered live read past its own capture to
 * {@link pickRecording}'s fallback — whichever recording sorted first, which for
 * one module is a zero-row filter capture, so its page drew nothing on Live.
 */
function criteriaOf(params: URLSearchParams): string {
  const stated = filter(
    [...params.entries()],
    ([key, value]) =>
      !CRITERIA_IGNORED.includes(key) &&
      !startsWith(key, "with_") &&
      !(key === "offset" && value === FIRST_PAGE)
  );

  return sortBy(
    map(stated, ([key, value]) => `${key}=${criteriaValue(key, value)}`)
  ).join("&");
}

// -----------------------------------------------------------------------------

const NOT_FOUND = 404;
const UNAUTHENTICATED = 401;

function isRead(fixture: RecordedFixture): boolean {
  return toUpper(fixture.request.method) === "GET";
}

function isRefusal(fixture: RecordedFixture): boolean {
  return fixture.response.status >= REFUSED_FROM;
}

/** A read the server answered — the recordings a state can be drawn from. */
export function isServedRead(fixture: RecordedFixture): boolean {
  return isRead(fixture) && !isRefusal(fixture);
}

/**
 * A refusal FORCING may serve. A forced state is a picture of a state, never
 * the event itself, so it may never have real consequences (operator ruling,
 * 2026-08-28): an unauthenticated refusal served to a read is indistinguishable
 * from an expired token, and the app signs the operator out of the very page
 * they armed.
 *
 * The recording is not deleted and keeps answering the guard scenario it was
 * captured for. It is only unreachable as an ANSWER a preset gives — which
 * leaves the state a capture gap, named loudly, rather than a button that logs
 * you out.
 *
 * An ABSENCE is measured out of this pool for the same reason it is drawn apart
 * on screen: a record that is not there is not a record that failed to load
 * (operator ruling, 2026-08-29 · `Y2`). Left in, it becomes the failure
 * `error-collection` serves, and `empty` and `error-collection` draw one picture
 * between them — the conflation this story exists to end.
 */
export function isServableRefusal(fixture: RecordedFixture): boolean {
  return (
    isRefusal(fixture) &&
    fixture.response.status !== UNAUTHENTICATED &&
    fixture.response.status !== NOT_FOUND
  );
}

/**
 * A read that came back carrying no RECORD — what a real API answers for a
 * record that is not there, at whatever status the module's own API says it
 * with. It is the recording `empty` serves a single-record surface from: an
 * object with its record taken out is a shape no capture returned, the module's
 * own mapper threw on it, and writing one here would be authoring a body
 * (operator ruling, 2026-08-28 · S1).
 *
 * A refusal is not an absence — only the one status that NAMES a missing record
 * qualifies, so a 401 carrying a null payload stays an auth refusal.
 *
 * The absence reading is the STATUS's, not the method's: a 404 to a delete says
 * the record was already gone, which is no more a load failure than a 404 to a
 * read is. {@link isServableRefusal} excludes both.
 */
export function isAbsentRecordRead(fixture: RecordedFixture): boolean {
  const { status } = fixture.response;

  return (
    isRead(fixture) &&
    isNil(get(fixture.response, ["body", "data"])) &&
    (status < REFUSED_FROM || status === NOT_FOUND)
  );
}

// -----------------------------------------------------------------------------

/**
 * The msw resolver that answers from a corpus: the recording of this request,
 * with the request's own body read once so a write is answered by the recording
 * of the SAME write.
 *
 * A request no recording answers is DECLINED — `undefined`, msw's "not mine,
 * try the next handler" — never `passthrough()`. The two are not the same
 * decision: `passthrough()` is TERMINAL. It ends the handler lookup and
 * performs the request AS-IS, so a corpus gap left this fake API and became
 * live traffic to the real one (`https://api.upmind.io`, `usePOP`'s deliberate
 * default), and — because the lookup stopped — it did so while the module's own
 * recorded fixture sat unread one handler further down.
 *
 * Declining leaves the decision with whoever armed the replay: the labs page
 * narrows its routes and lets msw's own unhandled policy answer, while
 * `startReplayServer` closes the stack with a wall, so a capture gap is a named
 * failure instead of a silent production request.
 *
 * @see `tests/fixtures/replay-server.ts` — the wall that closes the stack.
 */
export function corpusReplayResolver(
  bodies: CorpusBodies
): HttpResponseResolver {
  return async ({ request }) => {
    const url = new URL(request.url);
    const sent = await request
      .clone()
      .json()
      .catch(() => undefined);
    const answer = resolveCorpusRequest(bodies, request.method, url, sent);

    if (!answer) return undefined;

    return isUndefined(answer.body)
      ? new HttpResponse(null, { status: answer.status })
      : HttpResponse.json(answer.body as JsonBodyType, {
          status: answer.status
        });
  };
}

/**
 * The handlers a replay is armed with: one `http.all` per route, all answering
 * from one corpus. Routes default to the whole API; the labs page narrows them
 * to the routes the module's own feature declares.
 */
export function createCorpusReplayHandlers(
  bodies: CorpusBodies,
  routes: readonly string[] = ["*/api/*"]
): HttpHandler[] {
  const resolve = corpusReplayResolver(bodies);

  return map(routes, route => http.all(route, resolve));
}
