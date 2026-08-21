// -----------------------------------------------------------------------------
/**
 * @fileoverview `withPageWindow` — the declaration's own page window wins
 *
 * ## Job To Be Done
 * With the raw arm deleted, `list()` ALWAYS constructs a criteria, so a
 * collection that declared no pagination still needs a working pager. Rather
 * than a second source of defaults, `withPageWindow` merges a page window
 * UNDER whatever the collection declared. This proves the precedence in both
 * directions: an undeclared list gains the platform's `PAGINATION.limit`, and a
 * declared `limit` default — including the unpaged `0` six migrated modules
 * ship — survives untouched.
 *
 * ## What Breaks If This Fails
 * The precedence inverting refills every `limit: 0` module to a 10-row page:
 * client-address, client-company, client-phone, client-custom-fields,
 * client-email-history and product-categories all quietly stop returning their
 * whole collection, and every consumer that walks the result client-side
 * (the category tree, the address picker) silently truncates.
 */

import { describe, expect, it } from "vitest";
import { PAGINATION, withPageWindow } from "../query.utils";
import type { JsonSchema7 } from "@jsonforms/core";

// -----------------------------------------------------------------------------

/** The `pagination` branch of a schema, as `withPageWindow` leaves it. */
function pagination(schema: JsonSchema7): Record<string, JsonSchema7> {
  return (
    schema.properties?.pagination as { properties: Record<string, JsonSchema7> }
  ).properties;
}

const unpagedDeclaration = {
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: 0 },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } as JsonSchema7
};

describe("withPageWindow — an undeclared list still gets a pager", () => {
  it("gives a declaration with no pagination branch the platform page size", () => {
    const declaration = {
      schema: {
        type: "object",
        properties: { filters: { type: "object", properties: {} } }
      } as JsonSchema7
    };

    const windowed = withPageWindow(declaration);

    expect(pagination(windowed.schema as JsonSchema7).limit).toMatchObject({
      type: "integer",
      minimum: 0,
      default: PAGINATION.limit
    });
    expect(pagination(windowed.schema as JsonSchema7).offset).toMatchObject({
      type: "integer",
      minimum: 0
    });
  });

  it("leaves the rest of the declaration alone", () => {
    const declaration = {
      schema: {
        type: "object",
        properties: {
          filters: {
            type: "object",
            properties: { name: { type: "object", properties: { like: {} } } }
          }
        }
      } as JsonSchema7,
      model: { filters: { name: { like: "acme" } } }
    };

    const windowed = withPageWindow(declaration);

    expect((windowed.schema as JsonSchema7).properties?.filters).toEqual(
      declaration.schema.properties?.filters
    );
    expect(windowed.model).toEqual(declaration.model);
  });
});

describe("withPageWindow — a declared window is not overwritten", () => {
  it("keeps a declared limit default of 0 rather than refilling it", () => {
    const windowed = withPageWindow(unpagedDeclaration);

    expect(pagination(windowed.schema as JsonSchema7).limit.default).toBe(0);
    expect(pagination(windowed.schema as JsonSchema7).limit.default).not.toBe(
      PAGINATION.limit
    );
  });

  it("keeps a declared limit default that is neither 0 nor the platform's", () => {
    const declared = 25;
    const windowed = withPageWindow({
      schema: {
        type: "object",
        properties: {
          pagination: {
            type: "object",
            properties: { limit: { type: "integer", default: declared } }
          }
        }
      } as JsonSchema7
    });

    expect(pagination(windowed.schema as JsonSchema7).limit.default).toBe(
      declared
    );
  });

  it("does not mutate the declaration it was handed", () => {
    const before = JSON.stringify(unpagedDeclaration.schema);

    withPageWindow(unpagedDeclaration);

    expect(JSON.stringify(unpagedDeclaration.schema)).toBe(before);
  });
});
