// -----------------------------------------------------------------------------
/**
 * @fileoverview tickets — the collection's query schema shape (AC-1, AC-5,
 * AC-6)
 *
 * ## Job To Be Done
 * Pin the query schema's wire-shaping rules: the active/closed split runs on
 * the undotted `statusCode` `eq`/`neq` against a STRING status code, never a
 * boolean, and never the dotted `status.code` spelling (R9 — a dotted schema
 * key is read by `useModelParser` as a lodash PATH and 422s) (AC-1); `reference`
 * is a bare string leaf so the translator emits the
 * EQUAL wire key, never a nested operator object shaped like CONTAINS
 * (AC-5); quick search only fires at 3+ characters (AC-6).
 *
 * ## What Breaks If These Fail
 * The active/closed split silently stops filtering by status, the reference
 * filter starts matching partial references instead of the exact one, or
 * search fires a request on every keystroke instead of waiting for a real
 * term.
 */

import { describe, expect, it } from "vitest";
import { useQuerySchema } from "../tickets.schemas";

// -----------------------------------------------------------------------------

describe("tickets query schema — statusCode operators (AC-1/AC-2)", () => {
  it("declares eq and neq against a STRING status code, never a boolean", () => {
    const schema = useQuerySchema() as {
      properties: {
        filters: {
          properties: {
            statusCode: {
              properties: { eq: { type: unknown }; neq: { type: unknown } };
            };
          };
        };
      };
    };
    const statusCode = schema.properties.filters.properties.statusCode;
    expect(statusCode.properties.eq.type).toContain("string");
    expect(statusCode.properties.neq.type).toContain("string");
  });

  it("never declares the dotted status.code spelling (R9 — an undotted key is required)", () => {
    const schema = useQuerySchema() as {
      properties: { filters: { properties: Record<string, unknown> } };
    };
    expect(
      Object.prototype.hasOwnProperty.call(
        schema.properties.filters.properties,
        "status.code"
      )
    ).toBe(false);
  });
});

describe("tickets query schema — reference is a bare EQUAL leaf (AC-5)", () => {
  it("types reference as a string, never a nested operator object", () => {
    const schema = useQuerySchema() as {
      properties: {
        filters: { properties: { reference: { type: unknown } } };
      };
    };
    const reference = schema.properties.filters.properties.reference;
    expect(reference.type).not.toBe("object");
    expect(reference.type).toContain("string");
  });
});

describe("tickets query schema — quick search minimum length (AC-6)", () => {
  it("requires at least 3 characters before a search term is valid", () => {
    const schema = useQuerySchema() as {
      properties: { query: { minLength: number } };
    };
    expect(schema.properties.query.minLength).toBe(3);
  });
});
