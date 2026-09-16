// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview The manager page's reference-aware openTicket loader
 * (FE-3226 39c489ac1)
 *
 * ## Job To Be Done
 * A hand reads only a ticket's REFERENCE on the listing, but the manager loads
 * by uuid — so pasting a reference used to 404 into the generic unavailable
 * alert. This proves the openTicket entry closes that gap: a pasted uuid
 * navigates straight to the manager url; a pasted reference is resolved to its
 * id through the module's own public surface (`useClientTickets` filtered by
 * the bare-EQUAL `reference` column, AC-5) and then navigates; and a reference
 * that matches nothing shows the DISTINCT "no ticket with that reference"
 * state, never the generic unavailable alert.
 *
 * ## What Breaks If These Fail
 * A client pastes the only identifier they have — the reference off their own
 * listing — and the manager cannot open it, or opens the wrong ticket, or
 * reports a session error for a reference that simply does not exist.
 *
 * ## Provenance
 * The resolved id and reference are read off the `tickets` module's committed
 * captures: `get-tickets-id` (the uuid the manager loads) and the recorded
 * `filter[reference]=XGD-235-12434` list read. The unknown-reference case is
 * served the module's OWN recorded empty-list body — a real zero-row response,
 * never a hand-authored one.
 */

import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  installTicketsListBody,
  mountManagerAt,
  seedClientSession,
  teardownSession,
  unmountTicketPage
} from "./client-ticket-page.harness";

// -----------------------------------------------------------------------------

const ticketsRecordingsDir = join(
  process.cwd(),
  "..",
  "..",
  "packages/headless/src/modules/tickets/__tests__/fixtures"
);

const ticketsBody = (key: string): Record<string, unknown> =>
  getFixtureBody(key, { recordingsDir: ticketsRecordingsDir }) as Record<
    string,
    unknown
  >;

const recorded = {
  single: () => ticketsBody("get-tickets-id"),
  byReference: () =>
    ticketsBody(
      "get-tickets-case-filter-reference-filter-reference-xgd-235-12434"
    ),
  empty: () =>
    ticketsBody(
      "get-tickets-case-search-body-only-query-recorded-reply-for-fe-3226-with-staged-imports-1"
    )
};

const singleId = (recorded.single() as { data: { id: string } }).data.id;
const referenceRow = (
  recorded.byReference() as { data: Array<{ id: string; reference: string }> }
).data[0]!;

const BASE = "/useClientTicket";
const managerUrl = (id: string) =>
  `/useClientTicket/as/client/for/ticket/${id}`;

const UNAVAILABLE_COPY = "Ticket unavailable";

// -----------------------------------------------------------------------------

describe("the manager's openTicket loader turns what a hand can paste into the right ticket", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(() => {
    unmountTicketPage();
    teardownSession();
  });

  it("navigates a pasted UUID straight to its manager url, resolving nothing", async () => {
    const list = installTicketsListBody(recorded.byReference());
    const { wrapper, pushes } = await mountManagerAt(BASE);

    await wrapper.find('[data-test-key="ticket-id-input"]').setValue(singleId);
    await wrapper.find('[data-test-key="ticket-open"]').trigger("click");
    await vi.waitFor(() => expect(pushes.length).toBeGreaterThan(0));

    expect(pushes).toEqual([managerUrl(singleId)]);
    expect(list.seen()).toEqual([]);
  }, 20000);

  it("resolves a pasted REFERENCE through the bare-EQUAL reference filter, then navigates to the id it found", async () => {
    const list = installTicketsListBody(recorded.byReference());
    const { wrapper, pushes } = await mountManagerAt(BASE);

    await wrapper
      .find('[data-test-key="ticket-id-input"]')
      .setValue(referenceRow.reference);
    await wrapper.find('[data-test-key="ticket-open"]').trigger("click");
    await vi.waitFor(() => expect(pushes.length).toBeGreaterThan(0), {
      timeout: 10000
    });

    expect(pushes).toEqual([managerUrl(referenceRow.id)]);

    const lookup = list.seen().map(url => decodeURIComponent(url));
    expect(
      lookup.some(url =>
        url.includes(`filter[reference]=${referenceRow.reference}`)
      )
    ).toBe(true);
    expect(lookup.some(url => url.includes("filter[reference|like]"))).toBe(
      false
    );
  }, 20000);

  it("shows the distinct 'no ticket with that reference' state for an unknown reference, and navigates nowhere", async () => {
    installTicketsListBody(recorded.empty());
    const { wrapper, pushes } = await mountManagerAt(BASE);

    await wrapper
      .find('[data-test-key="ticket-id-input"]')
      .setValue("ZZZ-000-00000");
    await wrapper.find('[data-test-key="ticket-open"]').trigger("click");
    await vi.waitFor(
      () =>
        expect(
          wrapper.find('[data-test-key="ticket-not-found"]').exists()
        ).toBe(true),
      { timeout: 10000 }
    );

    expect(wrapper.text()).toContain("ZZZ-000-00000");
    expect(wrapper.text()).not.toContain(UNAVAILABLE_COPY);
    expect(pushes).toEqual([]);
  }, 20000);
});
