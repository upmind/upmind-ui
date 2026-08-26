// -----------------------------------------------------------------------------
/**
 * @fileoverview the collection's query schema and filter-bar uischema
 * (integration, AC-41/AC-42/AC-44 — FE-3103 M2 → M3 gap closure)
 *
 * ## Job To Be Done
 * FE-3103 closes four drift items between `client-address` and the M3
 * reference (`client-email`): a filter-bar uischema over the query schema
 * (D1/AC-41), a `sort` branch declaring the two legacy-parity columns
 * (D3/AC-42), and both travelling together off `useContext().schemas.query`
 * so a consumer binds a filter bar without deep-importing the schema file
 * (D4/AC-44). This module exposes neither `useQuerySchema()` nor
 * `useQueryUischema()` from its barrel (design.md: "consumed only by this
 * module's context — no barrel export"), so the only conforming way to prove
 * either exists is through the channel a real consumer would use:
 * `useClientAddresses().as(CLIENT).useContext().schemas.query`.
 *
 * ## What Breaks If These Fail
 * A filter bar cannot be rendered without a consumer hand-authoring a
 * uischema that drifts from the schema it validates against (D1); a sort
 * request naming `name` or `created_at` is unspellable against the schema,
 * so the translator has nothing to translate (D3); or a consumer has to
 * deep-import `client-address.schemas.ts`, breaking the Module Visibility Law
 * this module's barrel otherwise enforces (D4).
 */

import { describe, expect, it } from "vitest";
import { useClientAddresses } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { seedClientSession } from "./client-address.int-helpers";
import { replace, split } from "lodash-es";

// -----------------------------------------------------------------------------

/**
 * The RESOLVED scoped instance `.as(CLIENT)` actually returns — not
 * `ReturnType<typeof useClientAddresses>`, which is the un-resolved
 * `ScopeBuilder` one level up the chain and carries neither `useActions` nor
 * `useContext`.
 */
type ClientAddressesInstance = ReturnType<
  ReturnType<typeof useClientAddresses>["as"]
>;

async function bootAddresses(): Promise<ClientAddressesInstance> {
  await seedClientSession();
  const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
  await addresses.useActions().isReady();
  return addresses;
}

async function bootContext(): Promise<
  ReturnType<ClientAddressesInstance["useContext"]>
> {
  const addresses = await bootAddresses();
  return addresses.useContext();
}

// -----------------------------------------------------------------------------

describe("client-address — the query schema declares sort (AC-42, D3)", () => {
  it("AC-42 declares a sort branch whose field enum is exactly name and created_at", async () => {
    const { schemas } = await bootContext();

    const sort = schemas.query.schema.properties?.sort as {
      items?: { properties?: { field?: { enum?: unknown } } };
    };

    expect(sort).toBeDefined();
    expect(sort.items?.properties?.field?.enum).toEqual(["name", "created_at"]);
  });

  it("AC-42 declares the direction enum legacy parity needs — ascending and descending", async () => {
    const { schemas } = await bootContext();

    const sort = schemas.query.schema.properties?.sort as {
      items?: { properties?: { dir?: { enum?: unknown } } };
    };

    expect(sort.items?.properties?.dir?.enum).toEqual(["asc", "desc"]);
  });
});

describe("client-address — the filter-bar uischema over the query schema (AC-41, D1)", () => {
  it("AC-41 offers a FilterBar with Controls for search, verified and default filters", async () => {
    const { schemas } = await bootContext();

    expect(schemas.query.uischema).toMatchObject({
      type: "FilterBar",
      elements: [
        {
          type: "Control",
          scope: "#/properties/filters/properties/name/properties/like",
          i18n: "form.address_search",
          options: {
            format: "search",
            icon: "search-md",
            noLabel: true,
            optionalText: ""
          }
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

  it("AC-41 scopes at a path the schema itself actually declares — no drift between the two", async () => {
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

    // Walk the schema's own property tree by the uischema's own scope path —
    // proves the two are not two independently hand-authored surfaces.
    let node: Record<string, unknown> = schemas.query.schema as Record<
      string,
      unknown
    >;
    for (const segment of segments) {
      node = (node as Record<string, Record<string, unknown>>)[segment];
      expect(node).toBeDefined();
    }
  });
});

describe("client-address — schemas.query travels as one channel (AC-44, D4)", () => {
  it("AC-44 exposes both the schema and the uischema off useContext().schemas.query", async () => {
    const { schemas } = await bootContext();

    expect(schemas).toHaveProperty("query");
    expect(schemas.query.schema).toBeDefined();
    expect(schemas.query.uischema).toBeDefined();
  });

  it("AC-44 declares the same filters/sort/pagination branches useQuerySchema() is documented to declare", async () => {
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

  it("AC-44 returns the SAME schema/uischema object identity across two useContext() calls, not a fresh allocation per call", async () => {
    const addresses = await bootAddresses();

    const first = addresses.useContext().schemas.query;
    const second = addresses.useContext().schemas.query;

    expect(second.schema).toBe(first.schema);
    expect(second.uischema).toBe(first.uischema);
    expect(second.sortUischema).toBe(first.sortUischema);
  });
});

describe("client-address — the pagination branch carries no dead ajv keyword", () => {
  it("declares no dependencies keyword on pagination — useDefaults resolves limit's own default before dependencies could ever fire", async () => {
    const { schemas } = await bootContext();

    expect(schemas.query.schema.properties?.pagination).not.toHaveProperty(
      "dependencies"
    );
  });
});
