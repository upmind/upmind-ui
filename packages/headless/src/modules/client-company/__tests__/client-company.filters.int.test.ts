// -----------------------------------------------------------------------------
/**
 * @fileoverview client-company collection — search and stable ordering (AC-7, AC-8)
 *
 * ## Job To Be Done
 * AC-7 prove `filterBy({ name: { like } })` reaches the wire as
 * `filter[name|like]` (the criteria channel's translated key — NOT the legacy
 * `query=` this file asserted before the M2 -> M3 upgrade) and that clearing
 * it drops the key entirely, never a lingering one.
 * AC-8 prove the mapped collection is always ascending by `created_at`,
 * against a REAL recorded raw dump whose row order is NOT already ascending
 * (`get-clients-id-companies-case-order-check.json`), that the outbound
 * request carries the ascending `created_at` order key on BOOT, and that
 * `sortBy` re-sorts the wire's `order` key to whichever declared field a
 * caller names.
 *
 * ## Calling-convention correction (2026-08-22)
 * Rewritten onto the scoped four-layer surface
 * (`useClientCompanies().as(ScopeActorTypes.CLIENT)`) and the criteria
 * channel (`filterBy`/`sortBy`) — the pre-upgrade `filters.query()` member is
 * gone by design (AC-34). Every assertion this file made survives; none is
 * deleted (AC-40).
 *
 * ## What Breaks If These Fail
 * AC-7 failing means the search box narrows nothing, or regresses onto a
 * param the real API never reads (measured against the RECORDED narrowed
 * capture, not a client-side slice). AC-8 failing means a client's companies
 * reorder between reads, or a caller cannot choose an order at all.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientCompanies } from "..";
import { SortDirection } from "../../query/query.types";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installCompaniesSearchHandler,
  installOrderCheckHandler,
  observeCompanyRequests,
  RECORDED_NAME_NEEDLE,
  recorded,
  seedClientSession
} from "./client-company.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-company collection — search (AC-7)", () => {
  it("AC-7 filterBy({ name: { like } }) carries filter[name|like]=%<term>% on the outbound request", async () => {
    const { clientId } = await seedClientSession();
    installCompaniesSearchHandler(server, clientId);
    const observed = observeCompanyRequests();

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();

    companies.useActions().filterBy({ name: { like: RECORDED_NAME_NEEDLE } });

    await vi.waitFor(() => {
      expect(observed.lastParam("filter[name|like]")).toBe(
        `%${RECORDED_NAME_NEEDLE}%`
      );
    });
    observed.stop();
  });

  it("AC-7 clearing the search drops the filter[name|like] key entirely — never a lingering empty one", async () => {
    const { clientId } = await seedClientSession();
    installCompaniesSearchHandler(server, clientId);

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();
    const filtered = observeCompanyRequests();
    companies.useActions().filterBy({ name: { like: RECORDED_NAME_NEEDLE } });
    await vi.waitFor(() =>
      expect(filtered.lastParam("filter[name|like]")).toBe(
        `%${RECORDED_NAME_NEEDLE}%`
      )
    );
    filtered.stop();

    const observed = observeCompanyRequests();
    companies.useActions().filterBy({});
    // Landing back on the boot combination already cached issues no request
    // of its own, so the read-back forces a fresh combination and reads the
    // filter keys off every request seen since the clear.
    companies.useActions().sortBy([{ field: "name", dir: SortDirection.ASC }]);

    await vi.waitFor(() => expect(observed.lastParam("order")).toBe("name"));
    observed.stop();
    for (const request of observed.all()) {
      expect(new URL(request.url).searchParams.has("filter[name|like]")).toBe(
        false
      );
    }
  });
});

describe("client-company collection — ordering (AC-8)", () => {
  it("AC-8 always lists companies oldest-first on boot — against a REAL raw dump that is NOT already ascending", async () => {
    const { clientId } = await seedClientSession();
    installOrderCheckHandler(server, clientId);
    const raw = recorded.orderCheck().data;
    const rawIsAscending = raw.every(
      (row, index) =>
        index === 0 ||
        new Date(row.created_at).getTime() >=
          new Date(raw[index - 1].created_at).getTime()
    );
    expect(rawIsAscending).toBe(false);

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(companies.useContext().data.value).toHaveLength(raw.length)
    );

    const expectedAscendingIds = [...raw]
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .map(row => row.id);

    expect(
      companies.useContext().data.value.map(company => company.id)
    ).toEqual(expectedAscendingIds);
  });

  it("AC-8 issues the ascending created_at order key on the outbound boot request", async () => {
    const { clientId } = await seedClientSession();
    installOrderCheckHandler(server, clientId);
    const observed = observeCompanyRequests();

    // `.as()` returns a lazy proxy that mints the query only on first
    // property access — a bare `.as(CLIENT)` with no read issues zero
    // requests and would pass this assertion on a no-op. Reading
    // `useContext().data` actually exercises the query.
    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(companies.useContext().data.value.length).toBeGreaterThan(0)
    );
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("order")).toBe("created_at");
  });

  it("AC-8 sortBy re-sorts the wire's order key to the field it names", async () => {
    const { clientId } = await seedClientSession();
    installOrderCheckHandler(server, clientId);
    const observed = observeCompanyRequests();

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();

    companies.useActions().sortBy([{ field: "name", dir: SortDirection.ASC }]);

    await vi.waitFor(() => expect(observed.lastParam("order")).toBe("name"));
    observed.stop();
  });
});
