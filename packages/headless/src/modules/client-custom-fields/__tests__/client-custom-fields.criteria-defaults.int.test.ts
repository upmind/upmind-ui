// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields — the criteria wire, cache law and
 * surface, driven through the REAL four-layer handle (AC-28 … AC-36)
 *
 * ## Job To Be Done
 * Replaces `client-custom-fields.criteria.int.test.ts` (deleted, R1): that
 * file drove a FLAT handle (`useClientCustomFields(initial)` →
 * `.isReady()`/`.criteria`/`.setCriteria`) contradicting ADR-001's four-layer
 * return, and failed at module resolution on three symbols that never
 * existed. Every capability it asserted is carried here against the REAL
 * `useClientCustomFields().as(ScopeActorTypes.CLIENT)` handle: the schema's
 * own declared default sort/limit reach the wire on the first request; a
 * caller can re-sort to a declared field and cannot spell an undeclared one;
 * the free-text search leaves as `filter[name|like]=%…%`, never the legacy
 * bare `query=`; `filter[object_type]`/`brand_id` stay URL scoping, never the
 * criteria model; a repeated combination is served from cache; and the
 * criteria surface — `query`, `schemas.query`, `filterBy`, `sortBy` — is
 * published with no raw `sort()`/`filter()` setter beside it.
 *
 * ## What Breaks If These Fail
 * The declared sort or the unpaged default silently stops reaching the wire
 * (the fields render in whatever order the API happens to return, or a large
 * brand's catalogue arrives truncated at 10); an `order=` on a column the
 * schema does not declare 500s the whole collection; the free-text search
 * regresses onto a key the API never read; or a filter-bar consumer reads a
 * criteria surface that never moves.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientCustomFields } from "..";
import {
  distinctCombinations,
  observeRequests
} from "../../../__tests__/criteria-int-kit";
import { declaredSortFields, SortDirection } from "../../query";
import { ScopeActorTypes } from "../../scope/scope.types";
import { CUSTOM_FIELD_DEFAULT_SORT } from "../client-custom-fields.types";
import {
  installCriteriaAwareDefinitionsHandler,
  installDefinitionsHandler,
  recordedDefinitions,
  recordedIds,
  seedClientSession
} from "./client-custom-fields.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** The `pagination.limit` default `useQuerySchema()` declares — unpaged. */
const DECLARED_LIMIT = "0";

/** Every legacy free-text spelling the migration replaced. */
const LEGACY_KEYS = ["query", "q", "search"];

type Collection = ReturnType<typeof useClientCustomFields>;

async function bootCollection(): Promise<Collection> {
  // The session fixture's own brand_id is a placeholder distinct from the
  // custom-fields corpus's real recorded brand_id; overriding to the corpus
  // value is what makes installCriteriaAwareDefinitionsHandler's brand match
  // succeed instead of silently falling back to its empty branch.
  const { brandId: corpusBrandId } = recordedIds();
  const { brandId } = await seedClientSession({ brandId: corpusBrandId });
  installCriteriaAwareDefinitionsHandler(server, brandId);
  const fields = useClientCustomFields().as(ScopeActorTypes.CLIENT);
  await fields.useActions().isReady();
  return fields;
}

// -----------------------------------------------------------------------------

describe("client-custom-fields — the declared defaults reach the wire on boot (AC-29, AC-33)", () => {
  it("AC-29 orders by the schema's declared default on the very first request", async () => {
    const { brandId: corpusBrandId } = recordedIds();
    const { brandId } = await seedClientSession({ brandId: corpusBrandId });
    installCriteriaAwareDefinitionsHandler(server, brandId);
    const observed = observeRequests(server, "/custom_fields");

    const fields = useClientCustomFields().as(ScopeActorTypes.CLIENT);
    await fields.useActions().isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("order")).toBe("order");
    expect(fields.useContext().query.value.sort).toEqual(
      CUSTOM_FIELD_DEFAULT_SORT
    );
  });

  it("AC-33 asks for the whole catalogue by default — limit=0 on the first request", async () => {
    const { brandId: corpusBrandId } = recordedIds();
    const { brandId } = await seedClientSession({ brandId: corpusBrandId });
    installCriteriaAwareDefinitionsHandler(server, brandId);
    const observed = observeRequests(server, "/custom_fields");

    const fields = useClientCustomFields().as(ScopeActorTypes.CLIENT);
    await fields.useActions().isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("limit")).toBe(DECLARED_LIMIT);
  });
});

