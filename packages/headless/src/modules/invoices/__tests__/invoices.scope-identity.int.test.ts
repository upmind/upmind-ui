// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices — retargeting at an entitled client (AC-12), and the
 * criteria law refusing an undeclared filter (AC-15)
 *
 * ## Job To Be Done
 * The A7 read-back, in full (`verify-reality-check.companion.md`): retarget
 * for this module is a declared `client_id` FILTER COLUMN, never a path
 * segment (design D-notes — the client lane has no
 * `api/clients/{id}/invoices` route). Proves the outbound request carries the
 * target client's id as `filter[client_id|eq]`, that the READING client's own
 * session bearer token is the credential sent (no impersonation header, no
 * token swap), and that the same call WITHOUT a target resolves to the
 * reading client's own id. Also proves the criteria law: an undeclared filter
 * column is refused (a genuine `additionalProperties` schema rejection), not
 * silently ignored or silently applied — the mechanism this story's dotted
 * filter-column defect (see `invoices.collection.int.test.ts`) is an
 * over-firing instance OF.
 *
 * ## What Breaks If These Fail
 * A client reads another account's invoices, the request goes out as the
 * wrong identity, or an unspellable filter silently reaches the platform —
 * the FE-2824 failure class this whole story exists to close (AC-12), and a
 * criteria-law bypass (AC-15).
 */

import { describe, expect, it, vi } from "vitest";
import { useInvoices } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  installInvoiceHandlers,
  observeInvoiceRequests,
  seedClientSession
} from "./invoices.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

/** A client id this session never had — the retarget discriminator. */
const OTHER_CLIENT_ID = "11111111-2222-3333-4444-555555555555";

describe("invoices — retarget my reading at an entitled client (AC-12, the A7 clause)", () => {
  it("AC-12 setCriteria({ filters: { client_id } }) carries the TARGET client's id on the wire, as the READING client's own session", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices
      .useActions()
      .setCriteria({ filters: { client_id: { eq: OTHER_CLIENT_ID } } });
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const request = observed.last();
    expect(decodeURIComponent(request.url)).toContain(
      `filter[client_id|eq]=${OTHER_CLIENT_ID}`
    );
    assertClientIdentityTransport(request, accessToken);
  });

  it("AC-12 the same call WITHOUT a target client resolves to the reading client's own id, never the other one", async () => {
    const { clientId } = await seedClientSession();
    installInvoiceHandlers();
    const observed = observeInvoiceRequests();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    expect(observed.all()).not.toEqual([]);
    for (const request of observed.all()) {
      expect(request.url).not.toContain(OTHER_CLIENT_ID);
    }
    expect(invoices.useInternals().clientId.value).toBe(clientId);
  });
});

describe("invoices — refuses an undeclared filter (AC-15, the criteria law)", () => {
  it("AC-15 an undeclared filter column is refused — a validation error, never a silent pass-through", async () => {
    await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices.useActions().setCriteria({
      filters: {
        totally_undeclared_column: { eq: "should-never-reach-the-wire" }
      } as never
    });
    await new Promise(resolve => setTimeout(resolve, 1200));
    observed.stop();

    // Refused, not applied: the undeclared column never survives into the
    // published criteria, and consequently never reaches the wire on any
    // request this scope issues.
    expect(invoices.useContext().query.value.filters ?? {}).not.toHaveProperty(
      "totally_undeclared_column"
    );
    for (const request of observed.all()) {
      expect(request.url).not.toContain("totally_undeclared_column");
      expect(request.url).not.toContain("should-never-reach-the-wire");
    }
  });
});
