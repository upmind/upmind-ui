/** @internal */
import {
  CreditNoteStatus,
  InvoiceCategoryCode,
  InvoiceStatus,
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
 * The `status.code` column's WHOLE offerable vocabulary — every
 * {@link InvoiceStatus} member plus the {@link CreditNoteStatus} pair the
 * column is widened to admit for AC7 (`design.md` "Filter columns"). Derived
 * from the enums' own values, never hand-typed, so no member is
 * re-declared; `title` reuses each value as its own i18n-key suffix
 * (`invoices.filter_option.status.<value>`), consistent with this file's
 * `title`-is-an-i18n-key convention throughout.
 */
const STATUS_VOCABULARY = [
  ...Object.values(InvoiceStatus),
  ...Object.values(CreditNoteStatus)
].map(code => ({
  const: code,
  title: `invoices.filter_option.status.${code}`
}));

/**
 * The `category.slug` column's WHOLE offerable vocabulary — every
 * {@link InvoiceCategoryCode} member (`design.md` "Filter columns"), derived
 * the same way as {@link STATUS_VOCABULARY}.
 */
const CATEGORY_VOCABULARY = Object.values(InvoiceCategoryCode).map(code => ({
  const: code,
  title: `invoices.filter_option.category.${code}`
}));

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
              in: {
                type: ["array", "null"],
                items: { type: "string", oneOf: STATUS_VOCABULARY },
                uniqueItems: true
              }
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
              in: {
                type: ["array", "null"],
                items: { type: "string", oneOf: CATEGORY_VOCABULARY },
                uniqueItems: true
              }
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
          // `limit: "count"` literal (`oracle:559`, `:581`). `minimum: 0`,
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
        // No `format` — the multi-select tile group dispatches on the leaf's
        // OWN shape (`array` + `uniqueItems` + `items.oneOf`), never a format
        // string (`StringsRenderer.vue`'s tester).
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/category.slug/properties/in",
        i18n: "invoices.filter_bar.category",
        options: { optionalText: "" }
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
 * AC10's preset — the smallest normal page (one row) of this client's
 * outstanding invoices; `hasUnpaid` reads its server-reported `total`, never
 * its row array. Reuses `InvoiceStatusGroups`
 * (`packages/types/src/data/enums/invoice.ts:13-18`) — never re-declared.
 *
 * @decision
 * what: a real one-row page (`pagination.limit: 1`), not the oracle's raw
 * `limit: "count"` literal (`oracle:559` —
 * `/Users/dom/Documents/Upmind/vue-app/src/store/modules/data/invoices/index.ts`)
 * that {@link useQuerySchema}'s `pagination.limit` still declares (dormant,
 * spellable but silently discarded before the wire) — no preset in this file
 * spells it any more; {@link consolidatableCountCriteria} below follows this
 * same `limit: 1` precedent rather than repeating the dead sentinel.
 * why: `withPageWindow` (`query.utils.ts:603-627`) merges a hard-coded
 * `limit: { type: "integer", minimum: 0, default: PAGINATION.limit }`
 * beneath every module's declared pagination schema, and
 * `useModelParser`'s `safeValue` (`useValidation.ts`) dispatches on that
 * merged `type` alone — it never consults `oneOf` — so it treats the
 * `"count"` sentinel as a non-finite integer and silently substitutes the
 * numeric default before the model ever reaches the wire. `limit: "count"`
 * therefore cannot be spelled through `list()`'s validated criteria
 * channel for ANY module, and this dispatch may not fix that: operator
 * ruling 2026-09-08 (verbatim), "do not chnage any query stuff" —
 * `packages/headless/src/modules/query/**` and `useValidation.ts` are off
 * limits for this story. One row over the wire keeps the oracle's own
 * contract, `response.total > 0` (`oracle:572`), intact.
 * rejected: fixing `withPageWindow`'s schema merge / `useModelParser`'s
 * integer coercion so a declared `"count"` sentinel survives — the
 * query-core fix the 2026-09-08 ruling withdraws.
 */
export const UNPAID_EXISTENCE_CRITERIA: InvoiceQueryModel = {
  filters: { "status.code": { in: InvoiceStatusGroups.UNPAID } },
  pagination: { limit: 1 }
};

/**
 * AC2's list-filter preset — narrows the VISIBLE list to invoices this client
 * could consolidate (`filterConsolidatable()`, `useInvoices.actions.ts`).
 * `clientId` is the resolved scope target (`oracle:574-593`). No pagination
 * override: a consumer filtering the list still wants it paged normally, so
 * this declares filters only — the notice/CTA COUNT is a separate reader,
 * {@link consolidatableCountCriteria}, over its OWN dedicated query
 * (`invoices.services.ts`'s `loadConsolidatableCount`), never this one.
 */
export function consolidatableCriteria(clientId?: string): InvoiceQueryModel {
  return {
    filters: {
      "status.code": { in: InvoiceStatusGroups.UNPAID },
      is_consolidation: { eq: false },
      "category.slug": { in: [InvoiceCategoryCode.RECURRENT] },
      client_id: { eq: clientId },
      paid_amount: { eq: 0 }
    }
  };
}

/**
 * AC2's dedicated COUNT preset — the same filter columns as
 * {@link consolidatableCriteria} (reused, never re-declared), plus the
 * one-row page window {@link UNPAID_EXISTENCE_CRITERIA}'s `@decision`
 * establishes for a count-only read. Seeds `loadConsolidatableCount`'s OWN
 * query (`invoices.services.ts`), which owns its own criteria object — so
 * reading the count can never mutate the list `filterConsolidatable()`
 * narrows, and the two coexist.
 */
export function consolidatableCountCriteria(
  clientId?: string
): InvoiceQueryModel {
  return {
    ...consolidatableCriteria(clientId),
    pagination: { limit: 1 }
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
 * construction. Both consumers (`useInvoices.context.ts`,
 * `invoices.services.ts`) resolve their schema family through this factory,
 * never the bare `useQuerySchema`/`useQueryUischema`/`useSortUischema`
 * exports directly, so a future arm on `scopedSchemas` above reaches both
 * without either consumer changing shape.
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