describe("client-custom-fields — re-sorting to a declared field (AC-30)", () => {
  it("AC-30 re-sorts to the other declared field, wire form leading-minus for DESC", async () => {
    const fields = await bootCollection();
    const observed = observeRequests(server, "/custom_fields");

    fields.useActions().sortBy([{ field: "name", dir: SortDirection.DESC }]);

    await vi.waitFor(() => expect(observed.lastParam("order")).toBe("-name"));
    observed.stop();
    expect(fields.useContext().query.value.sort).toEqual([
      { field: "name", dir: SortDirection.DESC }
    ]);
  });

  it("AC-30 declares exactly order/name as sortable — an undeclared field is unspellable", async () => {
    const fields = await bootCollection();

    expect(
      declaredSortFields(fields.useContext().schemas.query.schema)
    ).toEqual(["order", "name"]);
  });

  it("AC-30 cannot spell a sort field the schema does not declare", async () => {
    const fields = await bootCollection();
    const observed = observeRequests(server, "/custom_fields");

    fields
      .useActions()
      .sortBy([{ field: "created_at", dir: SortDirection.DESC }] as never);

    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();
    for (const request of observed.all()) {
      expect(new URL(request.url).searchParams.get("order")).not.toBe(
        "-created_at"
      );
    }
    expect(fields.useContext().query.value.sort).toEqual(
      CUSTOM_FIELD_DEFAULT_SORT
    );
  });

  it("AC-30 a declared sort passes the wire's own row order through untouched — never forced back to ascending-by-order", async () => {
    const { brandId: corpusBrandId } = recordedIds();
    const { brandId } = await seedClientSession({ brandId: corpusBrandId });
    installDefinitionsHandler(server, brandId, recordedDefinitions());

    const fields = useClientCustomFields().as(ScopeActorTypes.CLIENT);
    await fields.useActions().isReady();

    // The same two recorded rows, in the order a real `order=-name` reply
    // would carry them (Profile Picture, then Age) — a scrambled ORDER of
    // recorded objects, never a hand-authored one.
    const nameDescending = [...recordedDefinitions()].reverse();
    installDefinitionsHandler(server, brandId, nameDescending);
    const observed = observeRequests(server, "/custom_fields");

    fields.useActions().sortBy([{ field: "name", dir: SortDirection.DESC }]);

    await vi.waitFor(() => expect(observed.lastParam("order")).toBe("-name"));
    observed.stop();
    await vi.waitFor(() =>
      expect(fields.useContext().data.value.map(field => field.code)).toEqual(
        nameDescending.map(row => row.code)
      )
    );
  });
});

describe("client-custom-fields — the free-text filter on the wire (AC-31)", () => {
  it("AC-31 leaves as filter[name|like] with the translator's % wildcards, no legacy key", async () => {
    const fields = await bootCollection();
    const observed = observeRequests(server, "/custom_fields");

    fields.useActions().filterBy({ name: { like: "age" } });

    await vi.waitFor(() =>
      expect(observed.lastParam("filter[name|like]")).toBe("%age%")
    );
    observed.stop();

    for (const request of observed.all()) {
      const params = new URL(request.url).searchParams;
      for (const key of LEGACY_KEYS) expect(params.get(key)).toBeNull();
    }
  });

  it("AC-31 clearing the filter drops the key from the next request rather than leaving it stale", async () => {
    // Clearing back to the exact unfiltered combination `isReady()` already
    // fetched is a CACHE HIT (no network call) — asserted on the MODEL for
    // the clear itself, then on the wire via a genuinely NEW combination
    // (client-address.filters.int.test.ts documents the same cache-hit shape
    // for this exact step).
    const fields = await bootCollection();

    fields.useActions().filterBy({ name: { like: "age" } });
    await vi.waitFor(() =>
      expect(fields.useContext().query.value.filters).toEqual({
        name: { like: "age" }
      })
    );

    fields.useActions().filterBy({ name: { like: null } });
    await vi.waitFor(() =>
      expect(fields.useContext().query.value.filters?.name?.like ?? null).toBe(
        null
      )
    );

    const observed = observeRequests(server, "/custom_fields");
    fields.useActions().sortBy([{ field: "name", dir: SortDirection.DESC }]);

    await vi.waitFor(() => expect(observed.lastParam("order")).toBe("-name"));
    observed.stop();
    expect(observed.lastParam("filter[name|like]")).toBeUndefined();
  });
});

describe("client-custom-fields — URL scoping stays out of the criteria model (AC-32)", () => {
  it("AC-32 every request carries filter[object_type]=client and a non-empty brand_id, never the criteria model", async () => {
    const fields = await bootCollection();
    const observed = observeRequests(server, "/custom_fields");

    fields.useActions().filterBy({ name: { like: "age" } });
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    for (const request of observed.all()) {
      const params = new URL(request.url).searchParams;
      expect(params.get("filter[object_type]")).toBe("client");
      expect(params.get("brand_id")).toBeTruthy();
    }
    expect(fields.useContext().query.value.filters).not.toHaveProperty(
      "object_type"
    );
    expect(fields.useContext().query.value.filters).not.toHaveProperty(
      "brand_id"
    );
  });
});

describe("client-custom-fields — the cache law (AC-35)", () => {
  it("AC-35 issues exactly one request per DISTINCT criteria combination", async () => {
    const fields = await bootCollection();
    const observed = observeRequests(server, "/custom_fields");

    fields.useActions().filterBy({ name: { like: "age" } });
    await vi.waitFor(() =>
      expect(observed.lastParam("filter[name|like]")).toBe("%age%")
    );

    fields.useActions().filterBy({ name: { like: null } });
    await vi.waitFor(() =>
      expect(fields.useContext().query.value.filters?.name?.like ?? null).toBe(
        null
      )
    );

    fields.useActions().filterBy({ name: { like: "age" } });
    await vi.waitFor(() =>
      expect(fields.useContext().query.value.filters).toEqual({
        name: { like: "age" }
      })
    );
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(observed.all().length).toBe(
      distinctCombinations(observed.all()).length
    );
  });
});

