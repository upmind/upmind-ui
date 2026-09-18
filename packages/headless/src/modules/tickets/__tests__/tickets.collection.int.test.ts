// -----------------------------------------------------------------------------
/**
 * @fileoverview tickets — the collection's core reads and writes (AC-1, AC-2,
 * AC-3, AC-4, AC-5, AC-6, AC-8, AC-9, AC-PATH)
 *
 * ## Job To Be Done
 * Exercise the REAL `useClientTickets` stack against MSW-replayed,
 * staging-captured fixtures. Proves: the active list carries
 * `with_staged_imports=1` and excludes closed tickets (AC-1); the closed list
 * narrows to closed only (AC-2); real two-page pagination (AC-3); the default
 * sort and reference filter emit the bare EQUAL wire shape (AC-4/AC-5); quick
 * search only fires at 3+ characters (AC-6); a narrow page size yields the
 * short, newest-first overview list (AC-8); create issues a real POST and
 * the created ticket lands in the collection (AC-9); every request stays on
 * the client-facing path, never `/admin/` (AC-PATH).
 *
 * ## What Breaks If These Fail
 * A client either can't find their own tickets, sees another actor's/desk's
 * tickets, or a silently-reintroduced admin path leaks client requests onto
 * the staff surface (the FE-2824 shape).
 */

import { describe, expect, it, vi } from "vitest";
import { useClientTickets } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  TICKETS_DEFAULT_SORT,
  TicketsContextTypes,
  TicketsSortableProperties
} from "../tickets.types";
import {
  assertNoAdminPath,
  installTicketsHandlers,
  observeTicketsRequests,
  recorded,
  seedClientSession
} from "./tickets.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("tickets collection — my active tickets (AC-1)", () => {
  it("AC-1 issues GET tickets with_staged_imports=1, excluding closed tickets, and never touches /admin/ (AC-PATH)", async () => {
    await seedClientSession();
    installTicketsHandlers();

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeTicketsRequests();
    await tickets.useActions().setCriteria({
      filters: { isClosed: { eq: false } }
    });
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    const request = observed
      .all()
      .find(r =>
        decodeURIComponent(r.url).includes("filter[status.code|neq]=")
      );
    expect(request).toBeDefined();
    expect(request!.url).toContain("with_staged_imports=1");
    expect(decodeURIComponent(request!.url)).toContain(
      "filter[status.code|neq]=ticket_closed"
    );
    // The active position is the `neq` key ALONE — no bare `eq` spelling, and
    // no schema-spelled stray: `filter[isClosed|…]` names a column this API
    // does not have, and staging answers 500 to it riding beside the real key.
    expect(decodeURIComponent(request!.url)).not.toMatch(
      /filter\[status\.code\]=/
    );
    expect(decodeURIComponent(request!.url)).not.toContain("filter[isClosed");
    assertNoAdminPath(observed.all());

    const fixture = recorded.activeList() as {
      data: Array<{ id: string }>;
    };
    expect(tickets.useContext().data.value.map(row => row.id)).toEqual(
      fixture.data.map(row => row.id)
    );
  });
});

describe("tickets collection — my closed tickets (AC-2)", () => {
  it("AC-2 narrowing to the closed status yields only closed tickets", async () => {
    await seedClientSession();
    const handlers = installTicketsHandlers();

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );

    handlers.setListBody(recorded.closedList());
    const observed = observeTicketsRequests();
    await tickets.useActions().setCriteria({
      filters: { isClosed: { eq: true } }
    });
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    const closedRequest = observed
      .all()
      .find(r => decodeURIComponent(r.url).includes("filter[status.code]="));
    expect(closedRequest).toBeDefined();
    expect(decodeURIComponent(closedRequest!.url)).toContain(
      "filter[status.code]=ticket_closed"
    );
    expect(decodeURIComponent(closedRequest!.url)).not.toContain("|neq");
    expect(decodeURIComponent(closedRequest!.url)).not.toContain(
      "filter[isClosed"
    );

    const fixture = recorded.closedList() as { data: Array<{ id: string }> };
    expect(tickets.useContext().data.value.map(row => row.id)).toEqual(
      fixture.data.map(row => row.id)
    );
  });
});

