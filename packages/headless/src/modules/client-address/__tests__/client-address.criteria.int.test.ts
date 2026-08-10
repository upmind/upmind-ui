// -----------------------------------------------------------------------------
/**
 * @fileoverview client-address — the criteria wire, cache law and surface
 *
 * ## Job To Be Done
 * Drive the REAL `useClientAddresses()` against MSW-replayed staging
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
import { useClientAddresses } from "..";
import {
  distinctCombinations,
  observeRequests,
  seedClientSession
} from "../../../__tests__/criteria-int-kit";
import { corpus, installAddressesHandler } from "./client-address.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** The `pagination.limit` default `useQuerySchema()` declares — unpaged. */
const DECLARED_LIMIT = "0";

/** Every legacy free-text spelling the migration replaced. */
const LEGACY_KEYS = ["query", "q", "search"];

type Collection = ReturnType<typeof useClientAddresses>;

async function bootCollection(
  initial?: Parameters<typeof useClientAddresses>[0]
): Promise<{ addresses: Collection; clientId: string }> {
  const { clientId } = await seedClientSession(server);
  installAddressesHandler(server, clientId);
  const addresses = useClientAddresses(initial);
  await addresses.isReady();
  return { addresses, clientId };
}

/** A needle taken from a row the RECORDED corpus actually holds. */
function recordedNeedle(): string {
  return corpus()[0].name.slice(0, 3);
}

// -----------------------------------------------------------------------------

describe("client-address — the declared window boots the collection", () => {
  it("asks for the unpaged window its schema declares, with no legacy free-text key", async () => {
    const { clientId } = await seedClientSession(server);
    installAddressesHandler(server, clientId);
    const observed = observeRequests(server, "/addresses");

    const addresses = useClientAddresses();
    await addresses.isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("limit")).toBe(DECLARED_LIMIT);
    for (const key of LEGACY_KEYS) expect(params.get(key)).toBeNull();
    expect(observed.first().url).toContain(`/clients/${clientId}/addresses`);
  });

  it("carries a caller's initial filter on the FIRST request rather than correcting itself", async () => {
    const { clientId } = await seedClientSession(server);
    installAddressesHandler(server, clientId);
    const observed = observeRequests(server, "/addresses");
    const needle = recordedNeedle();

    const addresses = useClientAddresses({
      filters: { name: { like: needle } }
    });
    await addresses.isReady();
    observed.stop();

    expect(
      new URL(observed.first().url).searchParams.get("filter[name|like]")
    ).toBe(`%${needle}%`);
  });
});

describe("client-address — the free-text filter on the wire", () => {
  it("leaves as filter[name|like] with the translator's % wildcards and narrows the collection", async () => {
    const { addresses } = await bootCollection();
    const needle = recordedNeedle();
    const before = addresses.data.value.length;
    const observed = observeRequests(server, "/addresses");

    addresses.setCriteria({ filters: { name: { like: needle } } });

    await vi.waitFor(() =>
      expect(observed.lastParam("filter[name|like]")).toBe(`%${needle}%`)
    );
    await vi.waitFor(() =>
      expect(addresses.data.value.length).toBeLessThanOrEqual(before)
    );
    observed.stop();

    for (const request of observed.all()) {
      const params = new URL(request.url).searchParams;
      for (const key of LEGACY_KEYS) expect(params.get(key)).toBeNull();
    }
    expect(addresses.data.value.length).toBeGreaterThan(0);
  });

  it("clears the key from the next request rather than leaving it stale", async () => {
    const { addresses } = await bootCollection();
    const needle = recordedNeedle();

    addresses.setCriteria({ filters: { name: { like: needle } } });
    await vi.waitFor(() =>
      expect(addresses.criteria.value.filters).toEqual({
        name: { like: needle }
      })
    );

    const observed = observeRequests(server, "/addresses");
    addresses.setCriteria({ filters: {} });

    await vi.waitFor(() =>
      expect(addresses.criteria.value.filters).toBeUndefined()
    );
    // Landing back on a combination already cached issues no request of its
    // own, so the read-back moves to a FRESH combination and reads the keys off
    // that one.
    addresses.setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() => expect(observed.lastParam("limit")).toBe("2"));
    observed.stop();

    expect(observed.filterKeys()).toEqual([]);
  });
});

describe("client-address — the cache law", () => {
  it("issues exactly one request per DISTINCT criteria combination", async () => {
    const { addresses } = await bootCollection();
    const needle = recordedNeedle();
    const observed = observeRequests(server, "/addresses");

    addresses.setCriteria({ filters: { name: { like: needle } } });
    await vi.waitFor(() =>
      expect(observed.lastParam("filter[name|like]")).toBe(`%${needle}%`)
    );

    addresses.setCriteria({ filters: {} });
    await vi.waitFor(() =>
      expect(addresses.criteria.value.filters).toBeUndefined()
    );

    addresses.setCriteria({ filters: { name: { like: needle } } });
    await vi.waitFor(() =>
      expect(addresses.criteria.value.filters).toEqual({
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

describe("client-address — the criteria surface the filter bar consumes", () => {
  it("publishes the declared schema, the live model and the write verb", async () => {
    const { addresses } = await bootCollection();
    const needle = recordedNeedle();

    expect(addresses.schema).toMatchObject({
      properties: { filters: { properties: { name: {} } } }
    });
    expect(addresses.isFiltered.value).toBe(false);

    addresses.setCriteria({ filters: { name: { like: needle } } });

    await vi.waitFor(() => expect(addresses.isFiltered.value).toBe(true));
    expect(addresses.criteria.value.filters).toEqual({
      name: { like: needle }
    });
    expect(addresses.criteriaError.value).toBeUndefined();
  });

  it("has no raw sort()/filter() setters beside setCriteria", async () => {
    const { addresses } = await bootCollection();

    expect(addresses).not.toHaveProperty("sort");
    expect(addresses).not.toHaveProperty("filter");
    expect(typeof addresses.setCriteria).toBe("function");
  });

  it("cannot spell a column the schema does not declare — nothing reaches the wire", async () => {
    const { addresses } = await bootCollection();
    const observed = observeRequests(server, "/addresses");

    addresses.setCriteria({ filters: { town: { like: "London" } } } as never);

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
    expect(addresses.criteria.value.filters).toBeUndefined();
  });

  it("surfaces ajv's verdict on criteriaError when a declared column is written the wrong type", async () => {
    const { addresses } = await bootCollection();
    const needle = recordedNeedle();

    addresses.setCriteria({ filters: { name: { like: 123 } } } as never);

    await vi.waitFor(() => expect(addresses.criteriaError.value).toBeDefined());
    expect(addresses.criteria.value.filters).toBeUndefined();

    addresses.setCriteria({ filters: { name: { like: needle } } });

    await vi.waitFor(() =>
      expect(addresses.criteriaError.value).toBeUndefined()
    );
  });
});
