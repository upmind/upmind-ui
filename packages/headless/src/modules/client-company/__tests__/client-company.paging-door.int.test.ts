// -----------------------------------------------------------------------------
/**
 * @fileoverview client-company — the pagination door (integration, AC-9,
 * AC-31, AC-32, AC-35)
 *
 * ## Job To Be Done
 * `pagination.limit` keeps its schema-declared `default: 0` — the unpaged
 * read both legacy consumers ask for (`billableEntitiesProvider.vue:191-203`,
 * `clientCompanySelect.vue:110-114`) — but the window is now WRITABLE:
 * `useActions().setCriteria({ pagination: { limit } })` is the door a
 * consumer drives before `nextPage()` / `prevPage()` do anything real
 * (design.md B3 `@decision`, parity.yaml C3). Proven here against the REAL
 * recorded two-page walk (`fixtures/get-clients-id-companies-case-page-1.json`
 * / `case-page-2.json`, `limit=2`, `x-total-count: 79`) — the same fixtures
 * `client-company.collection.int.test.ts`'s AC-9 spec already replays for the
 * unpaged (`limit=0`, single-page, `nextPage()` rejects) half of this
 * capability. This file proves the other half: with the door driven, the
 * offset actually walks, and `useContext().query` — never a shadow copy —
 * tracks it (AC-35 write-through law).
 *
 * ## What Breaks If These Fail
 * A `setCriteria` on the actions layer that no longer reaches the query's own
 * criteria (the FE-2824 shape: published, not delivered) leaves `nextPage` /
 * `prevPage` permanently inert behind a door that looks open. A default that
 * drifts off `0` changes the billing surfaces' boot read from one request to
 * N without anyone deciding that.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientCompanies } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installCompaniesListHandler,
  installPagedCompaniesHandler,
  observeCompanyRequests,
  recordedRows,
  seedClientSession
} from "./client-company.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-company — the unpaged default reaches the wire when the door is never touched (AC-31, AC-32)", () => {
  it("AC-32 keeps requesting limit=0 when no consumer ever calls setCriteria", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installCompaniesListHandler(server, clientId, [primary, secondary]);
    const observed = observeCompanyRequests();

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();
    observed.stop();

    expect(new URL(observed.first().url).searchParams.get("limit")).toBe("0");
  });
});

describe("client-company — the pagination door overrides the default and drives real paging (AC-9, AC-35)", () => {
  it("AC-9 setCriteria sets the page size on the wire, nextPage/prevPage walk the REAL recorded pages, and useContext().query tracks the offset throughout", async () => {
    const { clientId } = await seedClientSession();
    const paged = installPagedCompaniesHandler(server, clientId);
    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();
    const observed = observeCompanyRequests();

    companies.useActions().setCriteria({ pagination: { limit: 2 } });

    expect(companies.useContext().query.value.pagination).toMatchObject({
      limit: 2
    });
    await vi.waitFor(() => expect(observed.lastParam("limit")).toBe("2"));
    expect(observed.lastParam("offset")).toBe("0");

    await companies.useActions().nextPage();

    expect(companies.useContext().query.value.pagination).toMatchObject({
      limit: 2,
      offset: 2
    });
    await vi.waitFor(() => expect(observed.lastParam("offset")).toBe("2"));

    await companies.useActions().prevPage();

    // The `{ limit: 2, offset: 0 }` combination was already fetched moments
    // ago, by the `setCriteria` call above — the module's own cache law
    // (client-company.criteria.int.test.ts, "issues exactly one request per
    // DISTINCT criteria combination") serves it back without a third wire
    // hit. `useContext().query` is the write-through law under test here:
    // the criteria model itself moves regardless of whether the cache serves
    // or the network does — checked synchronously right after the door
    // call, so a write-through break reds fast instead of via a timeout.
    expect(companies.useContext().query.value.pagination).toMatchObject({
      limit: 2,
      offset: 0
    });
    observed.stop();

    expect(paged.offsets()).toEqual(["0", "0", "2"]);
  });
});
