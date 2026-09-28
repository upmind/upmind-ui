// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — quick search debounces, writes filter[number|eq],
 * and lives alongside an active filter (AC-11)
 *
 * ## Job To Be Done
 * Prove `filters.query(term)` — the quick-search member — debounces 250ms
 * (design 8.3, D-8: the oracle's own 250ms, never the shared 350ms
 * constant), writes `filter[number|eq]`, NEVER a bare `query=` param, resets
 * the page to offset 0, and — driven with the SAME order number staging
 * recorded — resolves through the replay server's real per-request matcher
 * to that fixture's own total (closing the loop, same discipline as
 * `client-orders.dotted-operators.int.test.ts`). Also proves search and an
 * active `status.code` filter live TOGETHER on the wire: writing one never
 * evicts the other (design 8.3 write rules — each named setter keeps the
 * live `number.eq` leaf when its own intent does not name it).
 *
 * ## What Breaks If These Fail
 * A search-as-you-type box that fires a request per keystroke floods the
 * platform; a search that clobbers an active status filter (or vice versa)
 * silently narrows what a client believed they were viewing.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useClientOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  captured,
  filterPatch,
  observeOrderRequests,
  recordedParam,
  seedClientSession
} from "./client-orders.int-helpers";
import type { ClientOrderStatusChoice } from "..";
import "./setup.integration";

// -----------------------------------------------------------------------------

async function bootSelfCollection() {
  await seedClientSession();
  const orders = useClientOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders;
}

const SEARCH_TERM = recordedParam(
  "get-invoices-case-orders-search",
  "filter[number|eq]"
);
const STATUS_NEQ_VALUE: ClientOrderStatusChoice = "invoice_cancelled";

let orders: Awaited<ReturnType<typeof bootSelfCollection>>;

describe("client-orders — quick search debounces and writes filter[number|eq] (AC-11)", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    orders = await bootSelfCollection();
  }, 30000);

  afterEach(() => {
    vi.useRealTimers();
  });

  it("no request fires before 250ms, and exactly one fires at 250ms, carrying filter[number|eq] with the recorded term (never query=)", async () => {
    const observed = observeOrderRequests();
    const requestCountBefore = observed.all().length;

    orders.useActions().filters.query(SEARCH_TERM);

    await vi.advanceTimersByTimeAsync(249);
    expect(observed.all().length).toBe(requestCountBefore);

    await vi.advanceTimersByTimeAsync(2);
    await vi.waitFor(() =>
      expect(observed.all().length).toBe(requestCountBefore + 1)
    );
    expect(observed.latestParams().get("filter[number|eq]")).toBe(SEARCH_TERM);
    expect(observed.latestParams().has("query")).toBe(false);
    await vi.waitFor(() =>
      expect(orders.useContext().pagination.value?.total).toBe(
        captured("get-invoices-case-orders-search").total
      )
    );
  });

  it("a search on offset 10 sends offset=0", async () => {
    const observed = observeOrderRequests();

    orders.useActions().setPage(2);
    await vi.advanceTimersByTimeAsync(0);
    await vi.waitFor(() =>
      expect(observed.latestParams().get("offset")).toBe("10")
    );

    orders.useActions().filters.query(SEARCH_TERM);
    await vi.advanceTimersByTimeAsync(250);

    await vi.waitFor(() =>
      expect(observed.latestParams().get("offset")).toBe("0")
    );
    expect(observed.latestParams().get("filter[number|eq]")).toBe(SEARCH_TERM);
  });
});

describe("client-orders — search and an active filter live together on the wire (AC-11)", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    orders = await bootSelfCollection();
  }, 30000);

  afterEach(() => {
    vi.useRealTimers();
  });

  it("a status filter, THEN a search: both keys stay on the wire", async () => {
    const observed = observeOrderRequests();

    orders
      .useInternals()
      .query.setCriteria(
        filterPatch("status.code", { neq: [STATUS_NEQ_VALUE] })
      );
    await vi.waitFor(() =>
      expect(observed.latestParams().has("filter[status.code|neq]")).toBe(true)
    );

    orders.useActions().filters.query(SEARCH_TERM);
    await vi.advanceTimersByTimeAsync(250);

    await vi.waitFor(() =>
      expect(observed.latestParams().has("filter[number|eq]")).toBe(true)
    );
    expect(observed.latestParams().has("filter[status.code|neq]")).toBe(true);
    expect(observed.latestParams().get("filter[number|eq]")).toBe(SEARCH_TERM);
    expect(observed.latestParams().get("filter[status.code|neq]")).toBe(
      STATUS_NEQ_VALUE
    );
  });

  it("a search, THEN a status filterBy: both keys stay on the wire", async () => {
    const observed = observeOrderRequests();

    orders.useActions().filters.query(SEARCH_TERM);
    await vi.advanceTimersByTimeAsync(250);
    await vi.waitFor(() =>
      expect(observed.latestParams().has("filter[number|eq]")).toBe(true)
    );

    orders
      .useActions()
      .filterBy(
        filterPatch("status.code", { neq: [STATUS_NEQ_VALUE] }).filters!
      );
    await vi.waitFor(() =>
      expect(observed.latestParams().has("filter[status.code|neq]")).toBe(true)
    );
    expect(observed.latestParams().has("filter[number|eq]")).toBe(true);
    expect(observed.latestParams().get("filter[number|eq]")).toBe(SEARCH_TERM);
  });
});
