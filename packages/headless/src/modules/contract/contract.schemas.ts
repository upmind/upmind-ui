/** @internal */
import { PAGINATION } from "../query";
import type { JsonSchema7 } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module contract/contract.schemas
 * @description The collection's QUERY schema — its whole request state as ONE
 * Draft-07 schema over one model. The contracts list is pagination-only
 * (design 8.1, AC14): no filter and no sort column is declared.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useContracts.ts` only (`@internal/no-cross-module-imports`).
 */

export function useQuerySchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: PAGINATION.limit },
          offset: { type: "integer", minimum: 0, default: PAGINATION.offset }
        }
      }
    }
  } satisfies JsonSchema7;
}
