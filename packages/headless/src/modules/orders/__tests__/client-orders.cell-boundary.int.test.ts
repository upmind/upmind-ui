// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — a signed-out caller sends no request (AC-23)
 *
 * ## Job To Be Done
 * Prove the runtime half of AC-23: with no client signed in, neither the
 * collection nor the manager sends a request to `api/invoices*`,
 * `api/products` or `api/brands/*\/gateways` (design 6.1 step 2, 8.11). The
 * brand settles first, so the brand gate is open and only the client guard
 * can hold the reads. Each route is answered by its recorded capture, so a
 * read that did leave would succeed, not fail silently.
 *
 * ## What Breaks If These Fail
 * A signed-out visitor fires reads the platform refuses, or a read shaped for
 * one client leaves before any client is confirmed.
 */

import { describe, expect, it, vi } from "vitest";
import { getFixture } from "@upmind-automation/test-fixtures";
import { useClientOrder, useClientOrders } from "..";
import { useBrand } from "../../brand";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useSessionStore, useActiveSession } from "../../session-store";
import {
  brandRecordingsDir,
  capturedOrder,
  installBootstrapStubs,
  installClientOrdersBackgroundStubs,
  observeModuleRequests,
  resetClientOrderScopes,
  serveRecordedLists,
  serveRecordedOrder,
  settle
} from "./client-orders.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const UNPAID = capturedOrder("get-invoices-id-case-order-unpaid");
const BRAND_ID = (
  getFixture("get-brand-settings", { recordingsDir: brandRecordingsDir })
    .response.body as { data: { id: string } }
).data.id;

describe("client-orders — a signed-out caller triggers no request (AC-23)", () => {
  it("with the brand settled and no client signed in, the collection and the manager send no module read", async () => {
    resetClientOrderScopes();
    installBootstrapStubs(server, { withBrandConfig: false });
    installClientOrdersBackgroundStubs();
    serveRecordedLists();
    serveRecordedOrder(UNPAID);
    await useSessionStore().initStore();
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);

    const observed = observeModuleRequests();
    const orders = useClientOrders().as(ScopeActorTypes.SELF);
    const order = useClientOrder()
      .as(ScopeActorTypes.SELF)
      .withId(UNPAID.data.id as string);
    orders.useMeta();
    order.useMeta();

    await vi.waitFor(() => expect(useBrand().brandId.value).toBe(BRAND_ID));
    await settle(300);

    const moduleReads = observed
      .all()
      .map(request => new URL(request.url).pathname)
      .filter(path =>
        /^\/api\/(invoices|products|brands\/[^/]+\/gateways)/.test(path)
      );
    expect(moduleReads).toEqual([]);
    expect(orders.useMeta().isAvailable.value).toBe(false);
  });
});
