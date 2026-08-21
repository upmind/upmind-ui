// -----------------------------------------------------------------------------
/**
 * @fileoverview client-company — the criteria wire, cache law and surface
 *
 * ## Job To Be Done
 * Drive the REAL `useClientCompanies()` against MSW-replayed staging
 * recordings and prove the migration off the raw options arm:
 * the collection boots on the window its SCHEMA declares (`limit: 0`, unpaged);
 * the free-text search leaves as `filter[name|like]=%…%` and NOT the legacy
 * bare `query=`; clearing it removes the key rather than leaving it stale;
 * a repeated combination is served from cache; and the handle publishes the
 * criteria surface the labs filter bar consumes — `criteria`, `schema`,
 * `isFiltered`, `criteriaError`, `setCriteria` — with no `sort()`/`filter()`
 * setters beside them.
 *
 * ## What Breaks If These Fail
 * A stale `filter[…]` surviving a clear is an HTTP 500 on the next read. The
 * legacy `query=` key coming back means the module kept two spellings for one
 * intent — the second source of truth the P1-R9 ruling deleted. A `sort()` or
 * `filter()` setter reappearing on the handle means the raw arm is still alive.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientCompanies } from "..";
import {
  distinctCombinations,
  observeRequests,
  seedClientSession
} from "../../../__tests__/criteria-int-kit";
import { corpus, installCompaniesHandler } from "./client-company.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** The `pagination.limit` default `useQuerySchema()` declares — unpaged. */
const DECLARED_LIMIT = "0";

/** Every legacy free-text spelling the migration replaced. */
const LEGACY_KEYS = ["query", "q", "search"];

type Collection = ReturnType<typeof useClientCompanies>;

async function bootCollection(
  initial?: Parameters<typeof useClientCompanies>[0]
): Promise<{ companies: Collection; clientId: string }> {
  const { clientId } = await seedClientSession(server);
  installCompaniesHandler(server, clientId);
  const companies = useClientCompanies(initial);
  await companies.isReady();
  return { companies, clientId };
}

/** A needle taken from a row the RECORDED corpus actually holds. */
function recordedNeedle(): string {
  return corpus()[0].name.slice(0, 3);
}

// -----------------------------------------------------------------------------

describe("client-company — the declared window boots the collection", () => {
  it("asks for the unpaged window its schema declares, with no legacy free-text key", async () => {
    const { clientId } = await seedClientSession(server);
    installCompaniesHandler(server, clientId);
    const observed = observeRequests(server, "/companies");

    const companies = useClientCompanies();
    await companies.isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("limit")).toBe(DECLARED_LIMIT);
    for (const key of LEGACY_KEYS) expect(params.get(key)).toBeNull();
    expect(observed.first().url).toContain(`/clients/${clientId}/companies`);
  });

  it("carries a caller's initial filter on the FIRST request rather than correcting itself", async () => {
    const { clientId } = await seedClientSession(server);
    installCompaniesHandler(server, clientId);
    const observed = observeRequests(server, "/companies");
    const needle = recordedNeedle();

    const companies = useClientCompanies({
      filters: { name: { like: needle } }
    });
    await companies.isReady();
    observed.stop();

    expect(
      new URL(observed.first().url).searchParams.get("filter[name|like]")
    ).toBe(`%${needle}%`);
  });
});

