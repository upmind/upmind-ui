// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the collection's own freshness controls (AC-1)
 *
 * ## Job To Be Done
 * Prove the three freshness members the playground page no longer draws
 * (operator ruling 2026-10-02): `useOrders().as('self')` invalidate, reset and
 * destroy. The list caches for a day (design 8.4), so a fresh read serves the
 * warm cache and sends no request. `invalidate()` marks the list stale, so the
 * active collection re-reads `GET api/invoices`. `reset()` drops the cached
 * list and redials, so a forced list stops being served and the recorded rows
 * return. `destroy()` removes the collection scope key, so no stale reader
 * remains.
 *
 * ## Provenance
 * The recorded default list capture, served on its own request. No
 * hand-authored body; the forced list is the recorded list with one row id
 * changed in the shared query cache (the labs force handle), never a network
 * answer.
 *
 * ## What Breaks If These Fail
 * A page that drives these controls keeps serving a stale or forced list for a
 * day, or leaks a destroyed collection into the scope registry.
 */

import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrders } from "..";
import { queryClient } from "../../query/client";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  observeOrderRequests,
  orderScopeKeys,
  seedClientSession,
  settle
} from "./orders.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const SENTINEL_ID = "forced-sentinel-row-id";

let observer: ReturnType<typeof observeOrderRequests>;

const listReads = () =>
  observer
    .all()
    .filter(request => new URL(request.url).pathname.endsWith("/api/invoices"));

async function bootCollection() {
  const orders = useOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders;
}

const firstRowId = (orders: Awaited<ReturnType<typeof bootCollection>>) =>
  (orders.useContext().data.value?.[0] as { id?: string } | undefined)?.id;

const isListQuery = (queryKey: readonly unknown[]): boolean =>
  queryKey[0] === "invoices" &&
  queryKey[1] === "orders" &&
  !queryKey.includes("order");

// The labs force handle: one row id changed in the live cache, never a request.
function forceSentinelRow(old: unknown): unknown {
  if (Array.isArray(old))
    return old.length ? [{ ...old[0], id: SENTINEL_ID }, ...old.slice(1)] : old;
  const envelope = old as { data?: unknown[] } | undefined;
  if (envelope && Array.isArray(envelope.data))
    return {
      ...envelope,
      data: envelope.data.length
        ? [
            { ...(envelope.data[0] as object), id: SENTINEL_ID },
            ...envelope.data.slice(1)
          ]
        : envelope.data
    };
  return old;
}

describe("orders — the collection's own freshness controls (AC-1)", () => {
  beforeEach(async () => {
    await seedClientSession();
    observer = observeOrderRequests();
  }, 30000);

  it("invalidate marks the day-cached list stale, so the collection reads it again", async () => {
    const orders = await bootCollection();
    const before = listReads().length;

    await orders.useActions().invalidate();

    await vi.waitFor(() => expect(listReads().length).toBe(before + 1));
    expect(orders.useContext().error.value).toBeUndefined();
  });

  it("reset drops the cached list, so a forced list stops being served", async () => {
    const orders = await bootCollection();

    queryClient.setQueriesData(
      { predicate: query => isListQuery(query.queryKey) },
      forceSentinelRow
    );
    await vi.waitFor(() => expect(firstRowId(orders)).toBe(SENTINEL_ID));
    const before = listReads().length;

    // Block the redial, so only a cache DROP (not a plain refetch) clears it.
    server?.use(
      http.get("*/api/invoices", () => HttpResponse.json({}, { status: 404 }))
    );
    await orders.useActions().reset();

    await vi.waitFor(() => expect(listReads().length).toBeGreaterThan(before));
    await vi.waitFor(() => expect(firstRowId(orders)).toBeUndefined());
  });

  it("reset redials, so the recorded rows return (AC-1)", async () => {
    const orders = await bootCollection();
    const recordedFirstId = firstRowId(orders);

    queryClient.setQueriesData(
      { predicate: query => isListQuery(query.queryKey) },
      forceSentinelRow
    );
    await vi.waitFor(() => expect(firstRowId(orders)).toBe(SENTINEL_ID));
    const before = listReads().length;

    await orders.useActions().reset();

    await vi.waitFor(() => expect(listReads().length).toBe(before + 1));
    await vi.waitFor(() => expect(firstRowId(orders)).toBe(recordedFirstId));
  });

  it("destroy removes the collection scope key and leaves no stale reader", async () => {
    const orders = await bootCollection();
    const before = orderScopeKeys();
    const reads = listReads().length;

    await orders.useActions().destroy();

    expect(orderScopeKeys().length).toBe(before.length - 1);
    await settle();
    expect(listReads().length).toBe(reads);
  });
});
