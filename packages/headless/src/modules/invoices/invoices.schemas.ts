/** @internal */
import {
  InvoiceCategoryCode,
  InvoiceStatusGroups
} from "@upmind-automation/types";
import { SortDirection } from "../query/query.types";
import { PAGINATION } from "../query/query.utils";
import { INVOICE_DEFAULT_SORT } from "./invoices.types";
import type {
  InvoiceQueryModel,
  InvoiceQuerySchema,
  InvoicesSchemas
} from "./invoices.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ControlElement, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module invoices/invoices.schemas
 * @description The collection's QUERY schema — its whole request state
 * (filters · sort · pagination) as ONE Draft-07 schema over
 * {@link InvoiceQueryModel} — with its presentations
 * (`useQueryUischema` / `useSortUischema`) and the three criteria presets AC2,
 * AC7 and AC10 need. No form pair: the module has no edit form (design D1).
 *
 * WARNING: Do not import directly from another module — the barrel exports no
 * schema.
 */
// -----------------------------------------------------------------------------

/**
 * The criteria-subversion law: this schema owns ALL request state, and
 * reaches the wire only through `list({ criteria: { schema } })`.
 * `additionalProperties: false` at every level makes an undeclared column or
 * operator unspellable. Every column here is `design.md`'s "Filter columns"
 * table, verbatim — no raw `filter[...]` string, sort string or limit/page
 * literal is written anywhere else in this module.
 */
export function useQuerySchema(): InvoiceQuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            type: "object",
            title: "invoices.filter.id",
            additionalProperties: false,
            properties: { eq: { type: ["string", "null"], minLength: 1 } }
          },
          number: {
            type: "object",
            title: "invoices.filter.number",
            additionalProperties: false,
            properties: { eq: { type: ["string", "null"], minLength: 1 } }
          },
          "status.code": {
            type: "object",
            title: "invoices.filter.status",
            additionalProperties: false,
            properties: {
              in: { type: ["array", "null"], items: { type: "string" } }
            }
          },
          client_id: {
            type: "object",
            title: "invoices.filter.client_id",
            additionalProperties: false,
            properties: { eq: { type: ["string", "null"], minLength: 1 } }
          },
          is_consolidation: {
            type: "object",
            title: "invoices.filter.is_consolidation",
            additionalProperties: false,
            properties: {
              eq: { type: ["boolean", "null"], enum: [true, false, null] }
            }
          },
          "category.slug": {
            type: "object",
            title: "invoices.filter.category",
            additionalProperties: false,
            properties: {
              in: { type: ["array", "null"], items: { type: "string" } }
            }
          },
          credit_invoice_id: {
            type: "object",
            title: "invoices.filter.credit_invoice_id",
            additionalProperties: false,
            properties: { eq: { type: ["string", "null"], minLength: 1 } }
          },
          paid_amount: {
            type: "object",
            title: "invoices.filter.paid_amount",
            additionalProperties: false,
            properties: { eq: { type: ["number", "null"] } }
          },
          total_amount: {
            type: "object",
            title: "invoices.filter.total_amount",
            additionalProperties: false,
            properties: { eq: { type: ["number", "null"] } }
          },
          net_amount: {
            type: "object",
            title: "invoices.filter.net_amount",
            additionalProperties: false,
            properties: { eq: { type: ["number", "null"] } }
          },
          total_discount_amount: {
            type: "object",
            title: "invoices.filter.total_discount_amount",
            additionalProperties: false,
            properties: { eq: { type: ["number", "null"] } }
          },
          create_datetime: {
            type: "object",
            title: "invoices.filter.create_datetime",
            additionalProperties: false,
            properties: {
              eq: { type: ["string", "null"], format: "date-time" },
              gte: { type: ["string", "null"], format: "date-time" },
              lte: { type: ["string", "null"], format: "date-time" }
            }
          },
          due_date: {
            type: "object",
            title: "invoices.filter.due_date",
            additionalProperties: false,
            properties: {
              eq: { type: ["string", "null"], format: "date-time" },
              gte: { type: ["string", "null"], format: "date-time" },
              lte: { type: ["string", "null"], format: "date-time" }
            }
          },
          proforma: {
            type: "object",
            title: "invoices.filter.proforma",
            additionalProperties: false,
            properties: {
              eq: { type: ["boolean", "null"], enum: [true, false, null] }
            }
          },
          // Declared for parity, deliberately undrawn for a client bar — a
          // declared-but-undrawn column is filterable by URL and absent from
          // the bar (design.md "Filter columns").
          fraud_status: {
            type: "object",
            title: "invoices.filter.fraud_status",
            additionalProperties: false,
            properties: {
              in: { type: ["array", "null"], items: { type: "number" } }
            }
          },
          "contracts.id": {
            type: "object",
            title: "invoices.filter.contract_id",
            additionalProperties: false,
            properties: { eq: { type: ["string", "null"], minLength: 1 } }
          },
          "products.contracts_product_id": {
            type: "object",
            title: "invoices.filter.contracts_product_id",
            additionalProperties: false,
            properties: { eq: { type: ["string", "null"], minLength: 1 } }
          }
        }
      },
      sort: {
        type: "array",
        default: INVOICE_DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            // The WHOLE vocabulary of sortable columns.
            field: {
              enum: [
                "create_datetime",
                "number",
                "total_amount",
                "net_amount",
                "status",
                "paid_datetime",
                "due_date",
                "cancellation_datetime"
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
          // The declared `"count"` sentinel — replaces the oracle's raw
          // `limit: "count"` literal (`oracle:557`, `:580`). `minimum: 0`,
          // not 1, keeps `limit: 0` legal for one unpaged page.
          limit: {
            oneOf: [
              { type: "integer", minimum: 0, default: PAGINATION.limit },
              { const: "count" }
            ]
          },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } satisfies InvoiceQuerySchema;
}

/**
 * The module's DEFAULT filter-bar presentation. Every element scopes an
 * operator leaf and carries an `i18n` key (mandatory,
 * `code-ui.companion.md`). A column declared above and drawn nowhere here
 * (`fraud_status`, `id`, `client_id`, `credit_invoice_id`, `paid_amount`,
 * `total_discount_amount`, `proforma`, `contracts.id`,
 * `products.contracts_product_id`) is filterable by URL and deliberately
 * absent from the bar (design.md "Filter columns").
 */
export function useQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/number/properties/eq",
        i18n: "invoices.filter_bar.number",
        options: { format: "search", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/status.code/properties/in",
        i18n: "invoices.filter_bar.status",
        options: { format: "multi-select", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/category.slug/properties/in",
        i18n: "invoices.filter_bar.category",
        options: { format: "multi-select", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/is_consolidation/properties/eq",
        i18n: "invoices.filter_bar.is_consolidation",
        options: { format: "button-group", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/total_amount/properties/eq",
        i18n: "invoices.filter_bar.total_amount",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/net_amount/properties/eq",
        i18n: "invoices.filter_bar.net_amount",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/create_datetime",
        i18n: "invoices.filter_bar.create_datetime",
        options: { format: "range", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/due_date",
        i18n: "invoices.filter_bar.due_date",
        options: { format: "range", noLabel: true, optionalText: "" }
      }
    ]
  } as UISchemaElement;
}

/**
 * The collection's ORDERING presentation — one element over the query
 * schema's `sort` branch. The schema stays a bare enum; the i18n prefix
 * mapper resolves each option's label as `<i18n>.<field>`.
 */
export function useSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "invoices.sort"
  };
}