describe("tickets collection — the All position (AC-1/AC-2)", () => {
  it("clearing the tri-state sends NEITHER status key, and no stray beside them", async () => {
    await seedClientSession();
    installTicketsHandlers();

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );

    // Narrow first, so "All" is proven to REMOVE a live narrowing rather than
    // to have never written one — the boot state passes that trivially.
    await tickets.useActions().setCriteria({
      filters: { isClosed: { eq: true } }
    });
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeTicketsRequests();
    await tickets.useActions().setCriteria({ filters: {} });
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );
    // The unnarrowed key is the one the collection booted on, so vue-query
    // answers the write from cache. Force the read so there IS a request to
    // grade: what is asserted is the URL the cleared criteria BUILD.
    await tickets.useActions().refresh();
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const cleared = observed.all().at(-1)!;
    const url = decodeURIComponent(cleared.url);

    // "All" is the absence of the narrowing, not a third value on the wire.
    expect(url).not.toContain("filter[status.code]");
    expect(url).not.toContain("filter[status.code|neq]");
    expect(url).not.toContain("filter[isClosed");
    assertNoAdminPath(observed.all());
  });
});

describe("tickets collection — paginate a long list (AC-3)", () => {
  it("AC-3 walks a real second page with nextPage()", async () => {
    await seedClientSession();
    const handlers = installTicketsHandlers();
    handlers.setListBody(recorded.pageOne());

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );
    const firstPageIds = tickets.useContext().data.value.map(row => row.id);

    handlers.setListBody(recorded.pageTwo());
    await tickets.useActions().nextPage();
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );
    const secondPageIds = tickets.useContext().data.value.map(row => row.id);

    for (const id of secondPageIds) {
      expect(firstPageIds).not.toContain(id);
    }
  });
});

describe("tickets collection — default sort and the reference filter's wire shape (AC-4/AC-5)", () => {
  it("AC-5 filtering by reference emits the bare EQUAL wire key, never a CONTAINS shape", async () => {
    await seedClientSession();
    const handlers = installTicketsHandlers();
    handlers.setListBody(recorded.filteredByReference());
    const observed = observeTicketsRequests();

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );
    await tickets.useActions().setCriteria({
      filters: { reference: "XGD-235-12434" }
    });
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    const filterRequest = observed.matching("filter%5Breference%5D=");
    expect(filterRequest.length).toBeGreaterThan(0);
    expect(observed.all().some(request => request.url.includes("|like"))).toBe(
      false
    );
  });
});

describe("tickets collection — default sort and explicit ordering (AC-4)", () => {
  it("AC-4 the platform table channel's sortBy/filterBy resolve to real members and reach the wire", async () => {
    await seedClientSession();
    const handlers = installTicketsHandlers();

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );

    // `useTableChannel` calls these BY NAME. Their absence threw
    // `actions.sortBy is not a function` at the column header, so the sort
    // arrow did nothing at all.
    const actions = tickets.useActions();
    expect(typeof actions.sortBy).toBe("function");
    expect(typeof actions.filterBy).toBe("function");

    handlers.setListBody(recorded.sortedBySubject());
    const observed = observeTicketsRequests();
    // `sortBy` is sync — it writes the intent and returns, so wait on the
    // REQUEST rather than on a loading flag that has not flipped yet.
    actions.sortBy([{ field: TicketsSortableProperties.SUBJECT, dir: "asc" }]);
    await vi.waitFor(
      () =>
        expect(
          observed
            .all()
            .some(request =>
              decodeURIComponent(request.url).includes("order=subject")
            )
        ).toBe(true),
      { timeout: 2000 }
    );
    observed.stop();
  });

  it("AC-4 defaults to the newest-updated-first order, and setCriteria can re-order by another field", async () => {
    await seedClientSession();
    const handlers = installTicketsHandlers();
    const observed = observeTicketsRequests();

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );

    expect(tickets.useContext().query.value.sort).toEqual(TICKETS_DEFAULT_SORT);
    const defaultRequest = observed.first();
    expect(decodeURIComponent(defaultRequest.url)).toContain("updated_at");

    handlers.setListBody(recorded.sortedBySubject());
    await tickets.useActions().setCriteria({
      sort: [{ field: TicketsSortableProperties.SUBJECT, dir: "asc" }]
    });
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    const sortRequest = observed
      .all()
      .find(
        request =>
          decodeURIComponent(request.url).includes("order=") &&
          request.url.includes("subject")
      );
    expect(sortRequest).toBeDefined();

    const fixture = recorded.sortedBySubject() as {
      data: Array<{ id: string }>;
    };
    expect(tickets.useContext().data.value.map(row => row.id)).toEqual(
      fixture.data.map(row => row.id)
    );
  });
});

