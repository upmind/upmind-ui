// -----------------------------------------------------------------------------
/**
 * @fileoverview client-company query schema, and the criteria surface on
 * useContext() (integration, AC-32, AC-33, AC-35)
 *
 * ## Job To Be Done
 * `useQuerySchema()` declares a `sort` branch whose field enum is EXACTLY
 * `["name", "created_at"]` — `default` is deliberately excluded, because no
 * legacy consumer orders by it and an unknown `order=` column is an HTTP 500
 * (requirements.md's oracle table). `useContext()` publishes the live
 * criteria at `query` (not a shadow copy) and the schema/uischema/sortUischema
 * triple at `schemas.query`, so a consumer binds a filter bar and a sort
 * control without deep-importing `client-company.schemas.ts`.
 *
 * ## What Breaks If These Fail
 * Re-admitting `default` to the sort enum revives the exact drift AC-32
 * forbids. A `useContext().query` that drifts from the published criteria, or
 * a `schemas.query` missing any of its three members, breaks a filter bar or
 * a sort control that binds to it without a byte-for-byte re-derivation.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientCompanies } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  RECORDED_NAME_NEEDLE,
  seedClientSession
} from "./client-company.int-helpers";
import { replace, split } from "lodash-es";

// -----------------------------------------------------------------------------

async function bootContext(): Promise<
  ReturnType<ReturnType<typeof useClientCompanies>["useContext"]>
> {
  await seedClientSession();
  const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
  await companies.useActions().isReady();
  return companies.useContext();
}

// -----------------------------------------------------------------------------

describe("client-company — the query schema declares sort (AC-32)", () => {
  it("AC-32 excludes 'default' from the sort field enum — an unknown order column is an HTTP 500", async () => {
    const { schemas } = await bootContext();

    const sort = schemas.query.schema.properties?.sort as {
      items?: { properties?: { field?: { enum?: unknown } } };
    };

    expect(sort).toBeDefined();
    expect(sort.items?.properties?.field?.enum).toEqual(["name", "created_at"]);
  });

  it("AC-32 declares the direction enum legacy parity needs — ascending and descending", async () => {
    const { schemas } = await bootContext();

    const sort = schemas.query.schema.properties?.sort as {
      items?: { properties?: { dir?: { enum?: unknown } } };
    };

    expect(sort.items?.properties?.dir?.enum).toEqual(["asc", "desc"]);
  });

  it("AC-32 keeps pagination.limit's declared default at 0 — the unpaged legacy read", async () => {
    const { schemas } = await bootContext();

    const pagination = schemas.query.schema.properties?.pagination as {
      properties?: { limit?: { default?: unknown } };
    };

    expect(pagination.properties?.limit?.default).toBe(0);
  });
});

describe("client-company — the filter-bar uischema over the query schema (AC-33)", () => {
  it("AC-33 offers a FilterBar with Controls for search, verified and default filters", async () => {
    const { schemas } = await bootContext();

    expect(schemas.query.uischema).toMatchObject({
      type: "FilterBar",
      elements: [
        {
          type: "Control",
          scope: "#/properties/filters/properties/name/properties/like",
          i18n: "form.company_search",
          options: { format: "search", noLabel: true, optionalText: "" }
        },
        {
          type: "Control",
          scope: "#/properties/filters/properties/verified/properties/eq",
          i18n: "form.verified_filter",
          options: { format: "button-group", noLabel: true, optionalText: "" }
        },
        {
          type: "Control",
          scope: "#/properties/filters/properties/default/properties/eq",
          i18n: "form.default_filter",
          options: { format: "button-group", noLabel: true, optionalText: "" }
        }
      ]
    });
  });

  it("AC-33 scopes at a path the schema itself actually declares — no drift between the two", async () => {
    const { schemas } = await bootContext();

    const segments = split(
      replace(
        (
          schemas.query.uischema as {
            elements: Array<{ scope: string }>;
          }
        ).elements[0].scope,
        /^#\//,
        ""
      ),
      "/"
    );

    let node: Record<string, unknown> = schemas.query.schema as Record<
      string,
      unknown
    >;
    for (const segment of segments) {
      node = (node as Record<string, Record<string, unknown>>)[segment];
      expect(node).toBeDefined();
    }
  });

  it("AC-33 declares a sortUischema Control over the sort branch", async () => {
    const { schemas } = await bootContext();

    expect(schemas.query.sortUischema).toMatchObject({
      type: "Control",
      scope: "#/properties/sort"
    });
  });
});

describe("client-company — the active criteria surfaces on useContext().query (AC-35)", () => {
  it("AC-35 publishes the live criteria on useContext().query, not a copy of it", async () => {
    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await seedClientSession();
    await companies.useActions().isReady();

    companies.useActions().filterBy({ name: { like: RECORDED_NAME_NEEDLE } });

    await vi.waitFor(() =>
      expect(companies.useContext().query.value.filters).toEqual({
        name: { like: RECORDED_NAME_NEEDLE }
      })
    );
  });
});

describe("client-company — schemas.query travels as one channel (AC-33, AC-35)", () => {
  it("AC-35 exposes schema, uischema and sortUischema together off useContext().schemas.query", async () => {
    const { schemas } = await bootContext();

    expect(schemas).toHaveProperty("query");
    expect(schemas.query.schema).toBeDefined();
    expect(schemas.query.uischema).toBeDefined();
    expect(schemas.query.sortUischema).toBeDefined();
  });

  it("AC-35 declares the same filters/sort/pagination branches useQuerySchema() is documented to declare", async () => {
    const { schemas } = await bootContext();

    expect(schemas.query.schema).toMatchObject({
      type: "object",
      properties: {
        filters: { properties: { name: { properties: { like: {} } } } },
        sort: {},
        pagination: { properties: { limit: {}, offset: {} } }
      }
    });
  });
});
