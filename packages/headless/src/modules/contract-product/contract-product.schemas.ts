/** @internal */
import { SortDirection } from "../query/query.types";
import { DEFAULT_SORT } from "./contract-product.types";
import { hidesOneTimePurchasesForced } from "./contract-product.utils";
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
 * filter-bar uischema and the sort uischema. The module has no form, so it
 * carries no form schema pair.
 *
 * WARNING: Do not import directly. Consumers read the family off
 * `useContractProducts().useContext().schemas`.
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
              oneOf: [
                { const: "status", title: "text.status" },
                { const: "created_at", title: "text.purchase_date" },
                { const: "next_due_date", title: "text.next_due_date" },
                { const: "cancelled_date", title: "text.date_cancelled" }
              ]
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
