// -----------------------------------------------------------------------------
/**
 * @fileoverview `translateQuery` — the sort guard, and what `order=` carries
 *
 * ## Job To Be Done
 * `order=` on an undeclared column is an HTTP 500, so the translator emits only
 * sort entries whose field the schema's own `enum` declares. This proves the
 * guard on the seven migrated modules' real sort vocabulary: a declared field
 * survives, an undeclared one is dropped WITHOUT dropping its declared
 * neighbours, precedence stays positional, and `desc` becomes the leading-minus
 * wire form.
 *
 * ## What Breaks If This Fails
 * An ungated field ships `order=<unknown>` and the collection 500s — the exact
 * exposure the criteria migration exists to close, since a model-only
 * declaration had no enum to guard with.
 */

import { describe, expect, it } from "vitest";
import { RequestSortDirection, SortDirection, translateQuery } from "..";
import type { JsonSchema7 } from "@jsonforms/core";

// -----------------------------------------------------------------------------

/** client-email-history's real sort vocabulary — `created_at` and `subject`. */
const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    sort: {
      type: "array",
      items: {
        type: "object",
        required: ["field", "dir"],
        properties: {
          field: { enum: ["created_at", "subject"] },
          dir: { enum: ["asc", "desc"] }
        }
      }
    }
  }
} as JsonSchema7;

describe("translateQuery — sort fields the schema declares", () => {
  it("carries a declared ascending field as the bare column", () => {
    const props = translateQuery(schema, {
      sort: [{ field: "subject", dir: SortDirection.ASC }]
    });

    expect(props.sort).toEqual([RequestSortDirection.ASC, "subject"]);
  });

  it("carries a declared descending field in the leading-minus form", () => {
    const props = translateQuery(schema, {
      sort: [{ field: "created_at", dir: SortDirection.DESC }]
    });

    expect(props.sort).toEqual([RequestSortDirection.DESC, "created_at"]);
  });

  it("keeps precedence positional across two declared fields", () => {
    const props = translateQuery(schema, {
      sort: [
        { field: "created_at", dir: SortDirection.DESC },
        { field: "subject", dir: SortDirection.ASC }
      ]
    });

    expect(props.sort).toEqual([
      [RequestSortDirection.DESC, "created_at"],
      [RequestSortDirection.ASC, "subject"]
    ]);
  });
});

describe("translateQuery — sort fields the schema does not declare", () => {
  it("drops an undeclared field rather than shipping an order= the API 500s on", () => {
    const props = translateQuery(schema, {
      sort: [{ field: "bounced_at", dir: SortDirection.ASC }]
    });

    expect(props.sort).toEqual([]);
  });

  it("drops only the undeclared entry, keeping its declared neighbours", () => {
    const props = translateQuery(schema, {
      sort: [
        { field: "bounced_at", dir: SortDirection.ASC },
        { field: "subject", dir: SortDirection.DESC }
      ]
    });

    expect(props.sort).toEqual([RequestSortDirection.DESC, "subject"]);
  });

  it("drops every entry when the schema declares no sort branch at all", () => {
    const props = translateQuery(
      { type: "object", properties: {} } as JsonSchema7,
      { sort: [{ field: "created_at", dir: SortDirection.DESC }] }
    );

    expect(props.sort).toEqual([]);
  });
});
