// -----------------------------------------------------------------------------
/**
 * @fileoverview `list()`'s pager writes THROUGH the criteria
 *
 * ## Job To Be Done
 * With the raw arm deleted there is no private page cursor left: `nextPage` /
 * `prevPage` are writes into the criteria's own `pagination.offset`, so the
 * model and the wire can never disagree about which page is showing. This walks
 * the REAL `useClientAddresses({ pagination: { limit } })` over MSW-replayed
 * staging recordings: each step moves the outbound `offset` by the caller's own
 * limit, the published `criteria` moves with it, `pagination`/`meta` report the
 * same page the wire asked for, and a direct `setCriteria` on the window moves
 * the pager exactly as a Next click does.
 *
 * ## What Breaks If These Fail
 * A pager that does not write through leaves the criteria pointing at page 1
 * while the wire is on page 3 — the next filter write resets to an offset the
 * user never chose, and a url rehydrated from the criteria opens the wrong page.
 *
 * ## Why this proof lives beside client-address
 * The law is `useQuery.ts`'s, and its negative control ships at
 * `modules/query/__tests__/pager-writes-through-criteria.must-fail.patch`. A
 * bare `useQuery().list()` outside a module never issues its first fetch in this
 * harness, so the only place the walk can be driven end to end today is through
 * a migrated module — this one, whose recorded corpus is a real `limit=2` walk.
 * Relocating the mutant beside this file (or adding a query-local harness) is
 * escalated, not decided here.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientAddresses } from "..";
import {
  observeRequests,
  seedClientSession
} from "../../../__tests__/criteria-int-kit";
import { corpus, installAddressesHandler } from "./client-address.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** The caller's own page size — the recorded corpus is a real `limit=2` walk. */
const PAGE_SIZE = 2;

async function bootPagedCollection(): Promise<
  ReturnType<typeof useClientAddresses>
> {
  const { clientId } = await seedClientSession(server);
  installAddressesHandler(server, clientId);
  const addresses = useClientAddresses({
    pagination: { limit: PAGE_SIZE, offset: 0 }
  });
  await addresses.isReady();
  return addresses;
}

// -----------------------------------------------------------------------------

describe("client-address pager — every step is a criteria write", () => {
  it("boots on offset 0 at the caller's own page size", async () => {
    const { clientId } = await seedClientSession(server);
    installAddressesHandler(server, clientId);
    const observed = observeRequests(server, "/addresses");

    const addresses = useClientAddresses({
      pagination: { limit: PAGE_SIZE, offset: 0 }
    });
    await addresses.isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("limit")).toBe(String(PAGE_SIZE));
    expect(params.get("offset")).toBe("0");
    expect(addresses.criteria.value.pagination).toMatchObject({
      limit: PAGE_SIZE,
      offset: 0
    });
    expect(addresses.pagination.value.page).toBe(1);
  });

  it("moves the outbound offset AND the published criteria on nextPage()", async () => {
    const addresses = await bootPagedCollection();
    const observed = observeRequests(server, "/addresses");

    addresses.nextPage();

    await vi.waitFor(() =>
      expect(observed.lastParam("offset")).toBe(String(PAGE_SIZE))
    );
    observed.stop();

    expect(addresses.criteria.value.pagination?.offset).toBe(PAGE_SIZE);
    expect(addresses.pagination.value.page).toBe(2);
    expect(addresses.data.value.map(row => row.id)).toEqual(
      corpus()
        .slice(PAGE_SIZE, PAGE_SIZE * 2)
        .map(row => row.id)
    );
  });

  it("walks forward and back, the criteria tracking every step", async () => {
    const addresses = await bootPagedCollection();
    const observed = observeRequests(server, "/addresses");

    addresses.nextPage();
    await vi.waitFor(() =>
      expect(observed.lastParam("offset")).toBe(String(PAGE_SIZE))
    );
    expect(addresses.criteria.value.pagination?.offset).toBe(PAGE_SIZE);

    // Page 1 is already cached, so the step back is read off the model rather
    // than off a request the cache law says must not happen.
    addresses.prevPage();
    await vi.waitFor(() =>
      expect(addresses.criteria.value.pagination?.offset).toBe(0)
    );
    observed.stop();

    expect(addresses.pagination.value.page).toBe(1);
    expect(addresses.data.value.map(row => row.id)).toEqual(
      corpus()
        .slice(0, PAGE_SIZE)
        .map(row => row.id)
    );
  });

  it("reports the page state the wire asked for", async () => {
    const addresses = await bootPagedCollection();

    addresses.nextPage();

    await vi.waitFor(() =>
      expect(addresses.pagination.value).toMatchObject({
        limit: PAGE_SIZE,
        page: 2,
        from: PAGE_SIZE + 1,
        to: PAGE_SIZE * 2
      })
    );
    expect(addresses.meta.value.isEmpty).toBe(false);
  });

  it("has no page cursor of its own — a criteria write moves the pager", async () => {
    const addresses = await bootPagedCollection();
    const observed = observeRequests(server, "/addresses");

    addresses.setCriteria({ pagination: { limit: PAGE_SIZE, offset: 0 } });
    addresses.nextPage();
    await vi.waitFor(() =>
      expect(observed.lastParam("offset")).toBe(String(PAGE_SIZE))
    );

    addresses.setCriteria({ pagination: { limit: PAGE_SIZE, offset: 0 } });

    await vi.waitFor(() =>
      expect(addresses.criteria.value.pagination?.offset).toBe(0)
    );
    observed.stop();
    expect(addresses.pagination.value.page).toBe(1);
  });
});
