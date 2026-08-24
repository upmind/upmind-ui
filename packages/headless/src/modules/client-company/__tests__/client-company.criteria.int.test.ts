// -----------------------------------------------------------------------------
/**
 * @fileoverview client-company — the criteria wire, cache law and surface
 *
 * ## Job To Be Done
 * Drive the REAL `useClientCompanies().as(CLIENT)` against MSW-replayed
 * staging recordings and prove the migration off the raw options arm: the
 * collection boots on the window its SCHEMA declares (`limit: 0`, unpaged);
 * the free-text search leaves as `filter[name|like]=%…%` and NOT the legacy
 * bare `query=`; clearing it removes the key rather than leaving it stale; a
 * repeated combination is served from cache; and the handle publishes the
 * criteria surface the labs filter bar consumes — `criteria`, `schema`,
 * `isFiltered`, `criteriaError`, `setCriteria` — with no `sort()`/`filter()`
 * setters beside them.
 *
 * ## Calling-convention correction (2026-08-22)
 * The 2026-08-21 landing of this file drove a FLAT `useClientCompanies()`
 * handle with no `.as(actor)` — a shape ADR-001's four-layer return does not
 * offer, and neither `corpus()` nor `installCompaniesHandler` this file
 * imported ever existed on `client-company.int-helpers.ts`. Every assertion
 * below is the SAME capability, rewritten onto the real scoped surface:
 * `useClientCompanies().as(ScopeActorTypes.CLIENT)`, with the internal
 * criteria handle read off `useInternals().query` (client-email precedent,
 * `list-criteria.int.test.ts`). One sub-case does NOT survive the rewrite —
 * see the note above `describe("… the declared window boots …")` below.
 *
 * ## What Breaks If These Fail
 * A stale `filter[…]` surviving a clear is an HTTP 500 on the next read. The
 * legacy `query=` key coming back means the module kept two spellings for one
 * intent. A `sort()` or `filter()` setter reappearing on the handle means the
 * raw arm is still alive.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientCompanies } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installCompaniesListHandler,
  installCompaniesSearchHandler,
  observeCompanyRequests,
  RECORDED_NAME_NEEDLE,
  recordedRows,
  seedClientSession
} from "./client-company.int-helpers";
import { server } from "./setup.integration";
import { map, uniq } from "lodash-es";
import type { ClientCompanyListQuery } from "../client-company.types";

// -----------------------------------------------------------------------------

/** The `pagination.limit` default `useQuerySchema()` declares — unpaged. */
const DECLARED_LIMIT = "0";

/** Every legacy free-text spelling the migration replaced. */
const LEGACY_KEYS = ["query", "q", "search"];

type Collection = ReturnType<ReturnType<typeof useClientCompanies>["as"]>;

/** The ONE published handle every layer reads — never a shadow copy. */
function handleOf(companies: Collection): ClientCompanyListQuery {
  return (
    companies.useInternals() as unknown as { query: ClientCompanyListQuery }
  ).query;
}

async function bootCollection(): Promise<{
  companies: Collection;
  clientId: string;
}> {
  const { clientId } = await seedClientSession();
  const { primary, secondary } = recordedRows();
  installCompaniesListHandler(server, clientId, [primary, secondary]);
  const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
  await companies.useActions().isReady();
  return { companies, clientId };
}

// -----------------------------------------------------------------------------

describe("client-company — the declared window boots the collection", () => {
  it("asks for the unpaged window its schema declares, with no legacy free-text key", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installCompaniesListHandler(server, clientId, [primary, secondary]);
    const observed = observeCompanyRequests();

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("limit")).toBe(DECLARED_LIMIT);
    for (const key of LEGACY_KEYS) expect(params.get(key)).toBeNull();
    expect(observed.first().url).toContain(`/clients/${clientId}/companies`);
  });

  // The 2026-08-21 file asserted a second case here: an "initial filter"
  // supplied as a constructor argument to `useClientCompanies(...)`. AC-31
  // settles `loadList(): ClientCompanyListQuery` with NO params, and
  // `ClientCompanyServices.loadList` takes nothing either (client-company.
  // types.ts) — there is no seeding argument anywhere on the real public
  // surface to carry that case onto. It is dropped here, not silently: a
  // caller reaches the same outcome through `filterBy`/`setCriteria` after
  // boot, proven in the "free-text filter on the wire" block below.
});