/**
 * AC10's preset — a count-only read, no rows. Reuses `InvoiceStatusGroups`
 * (`packages/types/src/data/enums/invoice.ts:13-18`) — never re-declared.
 */
export const UNPAID_EXISTENCE_CRITERIA: InvoiceQueryModel = {
  filters: { "status.code": { in: InvoiceStatusGroups.UNPAID } },
  pagination: { limit: "count" }
};

/**
 * AC2's preset — the notice/CTA count of invoices this client could
 * consolidate. `clientId` is the resolved scope target (`oracle:574-593`).
 */
export function consolidatableCriteria(clientId?: string): InvoiceQueryModel {
  return {
    filters: {
      "status.code": { in: InvoiceStatusGroups.UNPAID },
      is_consolidation: { eq: false },
      "category.slug": { in: [InvoiceCategoryCode.RECURRENT] },
      client_id: { eq: clientId },
      paid_amount: { eq: 0 }
    },
    pagination: { limit: "count" }
  };
}

/**
 * AC7's preset — credit notes as a filtered view of this same collection
 * (design D4). `invoiceId`, when given, narrows to the credit notes partnered
 * with one invoice.
 */
export function creditNotesCriteria(invoiceId?: string): InvoiceQueryModel {
  return {
    filters: {
      "category.slug": {
        in: [
          InvoiceCategoryCode.CREDIT_NOTE,
          InvoiceCategoryCode.CREDIT_NOTE_FOR_REFUND
        ]
      },
      ...(invoiceId ? { credit_invoice_id: { eq: invoiceId } } : {})
    }
  };
}

/**
 * Schema matrix: maps scopeActor types to their schema-family overrides. The
 * shape is the same armed or armless — only the `default:` case exists, so
 * nothing here changes when a scope earns an arm (design.md "Arms
 * determination": one non-dropped actor, `client`).
 */
function scopedSchemas(_scopeActor: ScopeActorTypes): Partial<InvoicesSchemas> {
  switch (_scopeActor) {
    default:
      return {};
  }
}

/**
 * Schemas factory — same shape as `invoices.services.ts`'s
 * `createInvoicesServices`: the concrete actor arrives first, at
 * construction.
 */
export const createInvoicesSchemas = (
  scopeActor: ScopeActorTypes
): InvoicesSchemas => ({
  useQuerySchema,
  useQueryUischema,
  useSortUischema,
  ...scopedSchemas(scopeActor)
});

export default createInvoicesSchemas;
