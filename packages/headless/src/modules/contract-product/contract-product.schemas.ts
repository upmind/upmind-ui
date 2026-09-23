/** @internal */
import { RuleEffect } from "@jsonforms/core";
import { InvoiceConsolidationTypes } from "@upmind-automation/types";
import {
  useCustomFieldsSchema,
  useCustomFieldsUischema
} from "../client-custom-fields";
import { SortDirection } from "../query/query.types";
import {
  ContractProductCancelOption,
  DEFAULT_SORT
} from "./contract-product.types";
import { hidesOneTimePurchasesForced } from "./contract-product.utils";
import { isEmpty } from "lodash-es";
import type { CustomField } from "../client-custom-fields";
import type { ContractProductsQuerySchema } from "./contract-product.types";
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement
} from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.schemas
 * @description The collection's QUERY schema family — its whole request state
 * (filters · sort · pagination) as ONE Draft-07 schema (design 8.2), the
 * filter-bar uischema and the sort uischema. Beside it, the manager's two
 * WRITE forms — the combined cancellation form and the consolidation form
 * (R33). Each form's builder runs in the machine's open transition, which sets
 * that form's own `cancellation` / `consolidation` slot on context.
 *
 * WARNING: Do not import directly. Consumers read the query family off
 * `useContractProducts().useContext().schemas`, and each open form off its own
 * `cancellation` / `consolidation` slot of `useContractProduct().useContext()`.
 */

/**
 * One `billing_cycle_days` branch carries both operator leaves (`neq` for
 * `subscriptionsOnly` and the forced hide-one-time leaf, `eq` for
 * `oneTimeOnly` — ADR-15). A bare column (`status.code`, `product.category.id`,
 * `total_amount`) declares no operator, so the translator emits
 * `filter[column]`.
 *
 * @decision
 * what: the forced hide-one-time leaf is a `const: 0` AND a `default: 0`.
 * why: ADR-14 — a `const` alone may inject nothing into an empty model, and
 *   an unfiltered list is the most dangerous silent failure of the family.
 * rejected: a `const` alone; a hidden uischema control; a second query.
 */
export function useQuerySchema(): ContractProductsQuerySchema {
  const forced = hidesOneTimePurchasesForced();

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          "product.name": {
            type: "object",
            title: "text.product_name",
            additionalProperties: false,
            properties: {
              like: { type: ["string", "null"], minLength: 1 }
            }
          },
          "product.category.name": {
            type: "object",
            title: "text.category_name",
            additionalProperties: false,
            properties: {
              like: { type: ["string", "null"], minLength: 1 }
            }
          },
          "product.category.id": {
            type: ["string", "null"],
            title: "text.category"
          },
          "status.code": {
            type: ["string", "null"],
            title: "text.status"
          },
          billing_cycle_days: {
            type: "object",
            title: "text.billing_cycle",
            additionalProperties: false,
            properties: {
              neq: forced
                ? { type: "integer", const: 0, default: 0 }
                : { type: ["integer", "null"] },
              eq: { type: ["integer", "null"] }
            }
          },
          created_at: {
            type: "object",
            title: "text.purchase_date",
            additionalProperties: false,
            properties: {
              gt: { type: ["string", "null"], format: "date" }
            }
          },
          next_due_date: {
            type: "object",
            title: "text.next_due_date",
            additionalProperties: false,
            properties: {
              gt: { type: ["string", "null"], format: "date" }
            }
          },
          total_amount: {
            type: ["number", "null"],
            title: "text.price"
          }
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
              enum: ["status", "created_at", "next_due_date", "cancelled_date"]
            },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: 10 },
          offset: { type: "integer", minimum: 0, default: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}

/**
 * The collection's filter-bar presentation over `useQuerySchema()`'s
 * `filters` branch. No control for `billing_cycle_days.neq` — that leaf is
 * ADR-14's forced seam and draws no control by design.
 */
