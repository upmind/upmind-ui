// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices replay — a client id names WHOSE corpus, not which
 * rows within it
 *
 * ## Job To Be Done
 * The playground replays a module's committed recordings. `servedCollection`
 * applies every `filter[...]` the live page carries to the recorded rows — and
 * a capture run is ONE client's session, so every row it recorded carries that
 * client's id.
 *
 * This module re-asserts its scope on every criteria write
 * (`withDurableClientId`, AC-12's durable `.for(client, id)` retarget), so
 * `filter[client_id]` rides on every request the page makes and cannot be
 * cleared from the UI. Filtered as a row predicate, it removes every recorded
 * row: the playground draws "No results found" over a 25-row corpus, and every
 * filter/sort scene then acts on nothing.
 *
 * ## What Breaks If These Fail
 * Every scenario on every scoped collection playground replays an empty list —
 * the page reports 0 of 0 while its own corpus sits fully recorded beside it.
 */

import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { readFileSync, readdirSync } from "node:fs";
import { filter, fromPairs, includes, map, size, uniq } from "lodash-es";
import { resolveCorpusRequest } from "@upmind-automation/test-fixtures/corpus-replay";
import type { CorpusBodies } from "@upmind-automation/test-fixtures/corpus-replay";

// -----------------------------------------------------------------------------

const FIXTURES = join(import.meta.dirname, "fixtures");

/** The module's committed recordings, as the playground loads them. */
const bodies = fromPairs(
  map(
    filter(readdirSync(FIXTURES), name => includes(name, ".json")),
    name =>
      [
        name.replace(".json", ""),
        JSON.parse(readFileSync(join(FIXTURES, name), "utf-8"))
      ] as const
  )
) as unknown as CorpusBodies;

/** The client every row in the corpus was recorded under. */
const RECORDED_CLIENT = "25d96e76-3ed0-913d-d52c-417482528340";
/** A different client — what a live page scoped elsewhere puts on the wire. */
const OTHER_CLIENT = "04038696-e547-21d4-93ef-e18d9305e7d2";

const listUrl = (clientId: string) =>
  new URL(
    `https://api.upmind.io/api/invoices?order=-create_datetime&limit=10&offset=0&filter[client_id]=${clientId}`
  );

const rowsFor = (clientId: string) => {
  const answer = resolveCorpusRequest(bodies, "GET", listUrl(clientId));
  return (answer?.body as { data?: unknown[] } | undefined)?.data ?? [];
};

describe("invoices replay — a client id is the corpus's identity", () => {
  it("answers a read scoped to ANOTHER client with the recorded rows", () => {
    expect(size(rowsFor(OTHER_CLIENT))).toBeGreaterThan(0);
  });

  it("answers the recording client's own read identically", () => {
    expect(size(rowsFor(OTHER_CLIENT))).toBe(size(rowsFor(RECORDED_CLIENT)));
  });

  it("still narrows on a real row filter — the exemption is identity only", () => {
    const narrowed = resolveCorpusRequest(
      bodies,
      "GET",
      new URL(
        `${listUrl(OTHER_CLIENT).toString()}&filter[status.code]=invoice_paid`
      )
    );
    const rows =
      (narrowed?.body as { data?: { status?: { code?: string } }[] })?.data ??
      [];

    // Content, not count: both reads are capped at the same page limit, so a
    // size comparison proves nothing about narrowing.
    expect(size(rows)).toBeGreaterThan(0);
    expect(uniq(map(rows, row => row.status?.code))).toEqual(["invoice_paid"]);
  });
});
