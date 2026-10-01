// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the emptied-page zero-total recovery (AC-4, D-6)
 *
 * ## Job To Be Done
 * Prove design 6.1 step 10: a page read past page one that settles with no
 * error, no rows and a total of 0 writes offset 0, so the client returns to
 * the first page. A failed read leaves the client on the current page.
 *
 * ## Provenance
 * Offset 0 is answered by the strict pool with `orders-default`. Offset 10
 * serves the recorded `orders-empty-page` envelope verbatim: staging answered
 * that read at offset 10 with `data: []` and `total: 0`. The failure is
 * injected at the boundary with `HttpResponse.error()` (design 8.8).
 *
 * The offset-0 read is the boot read, so the recovery reads it from the cache
 * and sends no second request. The spec reads the recovery from the published
 * model and pagination, not from the wire.
 *
 * ## What Breaks If These Fail
 * A client whose last orders on a page went away stays on a blank page.
 */

import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  captured,
  observeOrderRequests,
  recordedMatch,
  LIST_CAPTURES,
  seedClientSession
} from "./orders.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

function serveEmptyPageAtOffset10(): void {
  const emptyPage = captured("get-invoices-case-orders-empty-page");
  server?.use(
    http.get("*/api/invoices", ({ request }) => {
      if (new URL(request.url).searchParams.get("offset") === "10") {
        return HttpResponse.json(emptyPage);
      }
      const fixture = recordedMatch(LIST_CAPTURES, request);
      return fixture
        ? HttpResponse.json(fixture.response.body as object)
        : HttpResponse.error();
    })
  );
}

async function bootCollection() {
  await seedClientSession();
  serveEmptyPageAtOffset10();
  const orders = useOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders;
}

// -----------------------------------------------------------------------------

describe("orders — the emptied-page zero-total recovery (AC-4)", () => {
  it("a page-two read that settles with no rows and total 0 returns the client to page one", async () => {
    const orders = await bootCollection();
    const observed = observeOrderRequests();

    orders.useActions().setPage(2);
    await vi.waitFor(() =>
      expect(observed.latestParams().get("offset")).toBe("10")
    );

    await vi.waitFor(() =>
      expect(orders.useContext().query.value.pagination?.offset).toBe(0)
    );
    await vi.waitFor(() =>
      expect(orders.useContext().pagination.value?.page).toBe(1)
    );
    expect(orders.useMeta().hasError.value).toBe(false);
  });

  it("a failed page-two read leaves the client on page two", async () => {
    const orders = await bootCollection();
    const observed = observeOrderRequests();
    server?.use(http.get("*/api/invoices", () => HttpResponse.error()));

    orders.useActions().setPage(2);
    await vi.waitFor(() =>
      expect(observed.latestParams().get("offset")).toBe("10")
    );
    await vi.waitFor(() => expect(orders.useMeta().hasError.value).toBe(true), {
      timeout: 10000
    });

    expect(orders.useContext().query.value.pagination?.offset).toBe(10);
  });
});
