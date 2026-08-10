/** @internal */
import { PRODUCT_DEFAULT_SORT } from "./product-catalogue.types";
import type { ProductQuerySchema } from "./product-catalogue.types";
import type { JsonSchema7 } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module product-catalogue/product-catalogue.schemas
 * @description The collection's QUERY schema — its whole request state
 * (filters · sort · pagination) as ONE Draft-07 schema over one model. A
 * SELF-CONTAINED JSON literal, so it can be lifted straight into ajv or a test
 * and run standalone.
 *
 * WARNING: Do not import directly from another module — the barrel exports no
 * schema.
 */
// -----------------------------------------------------------------------------

/**
 * The storefront list. `products_category_id` takes the category and its
 * descendants as an id array; the search box binds `name.like`; the sort enum
 * is the API's own `order=` columns, so a column it does not name is
 * unspellable rather than an HTTP 500.
 */
export function useQuerySchema(): ProductQuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          products_category_id: {
            type: "object",
            title: "text.categories",
            additionalProperties: false,
            properties: {
              eq: {
                type: ["array", "null"],
                items: { type: "string" },
                uniqueItems: true
              }
            }
          },
          name: {
            type: "object",
            additionalProperties: false,
            properties: {
              // The bare term — the translator adds the % wildcards.
              like: { type: ["string", "null"], minLength: 1 }
            }
          }
        }
      },
      sort: {
        type: "array",
        default: PRODUCT_DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["order", "name", "price"] },
            dir: { enum: ["asc", "desc"] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0 },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}