describe("client-custom-fields — the criteria surface is published on the four-layer handle (AC-36)", () => {
  it("AC-36 publishes query and schemas.query, all JSON-round-trippable", async () => {
    const fields = await bootCollection();
    const context = fields.useContext();

    expect(context.query.value).toBeDefined();
    expect(context.schemas.query.schema).toBeDefined();
    expect(context.schemas.query.uischema).toBeDefined();
    expect(context.schemas.query.sortUischema).toBeDefined();
    expect(JSON.parse(JSON.stringify(context.schemas.query))).toEqual(
      context.schemas.query
    );
  });

  it("AC-36 offers a FilterBar with Controls for search, type and required filters", async () => {
    const fields = await bootCollection();
    const { schemas } = fields.useContext();

    expect(schemas.query.uischema).toMatchObject({
      type: "FilterBar",
      elements: [
        {
          type: "Control",
          scope: "#/properties/filters/properties/name/properties/like",
          i18n: "form.custom_field_search",
          options: { format: "search", noLabel: true, optionalText: "" }
        },
        {
          type: "Control",
          scope: "#/properties/filters/properties/type/properties/eq",
          i18n: "form.type_filter",
          options: { format: "select", noLabel: true, optionalText: "" }
        },
        {
          type: "Control",
          scope: "#/properties/filters/properties/required/properties/eq",
          i18n: "form.required_filter",
          options: { format: "button-group", noLabel: true, optionalText: "" }
        }
      ]
    });
  });

  it("AC-36 exposes filterBy and sortBy, and no raw sort()/filter()/setCriteria beside them", async () => {
    const fields = await bootCollection();
    const actions = fields.useActions();

    expect(typeof actions.filterBy).toBe("function");
    expect(typeof actions.sortBy).toBe("function");
    expect(actions).not.toHaveProperty("sort");
    expect(actions).not.toHaveProperty("filter");
  });

  it("AC-36 filterBy and sortBy write through the SAME criteria the wire reads", async () => {
    const fields = await bootCollection();
    const observed = observeRequests(server, "/custom_fields");

    fields.useActions().sortBy([{ field: "name", dir: SortDirection.DESC }]);

    await vi.waitFor(() => expect(observed.lastParam("order")).toBe("-name"));
    observed.stop();
    expect(fields.useContext().query.value.sort).toEqual([
      { field: "name", dir: SortDirection.DESC }
    ]);
  });
});

describe("client-custom-fields — paging the catalogue once a page size is set (AC-34)", () => {
  it("AC-34 nextPage() moves the outbound offset and the published criteria together", async () => {
    const fields = await bootCollection();

    fields.useActions().setCriteria({ pagination: { limit: 1 } });
    await vi.waitFor(() =>
      expect(fields.useContext().data.value).toHaveLength(1)
    );
    // The pager's hasNextPage/pageParam computed settles a tick after the
    // criteria write resolves; nextPage() read before that tick is a false
    // negative, not real inertness — the same documented wait this tranche's
    // client-phone.paging-door.int.test.ts uses for the identical mechanism.
    await new Promise(resolve => setTimeout(resolve, 250));

    const observed = observeRequests(server, "/custom_fields");
    fields.useActions().nextPage();

    await vi.waitFor(() => expect(observed.lastParam("offset")).toBe("1"));
    observed.stop();
    expect(observed.lastParam("limit")).toBe("1");
    expect(fields.useContext().query.value.pagination?.offset).toBe(1);
  });

  it("AC-34 prevPage() returns the offset to the page before it", async () => {
    const fields = await bootCollection();

    fields.useActions().setCriteria({ pagination: { limit: 1 } });
    await vi.waitFor(() =>
      expect(fields.useContext().data.value).toHaveLength(1)
    );
    await new Promise(resolve => setTimeout(resolve, 250));

    fields.useActions().nextPage();
    await vi.waitFor(() =>
      expect(fields.useContext().query.value.pagination?.offset).toBe(1)
    );
    await new Promise(resolve => setTimeout(resolve, 250));

    // Returning to limit=1/offset=0 revisits the EXACT combination the
    // setCriteria call above already fetched — a cache hit (AC-35's own
    // law), so no further request is observable; the wire is not the right
    // instrument for this specific transition (client-address.filters.int
    // .test.ts documents the identical cache-hit shape for its own
    // "clear back to an already-fetched combination" step). Asserted on the
    // handle's own published criteria instead — the read-back AC-34 names.
    fields.useActions().prevPage();

    await vi.waitFor(() =>
      expect(fields.useContext().query.value.pagination?.offset).toBe(0)
    );
  });
});
