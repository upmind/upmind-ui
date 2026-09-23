/** @internal */
import {
  useStoredPaymentMethodsSchema,
  useStoredPaymentMethodsUischema
} from "../payment-details";
import { PAGINATION } from "../query";
import type { Contract } from "./contract.types";
import type { PaymentDetail } from "../payment-details";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module contract/contract.schemas
 * @description The collection's QUERY schema — its whole request state as ONE
 * Draft-07 schema over one model. The contracts list is pagination-only
 * (design 8.1, AC14): no filter and no sort column is declared. Beside it, the
 * manager's ONE write form — the payment-method pair (R34; cancellation moved
 * to `contract-product` with R33).
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useContracts.ts` only (`@internal/no-cross-module-imports`). The write pair
 * is set on the machine's `PAYMENT_METHOD` open transition and read off
 * `useContract().useContext()` (`schema`/`uischema`).
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

// -----------------------------------------------------------------------------
// WRITE SCHEMA — the ONE payment-method form (R34)
// -----------------------------------------------------------------------------

/**
 * The `setPaymentMethod` form (AC8) over `SetPaymentMethodModel` — a pick of
 * the client's stored cards, built by payment-details' own stored-card pair.
 */
export function useSetPaymentMethodSchema({
  storedPaymentMethods,
  paymentDetailsId
}: {
  storedPaymentMethods?: PaymentDetail[];
  paymentDetailsId?: Contract["paymentDetailsId"];
}): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    required: ["paymentDetailsId"],
    properties: {
      paymentDetailsId: {
        ...useStoredPaymentMethodsSchema(storedPaymentMethods),
        title: "Payment method",
        default: paymentDetailsId ?? undefined
      }
    }
  } as JsonSchema7;
}

export function useSetPaymentMethodUischema(): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: [
      useStoredPaymentMethodsUischema(
        "#/properties/paymentDetailsId",
        "form.contract_payment_method"
      )
    ]
  } as UISchemaElement;
}
