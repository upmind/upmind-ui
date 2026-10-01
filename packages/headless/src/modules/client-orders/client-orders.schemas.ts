/** @internal */
import { SortDirection } from "../query/query.types";
import { PAGINATION } from "../query/query.utils";
import {
  CLIENT_ORDERS_DEFAULT_SORT,
  ClientOrdersSortableColumn
} from "./client-orders.types";
import type { QuerySchema } from "../query/query.types";
import type { ControlElement, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module client-orders/client-orders.schemas
 * @description The order-history query schema and its filter-bar and sort
 * uischemas (design 8.3). One model over `filters · sort · pagination`, no
 * top-level `query` property — the search writes `filters.number.eq`.
 */
// -----------------------------------------------------------------------------

const RELATIVE_DATE_PATTERN =
  "^[+-](?:[1-9][0-9]*|[0-9]+\\.[0-9]+)_(hours|days|weeks|months|years)$";
const ABSOLUTE_DATE_PATTERN = "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$";

/**
 * The five status choices the `status.code` filter offers (design 8.3, F15).
 * Unpaid is the ONE csv-joined wire value `invoice_unpaid,invoice_adjusted`,
 * not two enum values — the parser sees it as one array item.
 */
const STATUS_CHOICES = [
  "invoice_paid",
  "invoice_unpaid,invoice_adjusted",
  "invoice_overdue",
  "invoice_cancelled",
  "invoice_refunded"
] as const;

function dateLeafSchema(): QuerySchema {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      gt: { type: ["string", "null"], pattern: ABSOLUTE_DATE_PATTERN },
      gte: { type: ["string", "null"], pattern: ABSOLUTE_DATE_PATTERN },
      lt: { type: ["string", "null"], pattern: ABSOLUTE_DATE_PATTERN },
      lte: { type: ["string", "null"], pattern: ABSOLUTE_DATE_PATTERN },
      after: { type: ["string", "null"], pattern: RELATIVE_DATE_PATTERN },
      before: { type: ["string", "null"], pattern: RELATIVE_DATE_PATTERN }
    }
  };
}

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
          "category.slug": { const: "new_contract" },
          number: {
            type: "object",
            additionalProperties: false,
            properties: {
              like: { type: ["string", "null"] },
              eq: { type: ["string", "null"] },
              neq: { type: ["string", "null"] }
            }
          },
          total_amount: {
            type: "object",
            additionalProperties: false,
            properties: {
              eq: { type: ["number", "null"] },
              neq: { type: ["number", "null"] },
              gt: { type: ["number", "null"] },
              gte: { type: ["number", "null"] },
              lt: { type: ["number", "null"] },
              lte: { type: ["number", "null"] }
            }
          },
          "status.code": {
            type: "object",
            additionalProperties: false,
            maxProperties: 1,
            properties: {
              eq: {
                type: ["array", "null"],
                items: { type: "string", enum: [...STATUS_CHOICES] },
                uniqueItems: true
              },
              neq: {
                type: ["array", "null"],
                items: { type: "string", enum: [...STATUS_CHOICES] },
                uniqueItems: true
              }
            }
          },
          created_at: dateLeafSchema(),
          paid_datetime: dateLeafSchema(),
          "products.product.name": {
            type: "object",
            additionalProperties: false,
            properties: {
              like: { type: ["string", "null"] },
              eq: { type: ["string", "null"] },
              neq: { type: ["string", "null"] }
            }
          },
          "products.product.category.name": {
            type: "object",
            additionalProperties: false,
            properties: {
              like: { type: ["string", "null"] },
              eq: { type: ["string", "null"] },
              neq: { type: ["string", "null"] }
            }
          },
          "products.service_identifier": {
            type: "object",
            additionalProperties: false,
            properties: {
              like: { type: ["string", "null"] },
              eq: { type: ["string", "null"] },
              neq: { type: ["string", "null"] }
            }
          }
        }
      },
      sort: {
        type: "array",
        default: CLIENT_ORDERS_DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: Object.values(ClientOrdersSortableColumn) },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 1, default: PAGINATION.limit },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } satisfies QuerySchema;
}

/**
 * The filter-bar layout (design 8.3). Every control scopes a single operator
 * LEAF, never the comparison object, so the shared `FilterBar` renders one
 * compact control per column instead of the full operator bag:
 *
 * - the text columns (`number`, the three `products.*` columns) scope their own
 *   leaf — `number.eq` is the quick-search leaf (D-8), the `products.*` columns
 *   their `like` leaf — so `FilterSearchRenderer` (a STRING control + `search`)
 *   binds instead of the fallback object renderer,
 * - `status.code` scopes its `eq` array leaf so `FilterMultiSelectRenderer`
 *   (an `array`/`uniqueItems`/`enum` leaf + `multi-select`) binds, its option
 *   labels resolving by the `form.client_orders_status_filter.<value>` i18n
 *   convention rather than the raw status codes,
 * - the numeric and date columns stay scoped at the column object with
 *   `format: range`, which `FilterRangeRenderer` reads as a `gte`/`lte` pair.
 *
 * The wire keys, the operators and the schema channel are untouched: the leaf
 * each control scopes is already a schema operator, and a deeper scope is a
 * presentation choice the shared renderers read, not a new filter shape.
 */
export function useQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/number/properties/eq",
        i18n: "form.client_orders_number_filter",
        options: { format: "search", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/status.code/properties/eq",
        i18n: "form.client_orders_status_filter",
        options: { format: "multi-select", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/total_amount",
        i18n: "form.client_orders_total_filter",
        options: { format: "range", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/created_at",
        i18n: "form.client_orders_created_filter",
        options: { format: "range", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/paid_datetime",
        i18n: "form.client_orders_paid_filter",
        options: { format: "range", optionalText: "" }
      },
      {
        type: "Control",
        scope:
          "#/properties/filters/properties/products.product.name/properties/like",
        i18n: "form.client_orders_item_name_filter",
        options: { format: "search", optionalText: "" }
      },
      {
        type: "Control",
        scope:
          "#/properties/filters/properties/products.product.category.name/properties/like",
        i18n: "form.client_orders_category_name_filter",
        options: { format: "search", optionalText: "" }
      },
      {
        type: "Control",
        scope:
          "#/properties/filters/properties/products.service_identifier/properties/like",
        i18n: "form.client_orders_service_identifier_filter",
        options: { format: "search", optionalText: "" }
      }
    ]
  } as UISchemaElement;
}

export function useSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.client_orders_sort"
  };
}
