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
 * Reads resolve to the recording captured at the request's own endpoint, with
 * the request's own criteria applied to the pooled recorded rows. A write is
 * answered by the recording of the SAME write (its request body), lands on the
 * collection or the single record the next read is answered from, and a
 * recorded refusal is served as staging served it. Nothing here authors a body.
 */

import { HttpResponse, http, passthrough } from "msw";
import {
  compact,
  endsWith,
  every,
  filter,
  find,
  findKey,
  first,
  fromPairs,
  get,
  initial,
  isArray,
  isEmpty,
  isEqual,
  isMatch,
  isNil,
  isNumber,
  isPlainObject,
  isUndefined,
  join,
  keys,
  last,
  map,
  mapValues,
  max,
  orderBy,
  pickBy,
  reject,
  size,
  some,
  sortBy,
  split,
  startsWith,
  take,
  toLower,
  toPairs,
  toUpper,
  uniqBy,
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

/**
 * The recorded corpus as ONE replay has it: the recordings, plus the mutations
 * that have already been PLAYED against them.
 *
 * A stateless resolver answers every read from the same recording, so a scene
 * that WRITES can never move the surface — the create fires, the module
 * re-reads, and the identical recorded rows come back. That is what made replay
 * cosmetic (`R7-4`): only the criteria scenes (filter, sort) reached the
 * rendered rows, because only they travel in the request.
 *
 * Nothing is authored to make it move: what a mutation lands on the collection
 * is that mutation's OWN recorded row, and a delete lands nothing at all
 * (`S13`).
 */
export type CorpusSession = {
  /** The recordings as this replay has them now. */
  bodies: () => CorpusBodies;
  /**
   * Lands a served mutation on the collection — or the single record — the
   * next read is answered from. `answered` is the served response body: a
   * single record takes the record staging RETURNED for the write, so the
   * re-read agrees with what the form was just shown.
   */
  apply: (method: string, url: URL, body?: unknown, answered?: unknown) => void;
};

/** A recorded id segment: a uuid, or the capture run's own `mock-uuid-N` stand-in. */
const IDENTIFIER =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|mock-uuid-\d+)$/i;

/** At or above it the server refused; below it the exchange succeeded. */
const REFUSED_FROM = 400;

const FILTER_KEY = /^filter\[([^\]|]+)(?:\|([^\]]+))?\]$/;

/** The truthy spelling a recorded boolean filter uses on the wire. */
const TRUE_VALUES = ["1", "true"];

/**
 * Query keys that name what a read is ABOUT rather than which rows it wants.
 * `lang` picks the language a row is rendered IN, never which rows come back,
 * so a live read asking for one is answering the same question as a capture run
 * that never spelt it.
 */
const CRITERIA_IGNORED = ["case", "with", "keys", "lang"];

/** The offset a read asking for none already gets — see {@link servedRows}. */
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

function envelopeOf(
  fixture: RecordedFixture | undefined
): WireEnvelope<WireRecord[]> | undefined {
  const body = fixture?.response.body as WireEnvelope<unknown> | undefined;

  return isArray(body?.data) ? (body as WireEnvelope<WireRecord[]>) : undefined;
}

/** A successful read whose body carries rows — the collection captures. */
function isCollectionRead(fixture: RecordedFixture): boolean {
  return (
    methodOf(fixture) === "GET" &&
    fixture.response.status < REFUSED_FROM &&
    !!envelopeOf(fixture)
  );
}

