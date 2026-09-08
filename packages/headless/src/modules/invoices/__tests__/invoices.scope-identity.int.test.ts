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
 * ## `.for('client', X)` wire read-backs (Review blockers B1/B2 repair)
 * Beyond the `setCriteria`-driven retarget above, this file also proves the
 * SAME A7 identity transport for a `.for()`-built scope's OWN construction-
 * time reads, for the three `client x client` reads this module serves: the
 * list's initial fetch (this file) and `hasUnpaid` (this file); the third,
 * `consolidatableCount`, is proven in `invoices.consolidatable-count.int.test.ts`
 * alongside its own coexistence assertions. For the list specifically, the
 * request and the returned rows' `Invoice.attribution` are asserted TOGETHER
 * — the B2 defect was precisely that these two could disagree (fetch the
 * reader's rows, attribute them against the target) while each individually
 * looked fine.
 *
 * ## AC-12 durability half (H1 repair)
 * `criteria.set` merges the published intent at BRANCH level, so a `filters`
 * write with no `client_id` of its own can drop the column entirely. These
 * tests assert, on the outbound request AFTER a `filters`-branch write, that
 * the `.for('client', X)` retarget still holds — `filterCreditNotes()`, a
 * bare `setCriteria({ filters })`, `sortBy()`, and `filterConsolidatable()`
 * each issue their NEXT request still carrying the target's `client_id`, and
 * an explicit caller-declared `client_id` still wins (the manual-retarget
 * door stays open). A caller-declared `client_id` that is FALSY
 * (`{ eq: undefined }`) is the opposite case: it does not count as a manual
 * override, so the durable retarget is RE-ASSERTED, not dropped.
 *
 * ## What Breaks If These Fail
 * A client reads another account's invoices, the request goes out as the
 * wrong identity, or an unspellable filter silently reaches the platform —
 * the FE-2824 failure class this whole story exists to close (AC-12), and a
 * criteria-law bypass (AC-15). If only the durability half fails: a retarget
 * that holds at mint but drops on the first filter/sort change silently
 * re-widens the list to the READER's own rows.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { InvoicesContextTypes, useInvoices } from "..";
import { SortDirection } from "../../query/query.types";
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
import type { WireInvoice } from "./invoices.int-helpers";

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

  it("the collection's own list request carries the TARGET client's id on the wire without a manual setCriteria() call", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();
    const listFixture = recorded.list();
    /**
     * A REAL recorded row (`listFixture.data[0]`) with `id`, `client`, and
     * `delegate_related` toggled to construct the TARGET's own invoice —
     * everything else on the row stays the real capture (precedent:
     * `invoices.attribution.int.test.ts`).
     */
    const targetOwnRow: WireInvoice = {
      ...listFixture.data[0],
      id: "target-own-row",
      client: { id: OTHER_CLIENT_ID, parent_client_config: null },
      delegate_related: false
    };
    server.use(
      http.get("*/invoices", ({ request }) => {
        if (
          decodeURIComponent(request.url).includes(
            `filter[client_id|eq]=${OTHER_CLIENT_ID}`
          )
        ) {
          return HttpResponse.json({
            status: "ok",
            data: [targetOwnRow],
            total: 1,
            error: null,
            messages: null,
            meta: null
          });
        }
        return HttpResponse.json(listFixture);
      })
    );

    const observed = observeInvoiceRequests();
    const invoices = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.CLIENT, OTHER_CLIENT_ID);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    const request = observed.first();
    expect(decodeURIComponent(request.url)).toContain(
      `filter[client_id|eq]=${OTHER_CLIENT_ID}`
    );
    assertClientIdentityTransport(request, accessToken);

    // Request and attribution agree: the row the fetch returned IS the
    // target's own row, and mapInvoices attributed it against that SAME
    // target — never a reader's row re-attributed against the target id.
    const rows = invoices.useContext().data.value;
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("target-own-row");
    expect(rows[0].attribution.isOwn).toBe(true);
    expect(rows[0].attribution.isChildOfClient).toBe(false);
    expect(rows[0].attribution.isDelegated).toBe(false);
  });
});

