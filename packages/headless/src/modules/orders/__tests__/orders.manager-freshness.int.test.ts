// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the manager's own freshness controls (AC-13)
 *
 * ## Job To Be Done
 * Prove the three freshness members the `/useOrder` playground page no longer
 * draws (operator ruling 2026-10-02): `useOrder().as('self').withId(id)`
 * invalidate, reset and destroy. `invalidate()` marks the cached order stale,
 * so the active manager re-reads `GET api/invoices/{id}` (design 8.4).
 * `reset()` drops the cached order and redials, so a forced order stops being
 * served and the platform value returns (the labs force handle depends on it).
 * `destroy()` tears the manager down and removes its scope key, so no stale
 * reader remains and a fresh manager reads the order again.
 *
 * ## Provenance
 * The recorded `order-paid` single read, served on its own id. No hand-authored
 * body; the forced order is the recorded order with one key changed in the
 * shared query cache, which is the labs force handle, never a network answer.
 *
 * ## What Breaks If These Fail
 * A page that drives these controls keeps serving a stale or forced order, or
 * leaks a destroyed manager into the scope registry so the next read is wrong.
 */

import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrder } from "..";
import { queryClient } from "../../query/client";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  capturedOrder,
  observeOrderRequests,
  orderScopeKeys,
  seedClientSession,
  serveRecordedOrder,
  settle
} from "./orders.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const PAID = capturedOrder("get-invoices-id-case-order-paid");
const PAID_ID = PAID.data.id as string;
const SENTINEL_ID = "forced-sentinel-order-id";

let observer: ReturnType<typeof observeOrderRequests>;

const singleReads = () =>
  observer
    .all()
    .filter(request =>
      /\/api\/invoices\/[^/?]+/.test(new URL(request.url).pathname)
    );

async function bootOn(id: string) {
  const manager = useOrder().as(ScopeActorTypes.SELF).withId(id);
  await vi.waitFor(() => expect(manager.useMeta().isLoading.value).toBe(false));
  return manager;
}

const isOrderQuery = (queryKey: readonly unknown[]): boolean =>
  queryKey.includes("order");

// The labs force handle: one key changed in the live cache, never a request.
function forceSentinelOrder(old: unknown): unknown {
  if (old && typeof old === "object" && "id" in old)
    return { ...(old as object), id: SENTINEL_ID };
  const envelope = old as { data?: { id?: unknown } } | undefined;
  if (envelope?.data && "id" in envelope.data)
    return { ...envelope, data: { ...envelope.data, id: SENTINEL_ID } };
  return old;
}

describe("orders — the manager's own freshness controls (AC-13)", () => {
  beforeEach(async () => {
    await seedClientSession();
    observer = observeOrderRequests();
    serveRecordedOrder(PAID);
  }, 30000);

  it("invalidate marks the order stale, so the manager reads it again", async () => {
    const manager = await bootOn(PAID_ID);
    const before = singleReads().length;

    await manager.useActions().invalidate();

    await vi.waitFor(() => expect(singleReads().length).toBe(before + 1));
    expect(
      new URL(singleReads().at(-1)!.url).searchParams.get("with_staged_imports")
    ).toBe("1");
    expect(manager.useContext().data.value?.id).toBe(PAID_ID);
  });

  it("reset drops the cached order, so a forced order stops being served", async () => {
    const manager = await bootOn(PAID_ID);

    queryClient.setQueriesData(
      { predicate: query => isOrderQuery(query.queryKey) },
      forceSentinelOrder
    );
    await vi.waitFor(() =>
      expect(manager.useContext().data.value?.id).toBe(SENTINEL_ID)
    );
    const before = singleReads().length;

    // Block the redial, so only a cache DROP (not a plain refetch) clears it.
    server?.use(
      http.get("*/api/invoices/:id", () =>
        HttpResponse.json({}, { status: 404 })
      )
    );
    await manager.useActions().reset();

    await vi.waitFor(() =>
      expect(singleReads().length).toBeGreaterThan(before)
    );
    await vi.waitFor(() =>
      expect(manager.useContext().data.value?.id).toBeUndefined()
    );
  });

  it("reset redials, so the recorded order returns (AC-13)", async () => {
    const manager = await bootOn(PAID_ID);

    queryClient.setQueriesData(
      { predicate: query => isOrderQuery(query.queryKey) },
      forceSentinelOrder
    );
    await vi.waitFor(() =>
      expect(manager.useContext().data.value?.id).toBe(SENTINEL_ID)
    );
    const before = singleReads().length;

    await manager.useActions().reset();

    await vi.waitFor(() => expect(singleReads().length).toBe(before + 1));
    await vi.waitFor(() =>
      expect(manager.useContext().data.value?.id).toBe(PAID_ID)
    );
  });

  it("destroy removes the manager scope key and leaves no stale reader", async () => {
    const manager = await bootOn(PAID_ID);
    const before = orderScopeKeys();
    const reads = singleReads().length;

    await manager.useActions().destroy();

    expect(orderScopeKeys().length).toBe(before.length - 1);
    await settle();
    expect(singleReads().length).toBe(reads);
  });

  it("a fresh manager after destroy reads the order again (AC-13)", async () => {
    const manager = await bootOn(PAID_ID);
    await manager.useActions().destroy();
    const reads = singleReads().length;

    const fresh = await bootOn(PAID_ID);

    await vi.waitFor(() => expect(singleReads().length).toBe(reads + 1));
    expect(fresh.useContext().data.value?.id).toBe(PAID_ID);
  });
});