export function useQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/product.name/properties/like",
        i18n: "form.contract_product_name_search",
        options: {
          format: "search",
          icon: "search-md",
          noLabel: true,
          optionalText: ""
        }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/product.category.id",
        i18n: "form.contract_product_category",
        options: { noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/status.code",
        i18n: "form.contract_product_status",
        options: { noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope:
          "#/properties/filters/properties/billing_cycle_days/properties/eq",
        i18n: "form.contract_product_one_time_only",
        options: { format: "button-group", noLabel: true, optionalText: "" }
      }
    ]
  } as UISchemaElement;
}

/** The collection's ORDERING presentation — one element over the `sort` branch. */
export function useSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.contract_product_sort"
  };
}

// -----------------------------------------------------------------------------
// WRITE SCHEMAS — one pair per model-taking write (R28 amendment)
// -----------------------------------------------------------------------------

/** The `setConsolidation` form over `SetConsolidationModel`. */
export function useSetConsolidationSchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    required: ["invoiceConsolidationEnabled"],
    properties: {
      invoiceConsolidationEnabled: {
        type: "integer",
        title: "Invoice consolidation",
        // Legacy's two positions (`cProdInvoiceConsolidationForm.vue:43-52`);
        // un-pressing writes INHERIT through `defaultOptionValue`.
        enum: [
          InvoiceConsolidationTypes.ENABLED,
          InvoiceConsolidationTypes.DISABLED,
          InvoiceConsolidationTypes.INHERIT
        ]
      }
    }
  } satisfies JsonSchema7;
}

export function useSetConsolidationUischema(): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/invoiceConsolidationEnabled",
        i18n: "form.contract_product_invoice_consolidation",
        options: {
          format: "toggle-group",
          defaultOptionValue: InvoiceConsolidationTypes.INHERIT,
          optionalText: ""
        }
      }
    ]
  } as UISchemaElement;
}

/**
 * The ONE combined cancellation form (R33; legacy `clientContractCancellationModal`
 * + `contractCancellationOptions.vue`) over `CancellationModel`. `option` is a
 * bare enum of the options this product allows — the control's `i18n` key is the
 * option-key PREFIX, so each position labels via i18n (`tickets`/`client-email`
 * enum pattern), never a `oneOf`/`options` array (operator ruling).
 * `futureCancellationDate` is required only for `SCHEDULE_FUTURE` (the schema's
 * `if`/`then`, as `payment-details` conditions its `oneOf`) and floored at the
 * product's earliest selectable anniversary. `customFields` is the brand's
 * CANCEL_REQUEST catalogue, omitted when none are defined.
 */
export function useCancellationSchema({
  options,
  minDate,
  customFields
}: {
  options: ContractProductCancelOption[];
  minDate?: string | null;
  customFields?: CustomField[];
}): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    required: ["option"],
    properties: {
      option: {
        type: "string",
        title: "Cancellation option",
        enum: options
      },
      futureCancellationDate: {
        type: "string",
        title: "Cancellation date",
        format: "date",
        ...(minDate ? { formatMinimum: minDate, default: minDate } : {})
      },
      reason: { type: "string", title: "Reason" },
      ...(!isEmpty(customFields) && {
        customFields: useCustomFieldsSchema(customFields)
      })
    },
    if: {
      properties: {
        option: { const: ContractProductCancelOption.SCHEDULE_FUTURE }
      }
    },
    then: { required: ["futureCancellationDate"] }
  } as JsonSchema7;
}

export function useCancellationUischema(
  customFields?: CustomField[]
): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/option",
        i18n: "form.contract_product_cancellation_option",
        options: { format: "radio" }
      },
      {
        type: "Control",
        scope: "#/properties/futureCancellationDate",
        i18n: "form.contract_product_future_cancellation_date",
        // Only relevant to SCHEDULE_FUTURE; hidden for the other options
        // (the `payment-gateways` SHOW-rule pattern).
        rule: {
          effect: RuleEffect.SHOW,
          condition: {
            scope: "#",
            schema: {
              required: ["option"],
              properties: {
                option: { const: ContractProductCancelOption.SCHEDULE_FUTURE }
              }
            }
          }
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