describe("tickets collection — a short recent overview list (AC-8)", () => {
  it("AC-8 a narrow page size overview list holds only the few most recently updated tickets, newest first", async () => {
    await seedClientSession();
    const handlers = installTicketsHandlers();
    handlers.setListBody(recorded.recent());

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );

    await tickets.useActions().setCriteria({ pagination: { limit: 3 } });
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );

    const fixture = recorded.recent() as { data: Array<{ id: string }> };
    expect(fixture.data.length).toBeLessThanOrEqual(3);
    expect(tickets.useContext().data.value.map(row => row.id)).toEqual(
      fixture.data.map(row => row.id)
    );
  });
});

describe("tickets collection — quick search min length (AC-6)", () => {
  it("AC-6 a two-character search term issues no new request; three characters does", async () => {
    await seedClientSession();
    installTicketsHandlers();

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeTicketsRequests();
    await tickets.useActions().setCriteria({ query: "te" });
    await new Promise(resolve => setTimeout(resolve, 300));
    expect(observed.all().length).toBe(0);

    await tickets.useActions().setCriteria({ query: "tes" });
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();
  });
});

describe("tickets collection — raise a new ticket (AC-9)", () => {
  it("AC-9 create() issues a real POST and the write invalidates the list so a real server's post-create state is picked up without the caller asking again", async () => {
    await seedClientSession();
    const handlers = installTicketsHandlers();
    const observed = observeTicketsRequests();

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );

    const created = recorded.created() as {
      data: { id: string; subject: string };
    };
    const activeList = recorded.activeList() as {
      data: unknown[];
      total: number | null;
    };

    await tickets.useActions().create({
      subject: "Fixture write-cycle ticket",
      body: "Recorded for FE-3226's write-cycle capture.",
      ticketDepartmentId: "8d632507-9806-5d1e-33eb-8174e234e98d"
    });
    // Simulate what a real refetch would now return: the created ticket
    // present in the client's list — this is what invalidation is FOR.
    handlers.setListBody({
      ...activeList,
      data: [created.data, ...activeList.data],
      total: (activeList.total ?? activeList.data.length) + 1
    });
    observed.stop();

    const createRequest = observed
      .all()
      .find(request => request.method === "POST");
    expect(createRequest).toBeDefined();
    assertNoAdminPath(observed.all());

    await vi.waitFor(() =>
      expect(
        tickets.useContext().data.value.some(row => row.id === created.data.id)
      ).toBe(true)
    );
  });
});