describe("client-company — the free-text filter on the wire", () => {
  it("leaves as filter[name|like] with the translator's % wildcards and narrows the collection", async () => {
    const { companies } = await bootCollection();
    const needle = recordedNeedle();
    const before = companies.data.value.length;
    const observed = observeRequests(server, "/companies");

    companies.setCriteria({ filters: { name: { like: needle } } });

    await vi.waitFor(() =>
      expect(observed.lastParam("filter[name|like]")).toBe(`%${needle}%`)
    );
    await vi.waitFor(() =>
      expect(companies.data.value.length).toBeLessThanOrEqual(before)
    );
    observed.stop();

    for (const request of observed.all()) {
      const params = new URL(request.url).searchParams;
      for (const key of LEGACY_KEYS) expect(params.get(key)).toBeNull();
    }
    expect(companies.data.value.length).toBeGreaterThan(0);
  });

  it("clears the key from the next request rather than leaving it stale", async () => {
    const { companies } = await bootCollection();
    const needle = recordedNeedle();

    companies.setCriteria({ filters: { name: { like: needle } } });
    await vi.waitFor(() =>
      expect(companies.criteria.value.filters).toEqual({
        name: { like: needle }
      })
    );

    const observed = observeRequests(server, "/companies");
    companies.setCriteria({ filters: {} });

    await vi.waitFor(() =>
      expect(companies.criteria.value.filters).toBeUndefined()
    );
    // Landing back on a combination already cached issues no request of its
    // own, so the read-back moves to a FRESH combination and reads the keys off
    // that one.
    companies.setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() => expect(observed.lastParam("limit")).toBe("2"));
    observed.stop();

    expect(observed.filterKeys()).toEqual([]);
  });
});

describe("client-company — the cache law", () => {
  it("issues exactly one request per DISTINCT criteria combination", async () => {
    const { companies } = await bootCollection();
    const needle = recordedNeedle();
    const observed = observeRequests(server, "/companies");

    companies.setCriteria({ filters: { name: { like: needle } } });
    await vi.waitFor(() =>
      expect(observed.lastParam("filter[name|like]")).toBe(`%${needle}%`)
    );

    companies.setCriteria({ filters: {} });
    await vi.waitFor(() =>
      expect(companies.criteria.value.filters).toBeUndefined()
    );

    companies.setCriteria({ filters: { name: { like: needle } } });
    await vi.waitFor(() =>
      expect(companies.criteria.value.filters).toEqual({
        name: { like: needle }
      })
    );
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(observed.all().length).toBe(
      distinctCombinations(observed.all()).length
    );
  });
});

describe("client-company — the criteria surface the filter bar consumes", () => {
  it("publishes the declared schema, the live model and the write verb", async () => {
    const { companies } = await bootCollection();
    const needle = recordedNeedle();

    expect(companies.schema).toMatchObject({
      properties: { filters: { properties: { name: {} } } }
    });
    expect(companies.isFiltered.value).toBe(false);

    companies.setCriteria({ filters: { name: { like: needle } } });

    await vi.waitFor(() => expect(companies.isFiltered.value).toBe(true));
    expect(companies.criteria.value.filters).toEqual({
      name: { like: needle }
    });
    expect(companies.criteriaError.value).toBeUndefined();
  });

  it("has no raw sort()/filter() setters beside setCriteria", async () => {
    const { companies } = await bootCollection();

    expect(companies).not.toHaveProperty("sort");
    expect(companies).not.toHaveProperty("filter");
    expect(typeof companies.setCriteria).toBe("function");
  });

  it("cannot spell a column the schema does not declare — nothing reaches the wire", async () => {
    const { companies } = await bootCollection();
    const observed = observeRequests(server, "/companies");

    companies.setCriteria({ filters: { town: { like: "London" } } } as never);

    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();
    expect(
      observed
        .all()
        .flatMap(request =>
          [...new URL(request.url).searchParams.keys()].filter(key =>
            key.startsWith("filter[town")
          )
        )
    ).toEqual([]);
    expect(companies.criteria.value.filters).toBeUndefined();
  });

  it("surfaces ajv's verdict on criteriaError when a declared column is written the wrong type", async () => {
    const { companies } = await bootCollection();
    const needle = recordedNeedle();

    companies.setCriteria({ filters: { name: { like: 123 } } } as never);

    await vi.waitFor(() => expect(companies.criteriaError.value).toBeDefined());
    expect(companies.criteria.value.filters).toBeUndefined();

    companies.setCriteria({ filters: { name: { like: needle } } });

    await vi.waitFor(() =>
      expect(companies.criteriaError.value).toBeUndefined()
    );
  });
});
