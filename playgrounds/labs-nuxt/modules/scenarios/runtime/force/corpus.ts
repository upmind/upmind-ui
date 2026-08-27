// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/corpus
 * @description The ONE resolver over a module's recorded corpus — the param
 * branching (`filter[col|op]`, `order`, `limit`/`offset` over the recorded rows)
 * both lanes call: the force worker's handlers and the browser lane's
 * `page.route` adapter. Two copies of the branching would be two behaviours. One
 * copy is also what makes a filter/sort read-back falsifiable — rows can only
 * narrow or reorder if the criteria reached the wire, so a client-side-only
 * filter leaves the served rows untouched.
 *
 * UN-PINNED (FE-3113). Every branch was `client-email`'s: a fixture-name union,
 * three email path regexes, and a boolean-column list naming that module's own
 * columns. All three are gone. What replaced them is the thing the recordings
 * already carried — each one states its own `request.method`, `request.path` and
 * `response`, so the resolver MATCHES rather than knows: an incoming request
 * finds the recording captured at the same endpoint shape and method, and the
 * criteria branching reads the OPERATOR out of `filter[col|op]` instead of a
 * list of that module's columns.
 *
 * Bodies arrive as an ARGUMENT, never as bytes this module holds: app runtime's
 * source is the `ESC6` seam (`runtimeCorpus()`), the browser lane's is its own
 * lawful read of the same committed files. No headless test-kit specifier is
 * named here — eslint 8g reds one outside the four test-lane globs, and `lint`
 * is a gate — and no response literal appears either: every served status and
 * body is the recording's own (`S13` · `AC8.5`).
 *
 * Browser-safe by construction: no `node:fs`, no `node:path`.
 */

import {
  getCorpusBodies,
  isModuleResolved,
  loadCorpusBodies
} from "./corpus.source";
import {
  filter,
  find,
  first,
  isArray,
  isEqual,
  keys,
  last,
  map,
  orderBy,
  reject,
  size,
  sortBy,
  split,
  toLower,
  toUpper,
  values
} from "lodash-es";
import type { RecordedFixture } from "./corpus.source.types";

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
  /** Lands a served mutation on the collection the next read is answered from. */
  apply: (method: string, url: URL, body?: unknown) => void;
};

/**
 * The module a page has armed on. Set by {@link armCorpusModule} before a
 * preset can reach the handlers, so the transport-free resolver keeps taking its
 * bodies as an ARGUMENT and only the runtime-default lookup needs to know which
 * module the page is.
 *
 * ONE at a time by construction: there is one worker per tab and one scenario
 * per page, so a second module armed is the first one released.
 */
let armedModule: string | undefined;

/** A recorded id segment: a uuid, or the capture run's own `mock-uuid-N` stand-in. */
const IDENTIFIER =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|mock-uuid-\d+)$/i;

const FILTER_KEY = /^filter\[([^\]|]+)(?:\|([^\]]+))?\]$/;

/** The truthy spelling a recorded boolean filter uses on the wire. */
const TRUE_VALUES = ["1", "true"];

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

function methodOf(fixture: RecordedFixture): string {
  return toUpper(fixture.request.method);
}

function envelopeOf(
  fixture: RecordedFixture
): WireEnvelope<WireRecord[]> | undefined {
  const body = fixture.response.body as WireEnvelope<unknown> | undefined;

  return isArray(body?.data) ? (body as WireEnvelope<WireRecord[]>) : undefined;
}

/** A successful read whose body carries rows — the collection captures. */
function isCollectionRead(fixture: RecordedFixture): boolean {
  return (
    methodOf(fixture) === "GET" &&
    fixture.response.status < 400 &&
    !!envelopeOf(fixture)
  );
}

/** The recorded `offset` a paged capture was taken at, for ordering the pages. */
function offsetOf(fixture: RecordedFixture): number {
  const [, search = ""] = split(fixture.request.path, "?");

  return Number(new URLSearchParams(search).get("offset") ?? 0);
}

// -----------------------------------------------------------------------------

/**
 * Loads `module`'s recordings and makes them the corpus {@link runtimeCorpus}
 * answers with. Awaited by the page that resolved the scenario, BEFORE a preset
 * can arm — the seam's loaders are lazy, so a synchronous read of an unloaded
 * module would find nothing and force would silently degrade to Live.
 *
 * A module the seam does not reach arms nothing and leaves the page Live, which
 * is the state it boots into anyway (`S12`).
 *
 * @param module The module whose recordings this page forces over.
 */
export async function armCorpusModule(module: string): Promise<boolean> {
  if (!isModuleResolved(module)) return false;

  await loadCorpusBodies(module);
  armedModule = module;

  return true;
}

/**
 * The recorded bodies as APP RUNTIME may reach them, or `undefined` while no
 * module is armed or while `ESC6` is unruled — the seam throws rather than
 * improvise a body, so the guard is read here once and forcing simply has no
 * corpus to arm on. Live carries the page in the meantime (`S12`).
 *
 * @param module Which module's corpus, defaulting to the armed one.
 */
