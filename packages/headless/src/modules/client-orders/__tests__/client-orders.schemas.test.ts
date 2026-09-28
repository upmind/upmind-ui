// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — the date filter's two value-domain patterns
 * (unit, AC-8)
 *
 * ## Job To Be Done
 * Pin design.md §8.3's two date patterns — copied VERBATIM from its code
 * blocks, per its own instruction ("Copy them from these code blocks, not
 * from a table cell") — against the REAL schema `useQuerySchema()` declares
 * for `created_at` and `paid_datetime`. Two proofs per comparison:
 *
 * 1. The schema's own `pattern` string, at each leaf, is EXACTLY the design's
 *    literal — not merely "behaviourally similar".
 * 2. AJV, compiling the REAL published schema, accepts the valid example of
 *    each value domain and refuses the invalid one.
 *
 * ## What Breaks If These Fail
 * A relative period (`-7_days`) or an absolute moment
 * (`2026-09-01 00:00:00`) that design.md's own worked examples promise gets
 * silently refused by validation — the filter write fails with no visible
 * cause — or a malformed string slips through to the wire and the API 422s.
 */

import { describe, expect, it } from "vitest";
import { useQuerySchema } from "../client-orders.schemas";
import { useValidation } from "../../../utils";
import type { ErrorObject } from "ajv";

type Validator = ((data: unknown) => boolean) & {
  errors?: ErrorObject[] | null;
};

// -----------------------------------------------------------------------------

/** design.md §8.3 — copied verbatim from its code blocks, not its table. */
const RELATIVE_PATTERN =
  "^[+-](?:[1-9][0-9]*|[0-9]+\\.[0-9]+)_(hours|days|weeks|months|years)$";
const ABSOLUTE_PATTERN = "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$";

type DateLeafSchema = {
  properties: {
    gt?: { pattern?: string };
    gte?: { pattern?: string };
    lt?: { pattern?: string };
    lte?: { pattern?: string };
    after?: { pattern?: string };
    before?: { pattern?: string };
  };
};

function dateLeaf(column: "created_at" | "paid_datetime"): DateLeafSchema {
  const schema = useQuerySchema() as {
    properties: { filters: { properties: Record<string, unknown> } };
  };
  return schema.properties.filters.properties[column] as DateLeafSchema;
}

function compileQuerySchema(): Validator {
  const { ajv } = useValidation() as unknown as {
    ajv: { compile: (schema: object) => Validator };
  };
  return ajv.compile(useQuerySchema() as unknown as object);
}

// -----------------------------------------------------------------------------

describe.each(["created_at", "paid_datetime"] as const)(
  "client-orders query schema — %s date leaf (AC-8)",
  column => {
    it("declares the absolute pattern verbatim on gt/gte/lt/lte", () => {
      const leaf = dateLeaf(column);
      expect(leaf.properties.gt?.pattern).toBe(ABSOLUTE_PATTERN);
      expect(leaf.properties.gte?.pattern).toBe(ABSOLUTE_PATTERN);
      expect(leaf.properties.lt?.pattern).toBe(ABSOLUTE_PATTERN);
      expect(leaf.properties.lte?.pattern).toBe(ABSOLUTE_PATTERN);
    });

    it("declares the relative pattern verbatim on after/before", () => {
      const leaf = dateLeaf(column);
      expect(leaf.properties.after?.pattern).toBe(RELATIVE_PATTERN);
      expect(leaf.properties.before?.pattern).toBe(RELATIVE_PATTERN);
    });

    it("AJV, compiling the real schema, accepts the absolute example and refuses a malformed one on gte", () => {
      const validate = compileQuerySchema();

      expect(
        validate({
          filters: {
            "category.slug": "new_contract",
            [column]: { gte: "2026-09-01 00:00:00" }
          }
        })
      ).toBe(true);

      expect(
        validate({
          filters: {
            "category.slug": "new_contract",
            [column]: { gte: "2026-09-01" }
          }
        })
      ).toBe(false);
    });

    it("AJV, compiling the real schema, accepts the relative examples and refuses a malformed one on after/before", () => {
      const validate = compileQuerySchema();

      expect(
        validate({
          filters: {
            "category.slug": "new_contract",
            [column]: { after: "-7_days" }
          }
        })
      ).toBe(true);

      expect(
        validate({
          filters: {
            "category.slug": "new_contract",
            [column]: { before: "+7_days" }
          }
        })
      ).toBe(true);

      expect(
        validate({
          filters: {
            "category.slug": "new_contract",
            [column]: { after: "7 days ago" }
          }
        })
      ).toBe(false);
    });

    it("the relative leaf refuses 7_days, a period with no sign, on after and on before", () => {
      const validate = compileQuerySchema();
      for (const op of ["after", "before"] as const) {
        expect(
          validate({
            filters: {
              "category.slug": "new_contract",
              [column]: { [op]: "7_days" }
            }
          })
        ).toBe(false);
      }
    });
  }
);
