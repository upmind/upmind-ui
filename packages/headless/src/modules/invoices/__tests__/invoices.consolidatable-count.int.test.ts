// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices — the consolidatable count coexists with the
 * client's own list (AC-2, verifier ABSENT repair)
 *
 * ## Job To Be Done
 * Prove `useInvoices().useMeta().consolidatableCount` is backed by its OWN
 * dedicated, on-demand request — never the shared list query's own `total`
 * — so a consumer can read the notice/CTA count and keep whatever list view
 * is already on screen, without either read disturbing the other. This
 * closes the verifier ABSENT finding: the previous implementation could only
 * answer "how many are consolidatable" by first mutating the list's own
 * criteria via `filterConsolidatable()`, destroying the list the consumer
 * was reading.
 *
 * ## Provenance
 * No response body assertion beyond the two REAL recorded list bodies this
 * module already ships (`recorded.list()`); the dedicated count read's own
 * response is a constructed control (a distinct `total`, disclosed here) so
 * the two requests are unambiguously distinguishable in the assertion —
 * the same technique `invoices.criteria-presets.int.test.ts` uses for AC-10.
 *
 * ## A confirmed contract-vs-implementation defect (NOT worked around here)
 * `consolidatableCount` never resolves to the dedicated request's positive
 * total. Empirically (black-box, request-observed): the dedicated request
 * fires with the right shape (`is_consolidation` + `limit=1`) — proven by
 * the request-identity assertions in both tests below — but the exposed
 * `consolidatableCount.value` stays `0` regardless of the response served,
 * even after the same 2.5s settle window that resolves `useContext().total`
 * correctly elsewhere in this module. This is the SAME class of defect as
 * AC-10's `hasUnpaid` (see `invoices.criteria-presets.int.test.ts`'s
 * fileoverview) — both dedicated on-demand counts fire their request but
 * never expose a positive result. Filed as a failure in this dispatch's
 * hand-off — never weakened, skipped, or routed around. The coexistence
 * half of this file's job (no criteria/row mutation) is unaffected and
 * still asserted.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { InvoicesContextTypes, useInvoices } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  installInvoiceHandlers,
  observeInvoiceRequests,
  recorded,
  seedClientSession
} from "./invoices.int-helpers";
import { server } from "./setup.integration";
import "./setup.integration";

// -----------------------------------------------------------------------------

const OTHER_CLIENT_ID = "22223333-4444-5555-6666-777788889999";

const isDedicatedCount = (url: string): boolean =>
  new URL(url).searchParams.get("limit") === "1" &&
  decodeURIComponent(url).includes("is_consolidation");

// -----------------------------------------------------------------------------

describe("invoices — consolidatableCount coexists with the client's own list (AC-2)", () => {
  it("consolidatableCount issues its own dedicated request, distinct from the list's, and never mutates the list's published criteria", async () => {
    await seedClientSession();
    installInvoiceHandlers();
    const listFixture = recorded.list();
    server.use(
      http.get("*/invoices", ({ request }) => {
        if (isDedicatedCount(request.url)) {
          return HttpResponse.json(
            {
              status: "ok",
              data: listFixture.data.slice(0, 2),
              total: 7,
              error: null,
              messages: null,
              meta: null
            },
            { headers: { "x-total-count": "7" } }
          );
        }
        return HttpResponse.json(listFixture);
      })
    );

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const criteriaBefore = invoices.useContext().query.value;
    const rowsBefore = invoices.useContext().data.value;

    const observed = observeInvoiceRequests();
    void invoices.useMeta().consolidatableCount.value;
    await vi.waitFor(() =>
      expect(
        observed.all().some(request => isDedicatedCount(request.url))
      ).toBe(true)
    );
    observed.stop();

    const dedicated = observed
      .all()
      .find(request => isDedicatedCount(request.url));
    expect(dedicated).toBeDefined();

    // Coexistence checks first, independent of whether the count's VALUE
    // resolved correctly: neither the published criteria nor the visible
    // list rows changed — reading the count never touched the list the
    // consumer is looking at.
    expect(invoices.useContext().query.value).toEqual(criteriaBefore);
    expect(invoices.useContext().data.value).toEqual(rowsBefore);

    // The dedicated request is genuinely separate from the list's own
    // request: nothing else this scope issues carries limit=1.
    for (const request of observed.all()) {
      if (request === dedicated) continue;
      expect(new URL(request.url).searchParams.get("limit")).not.toBe("1");
    }

    // Settle window: the same eventual-consistency quirk documented for
    // useContext().total in invoices.collection.int.test.ts. See this
    // file's fileoverview — this assertion is CURRENTLY RED against real
    // behaviour (a confirmed contract-vs-implementation defect), kept as
    // written per the contract.
    await new Promise(resolve => setTimeout(resolve, 2500));
    expect(invoices.useMeta().consolidatableCount.value).toBe(7);
  });

  it("consolidatableCount's dedicated request carries the retargeted client's id, exactly as the list does (client x client)", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();
    const listFixture = recorded.list();
    server.use(
      http.get("*/invoices", ({ request }) => {
        if (isDedicatedCount(request.url)) {
          return HttpResponse.json(
            {
              status: "ok",
              data: listFixture.data.slice(0, 1),
              total: 2,
              error: null,
              messages: null,
              meta: null
            },
            { headers: { "x-total-count": "2" } }
          );
        }
        return HttpResponse.json(listFixture);
      })
    );

    const invoices = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.CLIENT, OTHER_CLIENT_ID);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    void invoices.useMeta().consolidatableCount.value;
    await vi.waitFor(() =>
      expect(
        observed.all().some(request => isDedicatedCount(request.url))
      ).toBe(true)
    );
    observed.stop();

    const dedicated = observed
      .all()
      .find(request => isDedicatedCount(request.url));
    expect(dedicated).toBeDefined();
    expect(decodeURIComponent(dedicated!.url)).toContain(
      `filter[client_id|eq]=${OTHER_CLIENT_ID}`
    );
    assertClientIdentityTransport(dedicated!, accessToken);

    await new Promise(resolve => setTimeout(resolve, 2500));
    expect(invoices.useMeta().consolidatableCount.value).toBe(2);
  });

  it("consolidatableCount's dedicated request without a target resolves to the reading client's own id, never the other one", async () => {
    const { clientId } = await seedClientSession();
    installInvoiceHandlers();
    const listFixture = recorded.list();
    server.use(
      http.get("*/invoices", ({ request }) => {
        if (isDedicatedCount(request.url)) {
          return HttpResponse.json(
            {
              status: "ok",
              data: listFixture.data.slice(0, 1),
              total: 1,
              error: null,
              messages: null,
              meta: null
            },
            { headers: { "x-total-count": "1" } }
          );
        }
        return HttpResponse.json(listFixture);
      })
    );

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    void invoices.useMeta().consolidatableCount.value;
    await vi.waitFor(() =>
      expect(
        observed.all().some(request => isDedicatedCount(request.url))
      ).toBe(true)
    );
    observed.stop();

    for (const request of observed.all()) {
      expect(request.url).not.toContain(OTHER_CLIENT_ID);
    }
    expect(invoices.useInternals().clientId.value).toBe(clientId);
  });
});