export function runtimeCorpus(
  module: string | undefined = armedModule
): CorpusBodies | undefined {
  if (!module || !isModuleResolved(module)) return undefined;

  return getCorpusBodies(module) as CorpusBodies | undefined;
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
 * The module's whole recorded collection: every paged capture of its collection
 * endpoint, concatenated in recorded-offset order. Both halves are verbatim
 * recordings; the concatenation is the one a module's own integration kit
 * builds.
 *
 * Pages are matched by endpoint, so a module captured at one page has one page
 * and a module captured at three has three — nothing is authored to pad either.
 */
export function corpusRows(bodies: CorpusBodies): WireRecord[] {
  const reads = filter(values(bodies), isCollectionRead);
  const deepest = collectionShape(reads);

  const pages = sortBy(
    filter(reads, fixture => fixtureShape(fixture) === deepest),
    offsetOf
  );

  // Distinct pages only: a module captured at several criteria over the SAME
  // endpoint holds many recordings of it, and concatenating all of them would
  // serve the same row several times over. A page is one the run took at its own
  // offset; the rest are the same rows under a filter.
  const paged = filter(pages, fixture => hasOffset(fixture));

  return concatRows(size(paged) ? paged : pages.slice(0, 1));
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
 */
export function servedRows(
  bodies: CorpusBodies,
  params: URLSearchParams
): WireRecord[] {
  let rows = corpusRows(bodies);

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

  const offset = Number(params.get("offset") ?? 0);
  const limit = Number(params.get("limit") ?? size(rows));

  return rows.slice(offset, offset + limit);
}

function applyFilter(
  rows: WireRecord[],
  column: string,
  operator: string,
  value: string
): WireRecord[] {
  if (operator === "like") {
    const needle = toLower(value.replace(/%/g, ""));

    return filter(rows, row =>
      toLower(String(row[column] ?? "")).includes(needle)
    );
  }

  if (operator === "neq")
    return reject(rows, row => matchesValue(row[column], value));

  return filter(rows, row => matchesValue(row[column], value));
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
  url: URL
): CorpusResponse | undefined {
  const { pathname, searchParams } = url;

  const candidates = matching(bodies, method, pathname);
  const recorded = pickRecording(candidates, searchParams);

  if (!recorded) return undefined;

  if (!isCollectionRead(recorded)) return recorded.response;

  const envelope = envelopeOf(recorded);
  if (!envelope) return recorded.response;

  const rows = servedRows(bodies, searchParams);

  return {
    status: recorded.response.status,
    body: { ...envelope, data: rows, total: size(rows) }
  };
}

/**
 * Which of the endpoint's recordings answers this request. A `case=` label is
 * the capture run's own name for a variant, so a request carrying one is
 * answered by the recording captured under it.
 *
 * Everything else takes the endpoint's first SUCCESSFUL capture. A corpus may
 * hold a recorded refusal at the very endpoint it also reads successfully
 * (client-phone's 500 on a `number|like` filter is the standing case), and
 * serving that to every unqualified request would leave the page permanently
 * errored — a forced failure nobody armed. The refusal is still reached, by the
 * preset named for it; picking it here would be the resolver forcing a state.
 */
function pickRecording(
  candidates: RecordedFixture[],
  params: URLSearchParams
): RecordedFixture | undefined {
  const requestedCase = params.get("case");

  if (requestedCase) {
    const labelled = find(candidates, fixture => {
      const [, search = ""] = split(fixture.request.path, "?");

      return new URLSearchParams(search).get("case") === requestedCase;
    });

    if (labelled) return labelled;
  }

  return (
    find(candidates, fixture => fixture.response.status < 400) ??
    first(candidates)
  );
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
        total: size(rows)
      }
    }
  };
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

  return {
    // The resolver's ONE source of rows is the paged captures concatenated,
    // which it re-slices by the request's own cursor — so the session carries
    // its whole collection in the first and empties the rest, rather than
    // inventing a paging it was never recorded with.
    bodies: () => {
      const replayed: Record<string, RecordedFixture> = { ...source };

      for (const [index, name] of pages.entries())
        replayed[name] = withRows(source[name], index === 0 ? rows : []);

      return replayed;
    },

    // What lands is the WRITE the wire accepted — the addressed row, the
    // request's own values — never a recording's row verbatim: the recordings
    // were captured against each other, so their ids collide with the very
    // rows they would land beside (a POST recording IS one of the committed
    // rows), and a set-default recording names whichever row was default at
    // capture time. Served BODIES stay the recordings' own (S13); this is only
    // the collection the next read is answered from.
    apply(method, url, body) {
      const { pathname } = url;
      const requested = body as Partial<WireRecord> | undefined;
      const verb = toUpper(method);

      const collection = collectionShape(
        filter(values(source), isCollectionRead)
      );
      const shape = shapeOf(pathname);

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
function createdRow(
  source: CorpusBodies,
  pathname: string
): WireRecord | undefined {
  const [recording] = matching(source, "POST", pathname);
  const data = (recording?.response.body as { data?: unknown } | undefined)
    ?.data;

  return isArray(data) ? undefined : (data as WireRecord | undefined);
}
