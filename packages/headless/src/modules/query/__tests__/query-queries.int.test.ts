// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview useQuery().query() / list() multi-entry reads (fixture-replayed)
 *
 * ## Job To Be Done
 * `query({ queries })` and `list({ queries })` run every entry in parallel
 * through TanStack's `useQueries`, and `select` is its `combine`: it receives
 * every entry's data and envelope in entry order and returns the one `data`
 * the handle publishes. `list()` keeps its page window on every entry and
 * reads `total` from entry one. Each answer is the staging recording of that
 * exact request.
 *
 * ## What Breaks If These Fail
 * A module that needs two reads for one question falls back to a hand join
 * across its layers (the `comp-single-query` breach), or the stitched `data`
 * lands before every entry has answered.
 */

import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";
import { useQuery } from "..";
import { observeRequests } from "../../../__tests__/criteria-int-kit";
import { queryClient } from "../client";
import { useUrl } from "../../../utils";
import { filter, map } from "lodash-es";
import type { Envelope } from "../../../__tests__/criteria-int-kit";
import type { JsonSchema7 } from "@jsonforms/core";

// -----------------------------------------------------------------------------

type Country = { id: string; name: string; code: string };

const recordingsDir = join(import.meta.dirname, "fixtures");
const server = startReplayServer({ recordingsDir });

const COUNTRIES = getFixtureBody<Envelope<Country[]>>("get-countries", {
  recordingsDir
});
const COUNT = getFixtureBody<Envelope<unknown[]>>("get-countries-limit-count", {
  recordingsDir
});
const PAGE_1 = getFixtureBody<Envelope<Country[]>>(
  "get-countries-case-page-1",
  {
    recordingsDir
  }
);

const isCountriesRead = ({ url }: { url: string }) =>
  new URL(url).pathname.endsWith("/countries");

function countUrl() {
  const url = useUrl("countries");
  url.searchParams.set("limit", "count");
  return url;
}

function pageUrl() {
  const url = useUrl("countries");
  url.searchParams.set("case", "page-1");
  return url;
}

/** The page window the `case=page-1` recording was captured with. */
const pagedSchema: JsonSchema7 = {
  type: "object",
  properties: {
    pagination: {
      type: "object",
      properties: {
        limit: { type: "integer", default: 2 },
        offset: { type: "integer", default: 0 }
      }
    }
  }
};

let sent: ReturnType<typeof observeRequests> | undefined;

afterEach(() => {
  sent?.stop();
  queryClient.clear();
});

// -----------------------------------------------------------------------------

describe("useQuery().query({ queries }) — several entries, one select", () => {
  it("resolves data to the select over every entry's data and envelope", async () => {
    const read = useQuery().query<
      Country[],
      { rows: Country[]; total: number }
    >({
      queries: [
        { url: useUrl("countries"), queryKey: ["queries", "countries"] },
        { url: countUrl(), queryKey: ["queries", "countries", "count"] }
      ],
      select: ([rows], [, count]) => ({ rows, total: count.total ?? 0 })
    });

    await vi.waitFor(() =>
      expect(read.data.value).toEqual({
        rows: COUNTRIES.data,
        total: COUNT.total
      })
    );
  });

  it("publishes every entry's data in entry order when no select is given", async () => {
    const read = useQuery().query<Country[]>({
      queries: [
        { url: useUrl("countries"), queryKey: ["queries", "plain", "rows"] },
        { url: countUrl(), queryKey: ["queries", "plain", "count"] }
      ]
    });

    await vi.waitFor(() =>
      expect(read.data.value).toEqual([COUNTRIES.data, COUNT.data])
    );
  });

  it("sends one request per entry", async () => {
    sent = observeRequests(server, "/api/");

    const read = useQuery().query<Country[], number>({
      queries: [
        { url: useUrl("countries"), queryKey: ["queries", "wire", "rows"] },
        { url: countUrl(), queryKey: ["queries", "wire", "count"] }
      ],
      select: (_data, [, count]) => count.total ?? 0
    });
    await vi.waitFor(() => expect(read.data.value).toBe(COUNT.total));

    const limits = map(filter(sent.all(), isCountriesRead), request =>
      new URL(request.url).searchParams.get("limit")
    );
    expect(limits).toEqual(expect.arrayContaining([null, "count"]));
    expect(limits).toHaveLength(2);
  });

  it("stays pending until every entry has answered", async () => {
    const read = useQuery().query<Country[], number>({
      queries: [
        { url: useUrl("countries"), queryKey: ["queries", "pending", "rows"] },
        { url: countUrl(), queryKey: ["queries", "pending", "count"] }
      ],
      select: ([rows]) => rows.length
    });

    expect(read.isPending.value).toBe(true);
    await vi.waitFor(() => expect(read.isPending.value).toBe(false));
    expect(read.data.value).toBe(COUNTRIES.data.length);
    expect(read.isSuccess.value).toBe(true);
  });
});

describe("useQuery().list({ queries }) — the page window reaches every entry", () => {
  it("stitches the entries' rows and reads total from entry one", async () => {
    const read = useQuery().list<Country[], Array<Country & { twin: string }>>({
      queries: [
        { url: pageUrl(), queryKey: ["queries", "list", "left"] },
        { url: pageUrl(), queryKey: ["queries", "list", "right"] }
      ],
      criteria: { schema: pagedSchema },
      withoutBasket: true,
      select: ([left, right]) =>
        map(left, (row, index) => ({ ...row, twin: right[index].id }))
    });

    await vi.waitFor(() =>
      expect(read.data.value).toEqual(
        map(PAGE_1.data, row => ({ ...row, twin: row.id }))
      )
    );
    expect(read.pagination.value).toMatchObject({
      total: PAGE_1.total,
      limit: 2,
      page: 1
    });
  });

  it("sends the same limit and offset on every entry's wire", async () => {
    sent = observeRequests(server, "/api/");

    const read = useQuery().list<Country[]>({
      queries: [
        { url: pageUrl(), queryKey: ["queries", "list", "wire", "left"] },
        { url: pageUrl(), queryKey: ["queries", "list", "wire", "right"] }
      ],
      criteria: { schema: pagedSchema },
      withoutBasket: true
    });
    await vi.waitFor(() =>
      expect(read.data.value).toEqual([PAGE_1.data, PAGE_1.data])
    );

    const windows = map(filter(sent.all(), isCountriesRead), request => {
      const { searchParams } = new URL(request.url);
      return [searchParams.get("limit"), searchParams.get("offset")];
    });
    expect(windows).toEqual([
      ["2", "0"],
      ["2", "0"]
    ]);
  });
});