describe("invoices — hasUnpaid answers for the .for() TARGET, not the reader (AC-12/AC-10 wire retarget)", () => {
  const isDedicatedUnpaidRead = (url: string): boolean =>
    new URL(url).searchParams.get("limit") === "1";

  it("hasUnpaid answers for the .for() TARGET, not the reader", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();
    const listFixture = recorded.list();
    server.use(
      http.get("*/invoices", ({ request }) => {
        if (!isDedicatedUnpaidRead(request.url)) {
          return HttpResponse.json(listFixture);
        }
        const forTarget = decodeURIComponent(request.url).includes(
          `filter[client_id|eq]=${OTHER_CLIENT_ID}`
        );
        return HttpResponse.json(
          {
            status: "ok",
            data: listFixture.data.slice(0, 1),
            total: forTarget ? 3 : 0,
            error: null,
            messages: null,
            meta: null
          },
          { headers: { "x-total-count": forTarget ? "3" : "0" } }
        );
      })
    );

    const invoices = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.CLIENT, OTHER_CLIENT_ID);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    void invoices.useMeta().hasUnpaid.value;
    await vi.waitFor(() =>
      expect(
        observed.all().some(request => isDedicatedUnpaidRead(request.url))
      ).toBe(true)
    );
    observed.stop();

    const dedicated = observed
      .all()
      .find(request => isDedicatedUnpaidRead(request.url));
    expect(dedicated).toBeDefined();
    expect(decodeURIComponent(dedicated!.url)).toContain(
      `filter[client_id|eq]=${OTHER_CLIENT_ID}`
    );
    assertClientIdentityTransport(dedicated!, accessToken);

    await new Promise(resolve => setTimeout(resolve, 2500));
    expect(invoices.useMeta().hasUnpaid.value).toBe(true);
  });

  it("hasUnpaid's dedicated request without a target resolves to the reading client's own id, never the other one", async () => {
    const { clientId } = await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    void invoices.useMeta().hasUnpaid.value;
    await vi.waitFor(() =>
      expect(
        observed.all().some(request => isDedicatedUnpaidRead(request.url))
      ).toBe(true)
    );
    observed.stop();

    for (const request of observed.all()) {
      expect(request.url).not.toContain(OTHER_CLIENT_ID);
    }
    expect(invoices.useInternals().clientId.value).toBe(clientId);
  });
});

describe("invoices — the retarget survives every published criteria write (AC-12, durability, H1)", () => {
  /** A second target, distinct from OTHER_CLIENT_ID — the manual-door check. */
  const MANUAL_RETARGET_CLIENT_ID = "99998888-7777-6666-5555-444433332222";

  it("AC-12 filterCreditNotes() carries the credit-note category values AND the TARGET client's id on the wire", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.CLIENT, OTHER_CLIENT_ID);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices.useActions().filterCreditNotes();
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const request = observed.last();
    const decoded = decodeURIComponent(request.url);
    expect(decoded).toMatch(/credit_note/);
    expect(decoded).toContain(`filter[client_id|eq]=${OTHER_CLIENT_ID}`);
    assertClientIdentityTransport(request, accessToken);
  });

  it("AC-12 a bare setCriteria({ filters }) write with no client_id still carries the TARGET client's id alongside the caller's own filter", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.CLIENT, OTHER_CLIENT_ID);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices
      .useActions()
      .setCriteria({ filters: { number: { eq: "durability-check-001" } } });
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const request = observed.last();
    const decoded = decodeURIComponent(request.url);
    expect(decoded).toContain("filter[number|eq]=durability-check-001");
    expect(decoded).toContain(`filter[client_id|eq]=${OTHER_CLIENT_ID}`);
    assertClientIdentityTransport(request, accessToken);
  });

  it("AC-12 an explicit caller-declared client_id in setCriteria({ filters }) wins over the durable retarget — the manual door stays open", async () => {
    await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.CLIENT, OTHER_CLIENT_ID);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices.useActions().setCriteria({
      filters: { client_id: { eq: MANUAL_RETARGET_CLIENT_ID } }
    });
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const decoded = decodeURIComponent(observed.last().url);
    expect(decoded).toContain(
      `filter[client_id|eq]=${MANUAL_RETARGET_CLIENT_ID}`
    );
    expect(decoded).not.toContain(`filter[client_id|eq]=${OTHER_CLIENT_ID}`);
  });

  it("AC-12 a caller-declared client_id that is FALSY (eq: undefined) is not a manual override — the durable retarget is re-asserted", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.CLIENT, OTHER_CLIENT_ID);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices.useActions().setCriteria({
      filters: {
        number: { eq: "durability-falsy-client-id-001" },
        client_id: { eq: undefined }
      }
    });
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const request = observed.last();
    const decoded = decodeURIComponent(request.url);
    expect(decoded).toContain(
      "filter[number|eq]=durability-falsy-client-id-001"
    );
    expect(decoded).toContain(`filter[client_id|eq]=${OTHER_CLIENT_ID}`);
    assertClientIdentityTransport(request, accessToken);
  });

  it("AC-12 sortBy() carries the TARGET client's id alongside the requested sort — a sort-only write never drops the retarget", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.CLIENT, OTHER_CLIENT_ID);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices.useActions().sortBy("due_date", SortDirection.DESC);
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const request = observed.last();
    const decoded = decodeURIComponent(request.url);
    expect(decoded).toContain("order=-due_date");
    expect(decoded).toContain(`filter[client_id|eq]=${OTHER_CLIENT_ID}`);
    assertClientIdentityTransport(request, accessToken);
  });

  it("AC-12 filterConsolidatable() carries the TARGET client's id — its own preset resolves client_id itself", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.CLIENT, OTHER_CLIENT_ID);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices.useActions().filterConsolidatable();
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const request = observed.last();
    const decoded = decodeURIComponent(request.url);
    expect(decoded).toContain(`filter[client_id|eq]=${OTHER_CLIENT_ID}`);
    assertClientIdentityTransport(request, accessToken);
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
