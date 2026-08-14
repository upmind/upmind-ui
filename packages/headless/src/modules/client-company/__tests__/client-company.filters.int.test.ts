// -----------------------------------------------------------------------------
/**
 * @fileoverview client-company collection — search and stable ordering (AC-7, AC-8)
 *
 * ## Job To Be Done
 * AC-7 prove `filters.query()` reaches the wire and clearing it drops the
 * `query` key entirely (never a lingering empty one).
 * AC-8 prove the mapped collection is always ascending by `created_at`,
 * against a REAL recorded raw dump whose row order is NOT already ascending
 * (`get-clients-id-companies-case-order-check.json`) — so a no-op
 * implementation cannot pass, and the outbound request URL carries the
 * ascending `created_at` order key (G2, the in-cell gap the current headless
 * lacked entirely).
 *
 * ## What Breaks If These Fail
 * AC-8 failing means a client's companies reorder between reads, which is the
 * live in-cell gap this story closes (G2).
 */

import { describe, expect, it, vi } from "vitest";
import { useClientCompanies } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installOrderCheckHandler,
  observeCompanyRequests,
  recorded,
  seedClientSession
} from "./client-company.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-company collection — search (AC-7)", () => {
  it("AC-7 filters.query('acme') carries query=acme on the outbound request", async () => {
    await seedClientSession();
    const observed = observeCompanyRequests();

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();

    await companies.useActions().filters.query("acme");

    await vi.waitFor(() => {
      expect(
        observed.all().some(request => request.url.includes("query=acme"))
      ).toBe(true);
    });
    observed.stop();
  });

  it("AC-7 clearing the search drops the query key entirely — never a lingering empty one", async () => {
    await seedClientSession();

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();
    await companies.useActions().filters.query("acme");

    const observed = observeCompanyRequests();
    await companies.useActions().filters.query("");

    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();
    const last = observed.all().at(-1);
    expect(new URL(last!.url).searchParams.has("query")).toBe(false);
  });
});

describe("client-company collection — stable ordering (AC-8)", () => {
  it("AC-8 always lists companies oldest-first — against a REAL raw dump that is NOT already ascending", async () => {
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

  it("AC-8 issues the ascending created_at order key on the outbound request", async () => {
    const { clientId } = await seedClientSession();
    installOrderCheckHandler(server, clientId);
    const observed = observeCompanyRequests();

    // `.as()` returns a lazy proxy that mints the query only on first property
    // access — a bare `.as(CLIENT)` with no read issues zero requests and
    // would pass this assertion on a no-op. Reading `useContext().data`
    // actually exercises the query, which is what AC-8's read-back is for.
    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(companies.useContext().data.value.length).toBeGreaterThan(0)
    );
    observed.stop();

    const url = new URL(observed.first().url);
    expect(url.searchParams.get("order")).toBe("created_at");
  });
});
