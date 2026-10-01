/** @internal */
import type { QuerySchema } from "../query/query.types";

// -----------------------------------------------------------------------------
/**
 * @module brand/brand.schemas
 * @description The brand-config read's query schema. The key list travels as the
 * `keys=` url param, so the schema declares no filter branch.
 */

export function useQuerySchema(): QuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {}
  };
}
