/** @internal */
import {
  useCustomFieldsSchema,
  useCustomFieldsUischema
} from "../client-custom-fields";
import {
  useStoredPaymentMethodsSchema,
  useStoredPaymentMethodsUischema
} from "../payment-details";
import { PAGINATION } from "../query";
import { isEmpty, map } from "lodash-es";
import type { Contract } from "./contract.types";
import type { CustomField } from "../client-custom-fields";
import type { PaymentDetail } from "../payment-details";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module contract/contract.schemas
 * @description The collection's QUERY schema — its whole request state as ONE
 * Draft-07 schema over one model. The contracts list is pagination-only
 * (design 8.1, AC14): no filter and no sort column is declared. Beside it, the
 * manager's two WRITE pairs — one schema + uischema per model-taking write
 * (R28 amendment, 2026-09-23).
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useContracts.ts` only (`@internal/no-cross-module-imports`). The write
 * pairs are read off `useContract().useContext().schemas`.
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
// WRITE SCHEMAS — one pair per model-taking write (R28 amendment)
// -----------------------------------------------------------------------------

/**
 * The `requestCancellation` form (AC6) over `RequestCancellationModel`.
 * `productIds` offers the contract's own products as an `enum` pick list,
 * so a pick is always an id the endpoint accepts. `customFields` declares
 * the brand's cancel-request field definitions as a nested object (one
 * `properties.<code>` per field); it is omitted when none are defined.
 */
export function useRequestCancellationSchema({
  products,
  customFields
}: {
  products?: Contract["products"];
  customFields?: CustomField[];
}): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    required: ["productIds"],
    properties: {
      productIds: {
        type: "array",
        title: "Products",
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "string",
          ...(!isEmpty(products) && { enum: map(products, "id") })
        }
      },
      reason: { type: "string", title: "Reason" },
      ...(!isEmpty(customFields) && {
        customFields: useCustomFieldsSchema(customFields)
      })
    }
  } as JsonSchema7;
}

/**
 * The product tiles label each id with its product name through the
 * multi-enum renderer's `options.items` (`StringsRenderer.vue:42-44`); an
 * id is not an i18n key.
 */
export function useRequestCancellationUischema({
  products,
  customFields
}: {
  products?: Contract["products"];
  customFields?: CustomField[];
}): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/productIds",
        i18n: "form.contract_cancellation_products",
        options: {
          items: map(products, product => ({
            label: product.name,
            value: product.id
          }))
        }
      },
      {
        type: "Control",
        scope: "#/properties/reason",
        i18n: "form.contract_cancellation_reason",
        options: { multi: true }
      },
      ...useCustomFieldsUischema(customFields)
    ]
  } as UISchemaElement;
}

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
