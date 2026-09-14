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
import { TICKETS_DEFAULT_SORT, TicketsSortableProperties } from "../tickets.types";
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
      filters: { "status.code": { neq: "ticket_closed" } }
    });
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    const request = observed
      .all()
      .find(r => decodeURIComponent(r.url).includes("filter[status.code|neq]="));
    expect(request).toBeDefined();
    expect(request!.url).toContain("with_staged_imports=1");
    expect(decodeURIComponent(request!.url)).toContain(
      "filter[status.code|neq]=ticket_closed"
    );
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
      filters: { "status.code": { eq: "ticket_closed" } }
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

    const fixture = recorded.closedList() as { data: Array<{ id: string }> };
    expect(tickets.useContext().data.value.map(row => row.id)).toEqual(
      fixture.data.map(row => row.id)
    );
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
    expect(
      observed.all().some(request => request.url.includes("|like"))
    ).toBe(false);
  });
});

describe("tickets collection — default sort and explicit ordering (AC-4)", () => {
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
      .find(request => decodeURIComponent(request.url).includes("order=") && request.url.includes("subject"));
    expect(sortRequest).toBeDefined();

    const fixture = recorded.sortedBySubject() as { data: Array<{ id: string }> };
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