describe("tickets collection — tickets about one of my products (AC-7)", () => {
  /**
   * The product is a RELATIONSHIP, so it is the SCOPE CONTEXT and never a
   * criteria filter column. This assertion is the wire proof of that
   * refactor: the API shape moved from `setCriteria({ filters: {
   * contract_product_id } })` to `.for('product', id)`, and the REQUEST is
   * byte-for-byte what the recorded capture answered —
   * `filter[contract_product_id]=<id>` beside `with_staged_imports=1`.
   */
  it("AC-7 the PRODUCT scope context issues the real filter[contract_product_id] wire key and returns only that product's tickets", async () => {
    await seedClientSession();
    const handlers = installTicketsHandlers();
    handlers.setListBody(recorded.productScopedList());
    const observed = observeTicketsRequests();

    const lookup = recorded.contractProductsLookup() as {
      data: Array<{ id: string }>;
    };
    const targetId = lookup.data[0]!.id;

    const tickets = useClientTickets()
      .as(ScopeActorTypes.CLIENT)
      .for(TicketsContextTypes.PRODUCT, targetId);

    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    // THE WIRE, unchanged by the refactor: the narrowing rides on the very
    // first request the scope issues, no `setCriteria` write involved.
    const request = observed
      .all()
      .find(r =>
        decodeURIComponent(r.url).includes(
          `filter[contract_product_id]=${targetId}`
        )
      );
    expect(request).toBeDefined();

    // NO STRAY SCHEMA-SPELLED KEY. The query core writes one wire key per
    // branch the schema declares, spelt with the branch's OWN name — which is
    // how a `filter[statusCode|eq]` once rode along and made staging answer
    // 500. `contract_product_id` is gone from the schema, so the context's
    // own re-spelling must be the ONLY occurrence of it on the url, and no
    // `product` key may appear at all.
    const url = decodeURIComponent(request!.url);
    expect(url.split(`filter[contract_product_id]=`)).toHaveLength(2);
    expect(url).not.toContain("filter[product]");
    expect(url).not.toContain("filter[product|");
    expect(url).toContain("with_staged_imports=1");

    const fixture = recorded.productScopedList() as {
      data: Array<{ id: string; contract_product_id: string }>;
    };
    expect(
      fixture.data.every(row => row.contract_product_id === targetId)
    ).toBe(true);
    expect(tickets.useContext().data.value.map(row => row.id)).toEqual(
      fixture.data.map(row => row.id)
    );
  });

  /**
   * AC-7's second Then — "I cannot accidentally widen the list back to all my
   * tickets". Under the old filter-column shape this was a hope; under the
   * scope context it is structural: the criteria model has no product column
   * to clear, so a `filters` write that names none (Clear all, a chip
   * removed) cannot drop the narrowing.
   */
  it("AC-7 the narrowing survives a criteria write that clears every filter", async () => {
    await seedClientSession();
    const handlers = installTicketsHandlers();
    handlers.setListBody(recorded.productScopedList());

    const lookup = recorded.contractProductsLookup() as {
      data: Array<{ id: string }>;
    };
    const targetId = lookup.data[0]!.id;

    const tickets = useClientTickets()
      .as(ScopeActorTypes.CLIENT)
      .for(TicketsContextTypes.PRODUCT, targetId);

    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );

    // A `filters` write REPLACES that branch whole, so this is the exact move
    // that used to be able to drop a `contract_product_id` column standing in
    // it.
    const observed = observeTicketsRequests();
    await tickets.useActions().setCriteria({
      filters: { subject: "Fixture write-cycle ticket" }
    });
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    const listReads = observed.matching("/tickets?");
    expect(listReads.length).toBeGreaterThan(0);
    for (const read of listReads) {
      expect(decodeURIComponent(read.url)).toContain(
        `filter[contract_product_id]=${targetId}`
      );
    }
  });
});

describe("tickets collection — tickets delegated to me sit alongside my own (AC-10)", () => {
  it("AC-10 the list is never narrowed to my own tickets — a co-mingled row carries is_delegated_object", async () => {
    await seedClientSession();
    const handlers = installTicketsHandlers();
    handlers.setListBody(recorded.delegatedInList());
    const observed = observeTicketsRequests();

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    expect(
      observed
        .all()
        .some(request =>
          decodeURIComponent(request.url).includes("filter[client_id]")
        )
    ).toBe(false);

    const fixture = recorded.delegatedInList() as {
      data: Array<{ id: string; is_delegated_object: boolean }>;
    };
    expect(fixture.data.some(row => row.is_delegated_object)).toBe(true);
    const rows = tickets.useContext().data.value as unknown as Array<{
      id: string;
      is_delegated_object?: boolean;
    }>;
    expect(rows.map(row => row.id)).toEqual(fixture.data.map(row => row.id));
    expect(rows.every(row => row.is_delegated_object === true)).toBe(true);
  });
});