describe("client-company — the free-text filter on the wire", () => {
  it("leaves as filter[name|like] with the translator's % wildcards and narrows the collection", async () => {
    const { clientId } = await seedClientSession();
    installCompaniesSearchHandler(server, clientId);
    const observed = observeCompanyRequests();

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();
    const before = companies.useContext().data.value.length;

    companies.useActions().filterBy({ name: { like: RECORDED_NAME_NEEDLE } });

    await vi.waitFor(() =>
      expect(observed.lastParam("filter[name|like]")).toBe(
        `%${RECORDED_NAME_NEEDLE}%`
      )
    );
    await vi.waitFor(() =>
      expect(companies.useContext().data.value.length).toBeLessThanOrEqual(
        before
      )
    );
    observed.stop();

    for (const request of observed.all()) {
      const params = new URL(request.url).searchParams;
      for (const key of LEGACY_KEYS) expect(params.get(key)).toBeNull();
    }
    expect(companies.useContext().data.value.length).toBeGreaterThan(0);
  });

  it("AC-31 clears the key from the next request rather than leaving it stale — through the one channel", async () => {
    const { companies } = await bootCollection();

    companies.useActions().filterBy({ name: { like: RECORDED_NAME_NEEDLE } });
    await vi.waitFor(() =>
      expect(handleOf(companies).criteria.value.filters).toEqual({
        name: { like: RECORDED_NAME_NEEDLE }
      })
    );

    const observed = observeCompanyRequests();
    companies.useActions().filterBy({});

    await vi.waitFor(() =>
      expect(handleOf(companies).criteria.value.filters).toBeUndefined()
    );
    // Landing back on a combination already cached issues no request of its
    // own, so the read-back moves to a FRESH combination and reads the keys
    // off that one.
    handleOf(companies).setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() => expect(observed.lastParam("limit")).toBe("2"));
    observed.stop();

    expect(
      observed
        .all()
        .flatMap(request => [...new URL(request.url).searchParams.keys()])
        .filter(key => key.startsWith("filter["))
    ).toEqual([]);
  });
});

describe("client-company — the cache law", () => {
  it("issues exactly one request per DISTINCT criteria combination", async () => {
    const { companies } = await bootCollection();
    const observed = observeCompanyRequests();

    companies.useActions().filterBy({ name: { like: RECORDED_NAME_NEEDLE } });
    await vi.waitFor(() =>
      expect(observed.lastParam("filter[name|like]")).toBe(
        `%${RECORDED_NAME_NEEDLE}%`
      )
    );

    companies.useActions().filterBy({});
    await vi.waitFor(() =>
      expect(handleOf(companies).criteria.value.filters).toBeUndefined()
    );

    companies.useActions().filterBy({ name: { like: RECORDED_NAME_NEEDLE } });
    await vi.waitFor(() =>
      expect(handleOf(companies).criteria.value.filters).toEqual({
        name: { like: RECORDED_NAME_NEEDLE }
      })
    );
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    const signatures = map(observed.all(), request => {
      const params = new URL(request.url).searchParams;
      params.sort();
      return params.toString();
    });
    expect(signatures.length).toBe(uniq(signatures).length);
  });
});

describe("client-company — the criteria surface the filter bar consumes", () => {
  it("publishes the declared schema, the live model and the write verb", async () => {
    const { companies } = await bootCollection();

    expect(handleOf(companies).schema).toMatchObject({
      properties: { filters: { properties: { name: {} } } }
    });
    expect(handleOf(companies).isFiltered.value).toBe(false);

    companies.useActions().filterBy({ name: { like: RECORDED_NAME_NEEDLE } });

    await vi.waitFor(() =>
      expect(handleOf(companies).isFiltered.value).toBe(true)
    );
    expect(handleOf(companies).criteria.value.filters).toEqual({
      name: { like: RECORDED_NAME_NEEDLE }
    });
    expect(handleOf(companies).criteriaError.value).toBeUndefined();
  });

  it("has no raw sort()/filter() setters beside setCriteria", async () => {
    const { companies } = await bootCollection();
    const handle = handleOf(companies) as unknown as Record<string, unknown>;

    expect(handle.sort).toBeUndefined();
    expect(handle.filter).toBeUndefined();
    expect(typeof handleOf(companies).setCriteria).toBe("function");
  });

  it("AC-34 cannot spell a column the schema does not declare — nothing reaches the wire", async () => {
    const { companies } = await bootCollection();
    const observed = observeCompanyRequests();

    companies.useActions().filterBy({ town: { like: "London" } } as never);

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
    expect(handleOf(companies).criteria.value.filters).toBeUndefined();
  });

  it("AC-40 surfaces ajv's verdict on criteriaError when a declared column is written the wrong type, leaving the live list standing", async () => {
    const { companies } = await bootCollection();

    handleOf(companies).setCriteria({
      filters: { name: { like: 123 } }
    } as never);

    await vi.waitFor(() =>
      expect(handleOf(companies).criteriaError.value).toBeDefined()
    );
    expect(handleOf(companies).criteria.value.filters).toBeUndefined();
    // The fold decision (design.md B6): a rejected criteria write surfaces on
    // the SAME `error` a fetch failure would, never a second, silent channel.
    expect(companies.useContext().error.value).toBeDefined();

    companies.useActions().filterBy({ name: { like: RECORDED_NAME_NEEDLE } });

    await vi.waitFor(() =>
      expect(handleOf(companies).criteriaError.value).toBeUndefined()
    );
  });
});
