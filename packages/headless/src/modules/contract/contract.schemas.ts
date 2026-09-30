/** @internal */
import { ContractStatusCodes } from "@upmind-automation/types";
import {
  useStoredPaymentMethodsSchema,
  useStoredPaymentMethodsUischema
} from "../payment-details";
import { PAGINATION, SortDirection } from "../query";
import { DEFAULT_SORT } from "./contract.types";
import { values } from "lodash-es";
import type { Contract, ContractsPickerLookupService } from "./contract.types";
import type { PaymentDetail } from "../payment-details";
import type { QuerySchema } from "../query";
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement
} from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module contract/contract.schemas
 * @description The collection's QUERY schema — its whole request state as ONE
 * Draft-07 schema over one model: filters, sort and pagination (R38 item 13,
 * supersedes R28/R32's pagination-only ruling). Beside it, the contracts
 * picker pair (R38 item 7, the `useTicket` / `schemas.ticketPicker` shape) and
 * the manager's ONE write form — the payment-method pair (R34; cancellation
 * moved to `contract-product` with R33).
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useContracts.ts` only (`@internal/no-cross-module-imports`). The write pair
 * is set on the machine's `PAYMENT_METHOD` open transition and read off the
 * `paymentMethod` slot of `useContract().useContext()`.
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
          name: {
            type: "object",
            additionalProperties: false,
            properties: { like: { type: ["string", "null"], minLength: 1 } }
          },
          main_invoice_number: { type: ["string", "null"], minLength: 1 },
          "status.code": {
            type: ["array", "null"],
            items: { type: "string", enum: values(ContractStatusCodes) },
            uniqueItems: true
          },
          created_at: {
            type: "object",
            additionalProperties: false,
            properties: {
              gte: { type: ["string", "null"], format: "date-time" },
              lte: { type: ["string", "null"], format: "date-time" }
            }
          },
          next_due_date: {
            type: "object",
            additionalProperties: false,
            properties: {
              gte: { type: ["string", "null"], format: "date-time" },
              lte: { type: ["string", "null"], format: "date-time" }
            }
          },
          total_amount: { type: ["number", "null"] }
        }
      },
      sort: {
        type: "array",
        default: DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: {
              enum: ["created_at", "next_due_date", "total_amount", "status"]
            },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: PAGINATION.limit },
          offset: { type: "integer", minimum: 0 }
        }
      },
      query: { type: ["string", "null"] }
    }
  } satisfies QuerySchema;
}

export function useQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/query",
        i18n: "form.contract_search_filter",
        options: { format: "search", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/status.code",
        i18n: "form.contract_status_filter",
        options: { format: "multi-select", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/created_at",
        i18n: "form.contract_created_filter",
        options: { format: "range", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/next_due_date",
        i18n: "form.contract_next_due_filter",
        options: { format: "range", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/main_invoice_number",
        i18n: "form.contract_order_filter",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/total_amount",
        i18n: "form.contract_total_filter",
        options: { optionalText: "" }
      }
    ]
  } as UISchemaElement;
}

export function useSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.contract_sort"
  };
}

// -----------------------------------------------------------------------------
// CONTRACTS PICKER — the lookup `useContract` draws on with no id yet
// (R38 item 7, the `useTicket` / `schemas.ticketPicker` shape)
// -----------------------------------------------------------------------------

export function useContractPickerSchema(): QuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      contract: { type: ["string", "null"] }
    }
  } as QuerySchema;
}

/**
 * The picker's OWN internal lookup query — a bare quick-search over this
 * client's own contracts (G1: matches title, `name` and
 * `main_invoice_number` alike, the same `useTicketLookupQuerySchema` shape).
 */
export function useContractLookupQuerySchema(): QuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      query: { type: ["string", "null"] },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: PAGINATION.limit },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } satisfies QuerySchema;
}

export function useContractPickerUischema(lookups: {
  contract: ContractsPickerLookupService;
}): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Lookup",
        scope: "#/properties/contract",
        i18n: "form.contract_lookup",
        options: {
          lookup: {
            service: lookups.contract,
            searchScope: "query"
          },
          optionalText: ""
        }
      }
    ]
  } as UISchemaElement;
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
