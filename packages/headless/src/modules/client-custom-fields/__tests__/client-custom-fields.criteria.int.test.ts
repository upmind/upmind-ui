// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields — the criteria wire, cache law and surface
 *
 * ## Job To Be Done
 * Drive the REAL `useClientCustomFields()` against MSW-replayed staging
 * recordings and prove the migration off the raw options arm: the literal
 * `sort: [[ASC, "order"]]` the service used to hardcode is now the SCHEMA's own
 * declared default and reaches the wire as `order=order`; a caller can re-sort
 * to a declared field and cannot spell an undeclared one; the free-text search
 * leaves as `filter[name|like]=%…%` rather than the legacy bare `query=`; the
 * collection-scoping `filter[object_type]` stays on the URL where it belongs;
 * and a repeated combination is served from cache.
 *
 * ## What Breaks If These Fail
 * The declared sort silently vanishing reorders the client's custom-field form
 * — the fields render in whatever order the API happens to return, which is the
 * behaviour the hardcoded literal existed to prevent. An `order=` on a column
 * the schema does not declare is an HTTP 500 on the whole collection.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientCustomFields } from "..";
import {
  distinctCombinations,
  observeRequests,
  seedClientSession
} from "../../../__tests__/criteria-int-kit";
import { SortDirection } from "../../query";
import { CUSTOM_FIELD_DEFAULT_SORT } from "../client-custom-fields.types";
import {
  installCustomFieldsHandler,
  recordedNeedle
} from "./client-custom-fields.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** The `pagination.limit` default `useQuerySchema()` declares — unpaged. */
const DECLARED_LIMIT = "0";

/** Every legacy free-text spelling the migration replaced. */
const LEGACY_KEYS = ["query", "q", "search"];

type Collection = ReturnType<typeof useClientCustomFields>;

async function bootCollection(
  initial?: Parameters<typeof useClientCustomFields>[0]
): Promise<Collection> {
  await seedClientSession(server);
  installCustomFieldsHandler(server);
  const fields = useClientCustomFields(initial);
  await fields.isReady();
  return fields;
}

// -----------------------------------------------------------------------------

describe("client-custom-fields — the declared sort IS the floor", () => {
  it("boots on the sort the schema declares, carried as the literal order param", async () => {
    await seedClientSession(server);
    installCustomFieldsHandler(server);
    const observed = observeRequests(server, "/custom_fields");

    const fields = useClientCustomFields();
    await fields.isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("order")).toBe("order");
    expect(params.get("limit")).toBe(DECLARED_LIMIT);
    expect(fields.criteria.value.sort).toEqual(CUSTOM_FIELD_DEFAULT_SORT);
  });

  it("keeps the collection-scoping filter[object_type] on the URL, unmixed with the criteria", async () => {
    await seedClientSession(server);
    installCustomFieldsHandler(server);
    const observed = observeRequests(server, "/custom_fields");

    const fields = useClientCustomFields();
    await fields.isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("filter[object_type]")).toBe("client");
    expect(fields.criteria.value.filters).toBeUndefined();
  });

  it("re-sorts to the other declared field in the leading-minus wire form", async () => {
    const fields = await bootCollection();
    const observed = observeRequests(server, "/custom_fields");

    fields.setCriteria({ sort: [{ field: "name", dir: SortDirection.DESC }] });

    await vi.waitFor(() => expect(observed.lastParam("order")).toBe("-name"));
    observed.stop();
    expect(fields.criteria.value.sort).toEqual([
      { field: "name", dir: SortDirection.DESC }
    ]);
  });

  it("cannot spell a sort field the schema does not declare", async () => {
    const fields = await bootCollection();
    const observed = observeRequests(server, "/custom_fields");

    fields.setCriteria({
      sort: [{ field: "created_at", dir: SortDirection.DESC }]
    } as never);

    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();
    for (const request of observed.all()) {
      expect(new URL(request.url).searchParams.get("order")).not.toBe(
        "-created_at"
      );
    }
    expect(fields.criteria.value.sort).toEqual(CUSTOM_FIELD_DEFAULT_SORT);
  });
});

describe("client-custom-fields — the free-text filter on the wire", () => {
  it("leaves as filter[name|like] with the translator's % wildcards, no legacy key", async () => {
    const fields = await bootCollection();
    const needle = recordedNeedle();
    const observed = observeRequests(server, "/custom_fields");

    fields.setCriteria({ filters: { name: { like: needle } } });

    await vi.waitFor(() =>
      expect(observed.lastParam("filter[name|like]")).toBe(`%${needle}%`)
    );
    observed.stop();

    for (const request of observed.all()) {
      const params = new URL(request.url).searchParams;
      for (const key of LEGACY_KEYS) expect(params.get(key)).toBeNull();
    }
    expect(fields.data.value.length).toBeGreaterThan(0);
  });

  it("clears the key from the next request rather than leaving it stale", async () => {
    const fields = await bootCollection();
    const needle = recordedNeedle();

    fields.setCriteria({ filters: { name: { like: needle } } });
    await vi.waitFor(() =>
      expect(fields.criteria.value.filters).toEqual({ name: { like: needle } })
    );

    const observed = observeRequests(server, "/custom_fields");
    fields.setCriteria({ filters: {} });

    await vi.waitFor(() =>
      expect(fields.criteria.value.filters).toBeUndefined()
    );
    fields.setCriteria({ pagination: { limit: 1 } });
    await vi.waitFor(() => expect(observed.lastParam("limit")).toBe("1"));
    observed.stop();

    expect(
      observed.filterKeys().filter(key => key.startsWith("filter[name"))
    ).toEqual([]);
  });
});

describe("client-custom-fields — the cache law", () => {
  it("issues exactly one request per DISTINCT criteria combination", async () => {
    const fields = await bootCollection();
    const needle = recordedNeedle();
    const observed = observeRequests(server, "/custom_fields");

    fields.setCriteria({ filters: { name: { like: needle } } });
    await vi.waitFor(() =>
      expect(observed.lastParam("filter[name|like]")).toBe(`%${needle}%`)
    );

    fields.setCriteria({ filters: {} });
    await vi.waitFor(() =>
      expect(fields.criteria.value.filters).toBeUndefined()
    );

    fields.setCriteria({ filters: { name: { like: needle } } });
    await vi.waitFor(() =>
      expect(fields.criteria.value.filters).toEqual({ name: { like: needle } })
    );
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(observed.all().length).toBe(
      distinctCombinations(observed.all()).length
    );
  });
});

describe("client-custom-fields — the criteria surface", () => {
  it("publishes the declared schema, the live model and the write verb", async () => {
    const fields = await bootCollection();
    const needle = recordedNeedle();

    expect(fields.schema).toMatchObject({
      properties: { filters: { properties: { name: {} } }, sort: {} }
    });
    expect(fields.isFiltered.value).toBe(false);

    fields.setCriteria({ filters: { name: { like: needle } } });

    await vi.waitFor(() => expect(fields.isFiltered.value).toBe(true));
    expect(fields.criteriaError.value).toBeUndefined();
  });

  it("has no raw sort()/filter() setters beside setCriteria", async () => {
    const fields = await bootCollection();

    expect(fields).not.toHaveProperty("sort");
    expect(fields).not.toHaveProperty("filter");
    expect(typeof fields.setCriteria).toBe("function");
  });
});
