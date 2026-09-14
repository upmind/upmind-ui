// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices — read-backs for `filterBy`, `nextPage`, `prevPage`
 *
 * ## Job To Be Done
 * These three `useInvoices().useActions()` members were added this run and
 * carried zero coverage across every `*.int.test.ts` in this module.
 * `filterBy` writes the `filters` branch — the exact H1 defect class this
 * story already fixed once for `setCriteria` — so it gets the full A7
 * read-back (`verify-reality-check.companion.md`): the outbound request after
 * a `.for('client', X)`-scoped `filterBy()` call still carries the target's
 * `filter[client_id]`, as the *reading* client's own session bearer, same
 * shape as `invoices.scope-identity.int.test.ts`'s durability block.
 * `nextPage`/`prevPage` get a paging read-back: the outbound request's page
 * window (`limit`/`offset`, bare query params — not a `filter[...]` column)
 * actually moves, and moves back.
 *
 * ## What Breaks If These Fail
 * `filterBy`: a future edit could route this member around
 * `withDurableClientId`'s wrapped `setCriteria` and silently re-widen a
 * `.for('client', X)` read back to the reader's own rows on the very next
 * filter — the FE-2824 failure class, undetected because nothing exercised
 * this specific door. `nextPage`/`prevPage`: a caller presses "next" and the
 * list silently keeps serving the same page, or "back" does not return them
 * to page one.
 */

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
import "./setup.integration";
import { some } from "lodash-es";

// -----------------------------------------------------------------------------

/** A client id this session never had — the retarget discriminator. */
const OTHER_CLIENT_ID = "11111111-2222-3333-4444-555555555555";

describe("invoices — filterBy() carries the retarget through the filters branch (H1 class, A7)", () => {
  it("filterBy() on a .for('client', X) scope still carries the TARGET client's id, as the READING client's own session", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.CLIENT, OTHER_CLIENT_ID);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices.useActions().filterBy({ number: "filterby-a7-001" });
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const request = observed.last();
    const decoded = decodeURIComponent(request.url);
    expect(decoded).toContain("filter[number]=filterby-a7-001");
    expect(decoded).toContain(`filter[client_id]=${OTHER_CLIENT_ID}`);
    assertClientIdentityTransport(request, accessToken);
  });

  it("filterBy() without a target client resolves to the reading client's own id, never the other one", async () => {
    const { clientId } = await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices.useActions().filterBy({ number: "filterby-self-001" });
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const request = observed.last();
    const decoded = decodeURIComponent(request.url);
    expect(decoded).toContain(`filter[client_id]=${clientId}`);
    expect(decoded).not.toContain(OTHER_CLIENT_ID);
  });
});

describe("invoices — nextPage()/prevPage() move the outbound page window", () => {
  async function bootPagedCollection() {
    await seedClientSession();
    const handlers = installInvoiceHandlers();
    handlers.setListBody({ ...recorded.list(), total: 98 });

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );
    invoices.useActions().setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() =>
      expect(invoices.useContext().query.value.pagination?.limit).toBe(2)
    );
    // A single macrotask yield past the `limit` flip — precedent:
    // `client-address/__tests__/pager-writes-through-criteria.int.test.ts`'s
    // disclosed, empirically-probed lag between `useContext().query`
    // publishing the new limit and the pager's own internal ref catching up.
    await new Promise(resolve => setTimeout(resolve, 0));
    return invoices;
  }

  it("nextPage() moves the outbound offset once a page size is set", async () => {
    const invoices = await bootPagedCollection();
    const observed = observeInvoiceRequests();

    invoices.useActions().nextPage();

    await vi.waitFor(
      () =>
        expect(
          some(
            observed.all(),
            request => new URL(request.url).searchParams.get("offset") === "2"
          )
        ).toBe(true),
      { timeout: 3000 }
    );
    observed.stop();
    expect(invoices.useContext().query.value.pagination?.offset).toBe(2);
  });

  it("prevPage() moves the offset back to the first page", async () => {
    const invoices = await bootPagedCollection();
    invoices.useActions().nextPage();
    await vi.waitFor(() =>
      expect(invoices.useContext().query.value.pagination?.offset).toBe(2)
    );

    invoices.useActions().prevPage();

    await vi.waitFor(() =>
      expect(invoices.useContext().query.value.pagination?.offset).toBe(0)
    );
  });

  it("nextPage() also moves the outbound offset off the module's own boot-default page size", async () => {
    await seedClientSession();
    installInvoiceHandlers();
    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );
    const bootLimit = invoices.useContext().query.value.pagination?.limit;
    const observed = observeInvoiceRequests();

    invoices.useActions().nextPage();

    await vi.waitFor(
      () =>
        expect(
          some(
            observed.all(),
            request =>
              new URL(request.url).searchParams.get("offset") ===
              String(bootLimit)
          )
        ).toBe(true),
      { timeout: 3000 }
    );
    observed.stop();
  });
});