/** The recorded `offset` a paged capture was taken at, for ordering the pages. */
function offsetOf(fixture: RecordedFixture): number {
  const [, search = ""] = split(fixture.request.path, "?");

  return Number(new URLSearchParams(search).get("offset") ?? 0);
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

/**
 * The whole recorded collection at ONE resource: every capture of it, in
 * recorded-offset order, unioned and de-duplicated by row id.
 *
 * The union is the point. No single capture is the collection — a run takes a
 * page here, a filtered slice there, a sorted view somewhere else, and each one
 * is a partial VIEW of the same set. `client-company` records two companies
 * matching `%Heg%` while holding one of them in its paged capture and the other
 * only in its staged-imports capture, so any single recording answers that
 * filter with half the rows staging returned. Every row is still verbatim; the
 * union adds none and authors none, it just stops discarding the ones another
 * capture saw.
 *
 * @param bodies One module's recordings.
 * @param at The recording whose collection to draw rows from, defaulting to the
 *   module's own collection — the endpoint its capture run drove hardest. Rows
 *   are pooled per RESOURCE, not per endpoint shape: `client-address` reads
 *   regions under two different countries, and those share a shape while
 *   holding different rows, so answering one out of the other's rows would be
 *   the same defect as answering it out of the addresses.
 */
export function corpusRows(
  bodies: CorpusBodies,
  at?: RecordedFixture,
  params: URLSearchParams = at ? requestParams(at) : new URLSearchParams()
): WireRecord[] {
  const reads = filter(values(bodies), isCollectionRead);
  const resource = at
    ? collectionOf(at)
    : collectionOf(
        find(reads, fixture => fixtureShape(fixture) === collectionShape(reads))
      );

  // The pool is every capture of the resource that narrows NOTHING beyond the
  // question asked — its pages and sorts of the one set, and the captures
  // sharing the request's own filters. A capture narrowed for another
  // question answers that question only.
  const captures = sortBy(
    filter(
      reads,
      fixture =>
        collectionOf(fixture) === resource && !narrowsBeyond(fixture, params)
    ),
    offsetOf
  );

  return uniqBy(concatRows(captures), row => get(row, "id", row));
}

/**
 * How many rows the recording's own criteria matched, as its envelope states —
 * the `total` beside the page it carried. This is the authority on the SIZE of
 * a result the pool cannot overrule: `client-email` recorded its bare read at
 * `total: 1` while its paged captures hold three, so answering the bare read out
 * of the pooled three would report a collection staging never had.
 */
function recordedTotal(
  fixture: RecordedFixture | undefined
): number | undefined {
  const total = envelopeOf(fixture)?.total;

  return isNumber(total) ? total : undefined;
}

/**
 * The page size a recording was served at, when its own envelope says it was
 * paged — rows carried against a LARGER `total`. That inequality is the API
 * stating its default page out loud, so a request naming no limit is answered
 * at the size staging answered it. A recording holding its whole set says
 * nothing about paging and yields none.
 */
function recordedPage(
  fixture: RecordedFixture | undefined
): number | undefined {
  const envelope = envelopeOf(fixture);
  const total = recordedTotal(fixture);

  if (!envelope || !isNumber(total)) return undefined;

  return size(envelope.data) < total ? size(envelope.data) : undefined;
}

function concatRows(pages: RecordedFixture[]): WireRecord[] {
  const rows: WireRecord[] = [];

  for (const page of pages) {
    const envelope = envelopeOf(page);
    if (envelope) rows.push(...envelope.data);
  }

  return rows;
}

/**
 * The endpoint the module's COLLECTION was captured at: the one the most
 * recordings share, which is what a capture run drives hardest. Ties break on
 * the shallower path, since a collection sits above the member it holds.
 */
function collectionShape(reads: RecordedFixture[]): string | undefined {
  const shapes = map(reads, fixtureShape);

  return first(
    sortBy(
      shapes,
      shape => -size(filter(shapes, entry => entry === shape)),
      shape => size(split(shape, "/"))
    )
  );
}

// -----------------------------------------------------------------------------

/**
 * Applies the request's own criteria to the recorded corpus. Every branch reads
 * the OPERATOR off the request — `filter[col|op]` states its own column, so the
 * module's columns are never named here.
 *
 * @param at The recording whose collection answers this request. See
 *   {@link corpusRows}.
 */
/**
 * The size the POOL vouches for: the largest `total` any pooled capture
 * stated. One capture's own `total` is the authority for its own question; a
 * question no capture asked is answered out of the pool, and the pool's size
 * is what its most complete capture saw — `client-email` recorded its first
 * read at `total: 1` and its pages at `total: 3`, and a plain read clipped to
 * the first capture's moment showed one address of three.
 */
function pooledTotal(
  bodies: CorpusBodies,
  at: RecordedFixture | undefined,
  params: URLSearchParams
): number | undefined {
  const stated = compact(
    map(pooledCaptures(bodies, at, params), recordedTotal)
  );

  return isEmpty(stated) ? undefined : max(stated);
}

/** The captures of `at`'s resource that narrow nothing beyond `params`. */
function pooledCaptures(
  bodies: CorpusBodies,
  at: RecordedFixture | undefined,
  params: URLSearchParams
): RecordedFixture[] {
  const reads = filter(values(bodies), isCollectionRead);
  const resource = at
    ? collectionOf(at)
    : collectionOf(
        find(reads, fixture => fixtureShape(fixture) === collectionShape(reads))
      );

  return filter(
    reads,
    fixture =>
      collectionOf(fixture) === resource && !narrowsBeyond(fixture, params)
  );
}

export function servedRows(
  bodies: CorpusBodies,
  params: URLSearchParams,
  at?: RecordedFixture
): WireRecord[] {
  return servedCollection(bodies, params, at).rows;
}

/**
 * The page a collection read is answered with, and the `total` that answer
 * states. The total is the pool's where the request narrows nothing beyond
 * the pool's own question; a request that filters further is answered with
 * the count its filter left — never a stated total the filter never saw.
 */
export function servedCollection(
  bodies: CorpusBodies,
  params: URLSearchParams,
  at?: RecordedFixture
): { rows: WireRecord[]; total: number } {
  let rows = corpusRows(bodies, at, params);
  const narrowsThePool = some(
    toPairs(narrowingOf(params)),
    ([key, value]) =>
      !some(
        pooledCaptures(bodies, at, params),
        capture => narrowingOf(requestParams(capture))[key] === value
      )
  );

  for (const [key, value] of params.entries()) {
    const [, column, operator = "eq"] = FILTER_KEY.exec(key) ?? [];
    if (!column) continue;

    rows = applyFilter(rows, column, operator, value);
  }

  // `order=-default,email`: every key, in its stated direction.
  const order = params.get("order") ?? params.get("sort");
  if (order) {
    const keys_ = compact(split(order, ","));
    rows = orderBy(
      rows,
      map(keys_, key => (startsWith(key, "-") ? key.slice(1) : key)),
      map(keys_, key => (startsWith(key, "-") ? "desc" : "asc"))
    );
  }

  // The matched recording's `total` is the authority on how many rows its own
  // criteria match, and the pool cannot overrule it: a capture that says its
  // whole collection is one row answers with one, however many the module's
  // other captures of that endpoint saw.
  const stated = pooledTotal(bodies, at, params);
  if (!narrowsThePool && isNumber(stated) && stated < size(rows))
    rows = take(rows, stated);

  const total =
    !narrowsThePool && isNumber(stated) && stated > size(rows)
      ? stated
      : size(rows);

  const offset = Number(params.get("offset") ?? 0);

  // `limit=0` is the API's UNLIMITED, not a request for no rows — the recordings
  // say so out loud: every `limit=0` capture came back with the whole
  // collection. Reading it as a zero-length page serves an empty list for the
  // widest read a module has on record.
  //
  // A request naming no limit at all gets the page size its own RECORDING was
  // served at: an envelope carrying 10 rows against a `total` of 79 states the
  // API's default page out loud, and serving the pooled 20 instead would answer
  // with a page staging never returned.
  const requested = Number(params.get("limit") ?? 0);
  const limit = requested > 0 ? requested : (recordedPage(at) ?? size(rows));

  return { rows: rows.slice(offset, offset + limit), total };
}

function applyFilter(
  rows: WireRecord[],
  column: string,
  operator: string,
  value: string
): WireRecord[] {
  // A filter on a field NO recorded row carries was resolved by the SERVER — a
  // relation the wire joined (`clients.id` against a row that carries the
  // foreign key `client_id`, never a nested `clients` object). The recorded
  // rows already reflect that narrowing, so re-applying it here would drop every
  // one; leave the set as staging returned it. A column the rows DO carry —
  // flat (`pinned`) or nested (`product.name`) — still narrows and stays
  // falsifiable, read through the dotted path the request spelt.
  if (every(rows, row => isUndefined(get(row, column)))) return rows;

  if (operator === "like") {
    const needle = toLower(value.replace(/%/g, ""));

    return filter(rows, row =>
      toLower(String(get(row, column) ?? "")).includes(needle)
    );
  }

  if (operator === "neq")
    return reject(rows, row => matchesValue(get(row, column), value));

  return filter(rows, row => matchesValue(get(row, column), value));
}

/**
 * Whether a recorded cell answers a filter's value. Booleans and nulls travel as
 * words on the wire (`1`, `true`, `null`), so the comparison is against the
 * spelling the request used rather than against a coerced copy of the row.
 */
function matchesValue(cell: unknown, value: string): boolean {
  if (value === "null") return cell === null || cell === undefined;
  if (value === "0" || value === "false") return cell === false;
  if (TRUE_VALUES.includes(value)) return cell === true;

  return isEqual(String(cell), value);
}

// -----------------------------------------------------------------------------

/**
 * Resolves one request to its recorded answer, or `undefined` when no recording
 * was captured at that endpoint — the caller passes those through (`AC8.3`).
 *
 * Each recording is self-describing, so the branching is the request's own shape
 * and nothing more: the status and the body served are the ones staging
 * returned. A collection read is the one answer BUILT rather than picked, and it
 * is built out of the recorded envelope with the request's own criteria applied
 * — which is what keeps a filter falsifiable.
 */
export function resolveCorpusRequest(
  bodies: CorpusBodies,
  method: string,
  url: URL,
  sent?: unknown
): CorpusResponse | undefined {
  const { pathname, searchParams } = url;

  const candidates = matching(bodies, method, pathname);
  const recorded = pickRecording(candidates, searchParams, sent, pathname);

  if (!recorded) return undefined;

  if (!isCollectionRead(recorded)) return recorded.response;

  const envelope = envelopeOf(recorded);
  if (!envelope) return recorded.response;

  // A recording that asked this very question answers it with its OWN rows —
  // verbatim, as staging returned them at its own url, with whatever a session
  // has since landed on them (`AC3`: every recorded read replays at its own url
  // as recorded). The pool below is for the question no capture asked, and it
  // unions only the captures that narrow nothing beyond that question, so a
  // capture narrowed for another question (secrets beside notes) never lends
  // a plain read its rows.
  if (asksTheSame(recorded, searchParams)) return recorded.response;

  // The rows come from the collection the MATCHED recording was captured at,
  // not from the module's busiest one. A module reading several collections
  // holds a distinct set per resource, and drawing from the wrong one answers a
  // read of countries with a list of addresses.
  const { rows, total } = servedCollection(bodies, searchParams, recorded);

  return {
    status: recorded.response.status,
    body: { ...envelope, data: rows, total }
  };
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
 * Everything else takes the endpoint's first SUCCESSFUL capture. A corpus may
 * hold a recorded refusal at the very endpoint it also reads successfully
 * (client-phone's 500 on a `number|like` filter is the standing case), and
 * serving that to every unqualified request would leave the page permanently
 * errored — a forced failure nobody armed. The refusal is still reached, by the
 * preset named for it; picking it here would be the resolver forcing a state.
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
  // recording when no unlabelled capture asked the same. Only when nothing
  // asked the question does the pool's first capture stand in — and never a
  // zero-row filter capture over a labelled capture of the very read
  // (client-email-history, 2026-09-12: the plain read was answered by
  // `filter[bounced]=true`'s empty page, so Live drew nothing).
  return (
    find(pool, asking) ??
    find(served, asking) ??
    first(pool) ??
    first(candidates)
  );
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

/** The filters and search a request states — the words that narrow the set. */
function narrowingOf(params: URLSearchParams): Record<string, string> {
  return fromPairs(
    filter(
      [...params.entries()],
      ([key]) => startsWith(key, "filter[") || key === "query"
    )
  );
}

function requestParams(fixture: RecordedFixture): URLSearchParams {
  const [, search = ""] = split(fixture.request.path, "?");

  return new URLSearchParams(search);
}

/**
 * Whether a capture narrows the set BEYOND the question `params` ask: it
 * carries a filter or search the request does not carry, or carries a
 * different value for one. A filter every capture of a resource states
 * (`filter[object_type]=client` on every custom-fields read) is that
 * resource's own question, not a narrowing — it is the request's too.
 */
function narrowsBeyond(
  fixture: RecordedFixture,
  params: URLSearchParams
): boolean {
  const asked = narrowingOf(params);

  return some(
    toPairs(narrowingOf(requestParams(fixture))),
    ([key, value]) => asked[key] !== value
  );
}

/** A capture that narrows beyond what ANY sibling at its resource asked. */
function isNarrowed(
  fixture: RecordedFixture,
  siblings: RecordedFixture[]
): boolean {
  return some(siblings, sibling =>
    narrowsBeyond(fixture, requestParams(sibling))
  );
}

/** Whether a recording asked exactly the question `params` ask (its `case` label aside). */
function asksTheSame(
  fixture: RecordedFixture,
  params: URLSearchParams
): boolean {
  const [, search = ""] = split(fixture.request.path, "?");

  return criteriaOf(new URLSearchParams(search)) === criteriaOf(params);
}

/**
 * The criteria a request states, as one comparable sentence: the paging and
 * filtering keys in a fixed order, with the capture run's own `case` label and
 * the relation `with`/`keys` hints dropped. Those name what a recording is
 * ABOUT, not which rows it asked for, so two captures differing only there are
 * answering the same question.
 *
 * `offset=0` is dropped for the same reason it is never written down: it is the
 * first page, which is what {@link servedRows} serves a read naming no offset at
 * all. Spelling the default out loud is not a different question, and grading it
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

  return sortBy(map(stated, ([key, value]) => `${key}=${value}`)).join("&");
}

// -----------------------------------------------------------------------------

/** The one served read of a single record — a form's own `GET …/:id`. */
function withRecord(
  fixture: RecordedFixture,
  record: WireRecord
): RecordedFixture {
  return {
    ...fixture,
    response: {
      ...fixture.response,
      body: { ...(fixture.response.body as object), data: record }
    }
  };
}

/**
 * The name of the served member read a SINGLE-RECORD module answers its form
 * from — a `GET` at an `…/:id` shape carrying one object, in a corpus that
 * holds no collection read at all. A module that lists has rows to land a write
 * on; one that edits a single record has this.
 */
function memberReadName(source: CorpusBodies): string | undefined {
  return findKey(
    source,
    fixture =>
      methodOf(fixture) === "GET" &&
      fixture.response.status < REFUSED_FROM &&
      endsWith(fixtureShape(fixture), "/:id") &&
      isPlainObject(get(fixture.response.body, "data"))
  );
}

/**
 * Opens a replay over the recorded corpus. Reads resolve exactly as they always
 * did — {@link resolveCorpusRequest} is unchanged and the session hands it
 * bodies — so the criteria branching, the presets and the browser lane keep the
 * one behaviour they already share.
 *
 * @param source The committed recordings this replay starts from.
 */
export function createCorpusSession(source: CorpusBodies): CorpusSession {
  // Every collection capture, as this session has it now. A write lands on
  // EACH capture that holds the row it touched — the paged first page, the
  // filtered slice, the unfiltered dump alike — so whichever recording answers
  // the next read shows what the write did. Landing only on a pooled row set
  // re-served through paged captures left every unpaged capture serving the
  // unmutated row (client-notes, client-phone, 2026-09-12).
  const captures: Record<string, RecordedFixture> = mapValues(
    pickBy(source, isCollectionRead),
    fixture => ({ ...fixture })
  );

  const hasCollection = !!collectionShape(values(captures));
  const memberName = hasCollection ? undefined : memberReadName(source);
  let member: WireRecord | undefined = memberName
    ? (source[memberName].response.body as WireEnvelope<WireRecord>).data
    : undefined;

  /** The captures taken at `resource`, the concrete path a write addressed. */
  const capturesAt = (resource: string) =>
    filter(keys(captures), name => collectionOf(captures[name]) === resource);

  /**
   * Rewrites one capture's rows. Its stated `total` moves by `sizeDelta` — the
   * change in the COLLECTION's size, which a delete or a creation makes on
   * every capture of the resource whether or not that capture's own page held
   * the row; a page that did not hold the deleted row still lists one fewer.
   */
  function land(
    name: string,
    change: (rows: WireRecord[]) => WireRecord[],
    sizeDelta = 0
  ): void {
    const fixture = captures[name];
    const envelope = envelopeOf(fixture);
    if (!envelope) return;

    const rows = change(envelope.data);
    const delta = sizeDelta;
    const stated = recordedTotal(fixture);

    captures[name] = {
      ...fixture,
      response: {
        ...fixture.response,
        body: {
          ...envelope,
          data: rows,
          total: isNumber(stated) ? stated + delta : size(rows)
        }
      }
    };
  }

  /** A capture whose own request narrowed nothing — where a created row lands. */
  const isUnfiltered = (name: string) =>
    !isNarrowed(captures[name], values(captures));

  return {
    bodies: () => {
      const replayed: Record<string, RecordedFixture> = {
        ...source,
        ...captures
      };

      if (memberName && member)
        replayed[memberName] = withRecord(source[memberName], member);

      return replayed;
    },

    apply(method, url, body, answered) {
      const { pathname } = url;
      const requested = body as Partial<WireRecord> | undefined;
      const verb = toUpper(method);
      const collection = collectionShape(values(captures));
      const shape = shapeOf(pathname);
      const returned: unknown = get(answered, "data");

      // The single record a form edits: what lands is the record staging
      // RETURNED for this write (the recording's own `data`), else the request's
      // values — so the re-read shows exactly what the form was shown.
      if (
        !collection &&
        memberName &&
        shape === fixtureShape(source[memberName]) &&
        (verb === "PUT" || verb === "PATCH")
      ) {
        member = {
          ...member,
          ...(isPlainObject(returned) ? (returned as WireRecord) : requested)
        };
        return;
      }

      // A member sits one id segment below the collection it belongs to: the
      // write lands on that row in every capture of the collection holding it.
      if (collection && shape === `${collection}/:id`) {
        const id = last(split(pathname, "/"));
        const resource = join(initial(split(pathname, "/")), "/");
        // The served record lands only when it IS this row: a recording of the
        // same write against another record answers the write, but its body
        // names that other record, and spreading it here would overwrite this
        // row's identity with it. The request's own values land otherwise.
        const landed =
          isPlainObject(returned) && get(returned, "id") === id
            ? (returned as WireRecord)
            : (requested ?? {});
        const held = some(capturesAt(resource), name =>
          some(envelopeOf(captures[name])?.data, ["id", id])
        );

        for (const name of capturesAt(resource)) {
          if (verb === "DELETE")
            land(name, rows => reject(rows, ["id", id]), held ? -1 : 0);
          // A write to a row no capture holds lands nowhere — flipping every
          // row's `default` off for an id nobody has would unmake the default.
          if ((verb === "PUT" || verb === "PATCH") && held)
            land(name, rows =>
              requested?.default
                ? map(rows, row => ({
                    ...row,
                    ...(row.id === id ? landed : {}),
                    default: row.id === id
                  }))
                : map(rows, row =>
                    row.id === id ? { ...row, ...landed } : row
                  )
            );
        }
        return;
      }

      // A write to the collection itself: a bulk replace takes the recording's
      // own rows; a creation appends the recorded created row, as sent, to
      // every capture that narrowed nothing.
      if (shape === collection && (verb === "PUT" || verb === "PATCH")) {
        const replaced = replacedRows(source, verb, pathname);
        if (!replaced) return;

        for (const name of capturesAt(pathname)) land(name, () => replaced);
        return;
      }
      if (shape === collection && verb === "POST") {
        const recorded = createdRow(source, pathname);
        if (!recorded) return;

        const created = {
          ...recorded,
          ...requested,
          // Distinct by construction: the capture created the recorded row,
          // so its id names a committed row and a verbatim append collides.
          id: `${recorded.id}:${Date.now()}`
        };

        for (const name of capturesAt(pathname))
          land(
            name,
            rows => (isUnfiltered(name) ? [...rows, created] : rows),
            1
          );
      }
    }
  };
}

/** The row the module's own POST recording created, if it carries one. */
/** A full-set write on the collection itself: the rows its recorded answer carries. */
function replacedRows(
  source: CorpusBodies,
  method: string,
  pathname: string
): WireRecord[] | undefined {
  const recording = find(
    matching(source, method, pathname),
    fixture => fixture.response.status < REFUSED_FROM
  );
  const data = (recording?.response.body as { data?: unknown } | undefined)
    ?.data;
  return isArray(data) ? (data as WireRecord[]) : undefined;
}

function createdRow(
  source: CorpusBodies,
  pathname: string
): WireRecord | undefined {
  const [recording] = matching(source, "POST", pathname);
  const data = (recording?.response.body as { data?: unknown } | undefined)
    ?.data;

  return isArray(data) ? undefined : (data as WireRecord | undefined);
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
 * The msw resolver that answers from a corpus session: the recording of this
 * request, the request's own body read once so a write is answered by the
 * recording of the SAME write and, once served, lands where the next read is
 * answered from. A request no recording answers is passed through.
 */
export function corpusReplayResolver(
  session: CorpusSession
): HttpResponseResolver {
  return async ({ request }) => {
    const url = new URL(request.url);
    const sent = await request
      .clone()
      .json()
      .catch(() => undefined);
    const answer = resolveCorpusRequest(
      session.bodies(),
      request.method,
      url,
      sent
    );

    if (!answer) return passthrough();

    if (answer.status < REFUSED_FROM)
      session.apply(request.method, url, sent, answer.body);

    return isUndefined(answer.body)
      ? new HttpResponse(null, { status: answer.status })
      : HttpResponse.json(answer.body as JsonBodyType, {
          status: answer.status
        });
  };
}

/**
 * The handlers a replay is armed with: one `http.all` per route, all answering
 * from one session, so what a track writes is what its next read sees. Routes
 * default to the whole API; the labs page narrows them to the routes the
 * module's own feature declares.
 */
export function createCorpusReplayHandlers(
  session: CorpusSession,
  routes: readonly string[] = ["*/api/*"]
): HttpHandler[] {
  const resolve = corpusReplayResolver(session);

  return map(routes, route => http.all(route, resolve));
}