describe("tickets collection — desk + status lookups (AC-31/AC-32)", () => {
  it("AC-31 loadDepartmentOptions() and AC-32 loadTicketStatuses() read from the brand-public + statuses endpoints", async () => {
    await seedClientSession();
    installTicketsHandlers();
    const tickets = useClientTickets().as(ScopeActorTypes.SELF);

    const departments = await tickets.useActions().loadDepartmentOptions();
    const statuses = await tickets.useActions().loadTicketStatuses();

    const departmentsFixture = recorded.brandDepartments() as {
      data: Array<{ ticket_department_id: string }>;
    };
    const statusesFixture = recorded.statuses() as {
      data: Array<{ code: string }>;
    };

    expect(Array.isArray(departments)).toBe(true);
    expect((departments as Array<{ value: string }>).length).toBe(
      departmentsFixture.data.length
    );
    expect(Array.isArray(statuses)).toBe(true);
    expect((statuses as Array<{ code: string }>).map(row => row.code)).toEqual(
      statusesFixture.data.map(row => row.code)
    );
  });
});

describe("tickets collection — a rejected setCriteria surfaces on hasError (R9 fold-in, AC-CE)", () => {
  it("a criteria validation rejection populates useMeta().hasError, not only useContext().error", async () => {
    await seedClientSession();
    installTicketsHandlers();

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );
    expect(tickets.useMeta().hasError.value).toBe(false);

    const observed = observeTicketsRequests();
    await tickets.useActions().setCriteria({
      filters: { unrecognisedFilterKey: { eq: "ticket_closed" } } as never
    });
    await new Promise(resolve => setTimeout(resolve, 350));
    observed.stop();

    expect(observed.all().length).toBe(0);
    expect(tickets.useContext().error.value).toBeTruthy();
    expect(tickets.useMeta().hasError.value).toBe(true);
  });
});

describe("tickets collection — the pager survives past page 1 (FE-3226 regression)", () => {
  it("a list read sends no skip_count side-channel to the wire — total arrives inline", async () => {
    await seedClientSession();
    const handlers = installTicketsHandlers();
    handlers.setListBody(recorded.pageOne());
    const observed = observeTicketsRequests();

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    const listReads = observed
      .all()
      .filter(request => /\/api\/tickets(\?|$)/.test(request.url));
    expect(listReads.length).toBeGreaterThan(0);
    for (const request of listReads) {
      expect(request.url).not.toContain("skip_count");
    }
  });

  it("walking to page 2 keeps the real total, more pages, next-page and a non-empty list — and never sends skip_count", async () => {
    await seedClientSession();
    const handlers = installTicketsHandlers();
    handlers.setListBody(recorded.pageOne());
    const observed = observeTicketsRequests();

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );

    await tickets.useActions().setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );

    const recordedTotal = (recorded.pageOne() as { total: number }).total;
    expect(tickets.useContext().pagination.value.total).toBe(recordedTotal);
    expect(tickets.useContext().pagination.value.pages).toBeGreaterThan(1);
    expect(tickets.useMeta().hasNextPage.value).toBe(true);
    expect(tickets.useMeta().isEmpty.value).toBe(false);

    handlers.setListBody(recorded.pageTwo());
    await tickets.useActions().nextPage();
    await vi.waitFor(() =>
      expect(tickets.useContext().pagination.value.page).toBe(2)
    );
    observed.stop();

    expect(tickets.useContext().pagination.value.total).toBe(recordedTotal);
    expect(tickets.useContext().pagination.value.pages).toBeGreaterThan(1);
    expect(tickets.useMeta().hasNextPage.value).toBe(true);
    expect(tickets.useMeta().isEmpty.value).toBe(false);

    const listReads = observed
      .all()
      .filter(request => /\/api\/tickets(\?|$)/.test(request.url));
    expect(listReads.length).toBeGreaterThan(0);
    for (const request of listReads) {
      expect(request.url).not.toContain("skip_count");
    }
  });
});
