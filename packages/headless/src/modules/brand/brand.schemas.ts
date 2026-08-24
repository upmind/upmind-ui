/** @internal */
import type { QuerySchema } from "./brand.types";

// -----------------------------------------------------------------------------
/**
 * @module brand/brand.schemas
 * @description The brand-config read's QUERY schema — its whole request state
 * as ONE Draft-07 schema over one model. A SELF-CONTAINED JSON literal, so it
 * can be lifted straight into ajv or a test and run standalone.
 *
 * The single declared branch is the requested key list. `translateQuery` walks
 * the schema's DECLARED `(column, operator)` pairs, so this declaration is the
 * only reason `filter[keys|eq]` reaches the wire at all — a branch declaring no
 * operator reduces over `{}` and emits nothing.
 *
 * `eq` holds the key list as an ARRAY, not a pre-joined string: `translateQuery`
 * already owns the comma join (`toWireFilterValue`), so joining here too would
 * be a second joining site able to drift from the wire — which is exactly how
 * the previous `keys=` url param went stale. There is no `sort` or `pagination`
 * branch because this read is a single unordered map, not a collection.
 */

export function useQuerySchema(): QuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          keys: {
            type: "object",
            title: "text.keys",
            additionalProperties: false,
            properties: {
              // Members are left as bare strings rather than a `BrandConfigKeys`
              // enum: a write is committed WHOLE or not at all, so one
              // unrecognised key would discard the entire widened set instead
              // of letting the API answer for the keys it does know.
              eq: {
                type: "array",
                minItems: 1,
                uniqueItems: true,
                items: { type: "string", minLength: 1 }
              }
            }
          }
        }
      }
    }
  };
}
