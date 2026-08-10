/** @internal */
import { CUSTOM_FIELD_DEFAULT_SORT } from "./client-custom-fields.types";
import type { CustomFieldQuerySchema } from "./client-custom-fields.types";
import type { JsonSchema7 } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/client-custom-fields.schemas
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
 * Custom fields are read whole and rendered as a form, so `limit: 0` asks for
 * the unpaged read and the declared `order` sort is the display order the
 * server assigns.
 */
export function useQuerySchema(): CustomFieldQuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
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
        default: CUSTOM_FIELD_DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["order", "name"] },
            dir: { enum: ["asc", "desc"] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: 0 },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}
