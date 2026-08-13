// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/corpus
 * @description The ONE resolver over the recorded client-email corpus — the
 * param branching (`filter[col|op]`, `order`, `limit`/`offset` over the recorded
 * 3 rows) both lanes call: the force worker's handlers and the browser lane's
 * `page.route` adapter (`tests/e2e/recorded-corpus.ts`). Two copies of the
 * branching would be two behaviours. One copy is also what makes a filter/sort
 * read-back falsifiable — rows can only narrow or reorder if the criteria
 * reached the wire, so a client-side-only filter leaves the served rows
 * untouched.
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

import { corpusBodies, isCorpusSourceResolved } from "./corpus.source";
import {
  filter,
  find,
  get,
  last,
  map,
  orderBy,
  reject,
  split
} from "lodash-es";
import type {
  CorpusBodies,
  CorpusFixtureName,
  RecordedFixture
} from "./corpus.source.types";

// -----------------------------------------------------------------------------

/**
 * One email as the recorded wire carries it: the four columns the criteria
 * surface filters on, plus the rest of the recording passed through untouched
 * (`order` may name any recorded column, and nothing is dropped on the way out).
 */
export type WireEmail = {
  email: string;
  default: boolean;
  verified: boolean;
  bounced: boolean;
  [column: string]: unknown;
};

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
 * re-reads, and the identical three recorded rows come back. That is what made
 * replay cosmetic (`R7-4`): only the criteria scenes (filter, sort) reached the
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
  apply: (method: string, url: URL) => void;
};

const BOOLEAN_COLUMNS = ["verified", "bounced", "default"] as const;

const COLLECTION_PATH = /\/clients\/[^/]+\/emails$/;

const MEMBER_PATH = /\/clients\/[^/]+\/emails\/[^/]+$/;

const VERIFY_PATH = /\/clients\/[^/]+\/emails\/[^/]+\/send_verify$/;

const envelope = (
  bodies: CorpusBodies,
  name: CorpusFixtureName
): WireEnvelope<WireEmail[]> =>
  bodies[name].response.body as WireEnvelope<WireEmail[]>;

// -----------------------------------------------------------------------------

/**
 * The recorded bodies as APP RUNTIME may reach them, or `undefined` while `ESC6`
 * is unruled — the seam throws rather than improvise a body, so the guard is
 * read here once and forcing simply has no corpus to arm on. Live carries the
 * page in the meantime, which is the default it boots into anyway (`S12`).
 */
export function runtimeCorpus(): CorpusBodies | undefined {
  return isCorpusSourceResolved ? corpusBodies() : undefined;
}

/**
 * The recorded 3-row collection: the account's own verified default plus the two
 * addresses the capture run created. Both halves are verbatim recordings; the
 * concatenation is the one the integration kit's own filtered handler builds.
 */
export function corpusRows(bodies: CorpusBodies): WireEmail[] {
  return [
    ...envelope(bodies, "get-clients-id-emails-case-page-1").data,
    ...envelope(bodies, "get-clients-id-emails-case-page-2").data
  ];
}

/** Applies the request's own criteria to the recorded corpus. */
export function servedRows(
  bodies: CorpusBodies,
  params: URLSearchParams
): WireEmail[] {
  let rows = corpusRows(bodies);

  for (const column of BOOLEAN_COLUMNS) {
    const value = params.get(`filter[${column}|eq]`);
    if (value === "1") rows = filter(rows, row => row[column] === true);
    else if (value === "0") rows = filter(rows, row => row[column] === false);
  }

  const like = params.get("filter[email|like]");
  if (like) {
    const needle = like.replace(/%/g, "").toLowerCase();
    rows = filter(rows, row => row.email.toLowerCase().includes(needle));
  }

  const order = params.get("order");
  if (order) {
    const descending = order.startsWith("-");
    rows = orderBy(
      rows,
      [descending ? order.slice(1) : order],
      [descending ? "desc" : "asc"]
    );
  }

  const offset = Number(params.get("offset") ?? 0);
  const limit = Number(params.get("limit") ?? rows.length);

  return rows.slice(offset, offset + limit);
}

/**
 * Resolves one request to its recorded answer, or `undefined` when the path is
 * not one of this module's own — the caller passes those through (`AC8.3`).
 *
 * Each recording is self-describing, so the branching is the module's paths and
 * nothing more: the status and the body served are the ones staging returned.
 */
export function resolveCorpusRequest(
  bodies: CorpusBodies,
  method: string,
  url: URL
): CorpusResponse | undefined {
  const { pathname, searchParams } = url;

  if (VERIFY_PATH.test(pathname))
    return bodies["patch-clients-id-emails-id-send-verify"].response;

  if (MEMBER_PATH.test(pathname)) {
    if (method === "GET") return bodies["get-clients-id-emails-id"].response;
    if (method === "DELETE")
      return bodies["delete-clients-id-emails-id"].response;
    if (method === "PUT")
      return searchParams.has("case")
        ? bodies["put-clients-id-emails-id-case-set-default"].response
        : bodies["put-clients-id-emails-id"].response;
  }

  if (COLLECTION_PATH.test(pathname)) {
    if (method === "POST") return bodies["post-clients-id-emails"].response;
    if (method === "GET") {
      const rows = servedRows(bodies, searchParams);
      const page = bodies["get-clients-id-emails-case-page-1"].response;

      return {
        status: page.status,
        body: {
          ...envelope(bodies, "get-clients-id-emails-case-page-1"),
          data: rows,
          total: rows.length
        }
      };
    }
  }

  return undefined;
}

// -----------------------------------------------------------------------------

/** The row a mutation's recording carries; an acknowledgement carries none. */
function recordedRow(
  bodies: CorpusBodies,
  name: CorpusFixtureName
): WireEmail | undefined {
  return get(bodies[name].response, ["body", "data"]) as WireEmail | undefined;
}

/** The recorded row in place of the one it addresses, or appended if it is new. */
function upsert(rows: WireEmail[], row: WireEmail | undefined): WireEmail[] {
  if (!row) return rows;

  return find(rows, ["id", row.id])
    ? map(rows, current => (current.id === row.id ? row : current))
    : [...rows, row];
}

/** One paged capture carrying the rows the session holds. */
function withRows(
  fixture: RecordedFixture,
  rows: WireEmail[]
): RecordedFixture {
  return {
    ...fixture,
    response: {
      ...fixture.response,
      body: {
        ...(fixture.response.body as object),
        data: rows,
        total: rows.length
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
  let rows: WireEmail[] = corpusRows(source);

  return {
    // The resolver's ONE source of rows is the two paged captures concatenated,
    // which it re-slices by the request's own cursor — so the session carries
    // its whole collection in the first and empties the second, rather than
    // inventing a paging it was never recorded with.
    bodies: () => ({
      ...source,
      "get-clients-id-emails-case-page-1": withRows(
        source["get-clients-id-emails-case-page-1"],
        rows
      ),
      "get-clients-id-emails-case-page-2": withRows(
        source["get-clients-id-emails-case-page-2"],
        []
      )
    }),

    apply(method, url) {
      const { pathname } = url;

      if (MEMBER_PATH.test(pathname)) {
        const id = last(split(pathname, "/"));

        if (method === "DELETE") rows = reject(rows, ["id", id]);
        if (method === "PUT")
          rows = upsert(rows, recordedRow(source, "put-clients-id-emails-id"));
        return;
      }

      if (COLLECTION_PATH.test(pathname) && method === "POST")
        rows = upsert(rows, recordedRow(source, "post-clients-id-emails"));
    }
  };
}
