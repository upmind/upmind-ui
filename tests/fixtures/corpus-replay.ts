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
  endsWith,
  every,
  filter,
  find,
  findKey,
  first,
  get,
  isArray,
  isEmpty,
  isEqual,
  isMatch,
  isNil,
  isNumber,
  isPlainObject,
  isUndefined,
  keys,
  last,
  map,
  orderBy,
  reject,
  size,
  sortBy,
  split,
  startsWith,
  take,
  toLower,
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
  at?: RecordedFixture
): WireRecord[] {
  const reads = filter(values(bodies), isCollectionRead);
  const resource = at
    ? collectionOf(at)
    : collectionOf(
        find(reads, fixture => fixtureShape(fixture) === collectionShape(reads))
      );

  const captures = sortBy(
    filter(reads, fixture => collectionOf(fixture) === resource),
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

function hasOffset(fixture: RecordedFixture): boolean {
  const [, search = ""] = split(fixture.request.path, "?");

  return new URLSearchParams(search).has("offset");
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
export function servedRows(
  bodies: CorpusBodies,
  params: URLSearchParams,
  at?: RecordedFixture
): WireRecord[] {
  let rows = corpusRows(bodies, at);

  for (const [key, value] of params.entries()) {
    const [, column, operator = "eq"] = FILTER_KEY.exec(key) ?? [];
    if (!column) continue;

    rows = applyFilter(rows, column, operator, value);
  }

  const order = params.get("order") ?? params.get("sort");
  if (order) {
    const descending = order.startsWith("-");
    rows = orderBy(
      rows,
      [descending ? order.slice(1) : order],
      [descending ? "desc" : "asc"]
    );
  }

  // The matched recording's `total` is the authority on how many rows its own
  // criteria match, and the pool cannot overrule it: a capture that says its
  // whole collection is one row answers with one, however many the module's
  // other captures of that endpoint saw.
  const total = recordedTotal(at);
  if (isNumber(total) && total < size(rows)) rows = take(rows, total);

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

  return rows.slice(offset, offset + limit);
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
  const recorded = pickRecording(candidates, searchParams, sent);

  if (!recorded) return undefined;

  if (!isCollectionRead(recorded)) return recorded.response;

  const envelope = envelopeOf(recorded);
  if (!envelope) return recorded.response;

  // The rows come from the collection the MATCHED recording was captured at,
  // not from the module's busiest one. A module reading several collections
  // holds a distinct set per resource, and drawing from the wrong one answers a
  // read of countries with a list of addresses.
  const rows = servedRows(bodies, searchParams, recorded);

  return {
    status: recorded.response.status,
    body: { ...envelope, data: rows, total: collectionTotal(recorded, rows) }
  };
}

/**
 * The `total` a served collection states. The recording's own where it names
 * one LARGER than the rows any capture pooled — `client-email-history` holds 30
 * rows of a 3112-row history, and a `total` of 10 would tell the pager there is
 * no next page — else the rows actually served, which is the whole collection
 * once the pool holds it (and follows a write that added or removed a row).
 */
function collectionTotal(
  recorded: RecordedFixture | undefined,
  rows: WireRecord[]
): number {
  const stated = recordedTotal(recorded);

  return isNumber(stated) && stated > size(rows) ? stated : size(rows);
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
  sent?: unknown
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
    ? answersWrite(candidates, sent)
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
  sent: unknown
): RecordedFixture | undefined {
  const recorded = filter(candidates, fixture =>
    isPlainObject(fixture.request.body)
  );

  // The EXACT write takes its own recording whatever staging answered — a
  // refusal included: this brand refused `preferred_payment_currency_id`, and
  // a page saving it is told so, as staging told the capture run. Only the
  // looser match is kept to served answers, so a superset save is never
  // answered by a refusal recorded for a different body.
  return (
    find(recorded, fixture => isEqual(fixture.request.body, sent)) ??
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

/** One paged capture carrying the rows the session holds. */
function withRows(
  fixture: RecordedFixture,
  rows: WireRecord[]
): RecordedFixture {
  return {
    ...fixture,
    response: {
      ...fixture.response,
      body: {
        ...(fixture.response.body as object),
        data: rows,
        total: collectionTotal(fixture, rows)
      }
    }
  };
}

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
  let rows: WireRecord[] = corpusRows(source);

  const pages = pagedFixtureNames(source);

  // A single-record module: the write lands on the ONE record its form reads,
  // so the re-read after a save shows what was saved — a form that saved
  // "off" and re-read "on" would be the replay contradicting itself.
  const hasCollection = !!collectionShape(
    filter(values(source), isCollectionRead)
  );
  const memberName = hasCollection ? undefined : memberReadName(source);
  let member: WireRecord | undefined = memberName
    ? (source[memberName].response.body as WireEnvelope<WireRecord>).data
    : undefined;

  return {
    // The resolver's ONE source of rows is the paged captures concatenated,
    // which it re-slices by the request's own cursor — so the session carries
    // its whole collection in the first and empties the rest, rather than
    // inventing a paging it was never recorded with.
    bodies: () => {
      const replayed: Record<string, RecordedFixture> = { ...source };

      for (const [index, name] of pages.entries())
        replayed[name] = withRows(source[name], index === 0 ? rows : []);

      if (memberName && member)
        replayed[memberName] = withRecord(source[memberName], member);

      return replayed;
    },

    // What lands is the WRITE the wire accepted — the addressed row, the
    // request's own values — never a recording's row verbatim: the recordings
    // were captured against each other, so their ids collide with the very
    // rows they would land beside (a POST recording IS one of the committed
    // rows), and a set-default recording names whichever row was default at
    // capture time. Served BODIES stay the recordings' own (S13); this is only
    // the collection the next read is answered from.
    apply(method, url, body, answered) {
      const { pathname } = url;
      const requested = body as Partial<WireRecord> | undefined;
      const verb = toUpper(method);

      const collection = collectionShape(
        filter(values(source), isCollectionRead)
      );
      const shape = shapeOf(pathname);

      // The single record a form edits: what lands is the record staging
      // RETURNED for this write (the recording's own `data`), else the request's
      // values — so the re-read shows exactly what the form was shown.
      if (
        !collection &&
        memberName &&
        shape === fixtureShape(source[memberName]) &&
        (verb === "PUT" || verb === "PATCH")
      ) {
        const returned: unknown = get(answered, "data");

        member = {
          ...member,
          ...(isPlainObject(returned) ? (returned as WireRecord) : requested)
        };
        return;
      }

      // A member sits one id segment below the collection it belongs to.
      if (collection && shape === `${collection}/:id`) {
        const id = last(split(pathname, "/"));

        if (verb === "DELETE") rows = reject(rows, ["id", id]);
        if (verb === "PUT" || verb === "PATCH") {
          rows = requested?.default
            ? map(rows, row => ({ ...row, default: row.id === id }))
            : map(rows, row =>
                row.id === id ? { ...row, ...requested } : row
              );
        }
        return;
      }

      if (shape === collection && (verb === "PUT" || verb === "PATCH")) {
        rows = replacedRows(source, verb, pathname) ?? rows;
        return;
      }
      if (shape === collection && verb === "POST") {
        const recorded = createdRow(source, pathname);
        if (!recorded) return;

        rows = [
          ...rows,
          {
            ...recorded,
            ...requested,
            // Distinct by construction: the capture created the recorded row,
            // so its id names a committed row and a verbatim append collides.
            id: `${recorded.id}:${size(rows)}`
          }
        ];
      }
    }
  };
}

/** The fixture names of the collection's paged captures, in recorded-offset order. */
function pagedFixtureNames(source: CorpusBodies): string[] {
  const reads = filter(values(source), isCollectionRead);
  const collection = collectionShape(reads);

  const named = filter(
    keys(source),
    name =>
      isCollectionRead(source[name]) &&
      fixtureShape(source[name]) === collection &&
      hasOffset(source[name])
  );

  return sortBy(named, name => offsetOf(source[name]));
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
