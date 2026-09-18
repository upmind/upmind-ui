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
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement
} from "@jsonforms/core";
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
 * from the enums' own values, never hand-typed, so no member is re-declared.
 *
 * Each entry carries its full i18n key on `i18n`, not on `title`: JSONForms'
 * `oneOfToEnumOptionMapper` (`@jsonforms/core` `src/mappers/renderer.ts`)
 * "prefers schema keys as more specialized" and, when an entry carries `i18n`,
 * translates it VERBATIM — no prefix concatenation. `title` alone (this
 * file's earlier convention) falls into the mapper's OTHER branch, which
 * treats `title` as a bare label and prefixes it with the *element's* own
 * `i18n` (`invoices.filter_bar.status`), composing the unresolvable
 * `invoices.filter_bar.status.invoices.filter_option.status.<value>`. `title`
 * is kept, unchanged, as the untranslated fallback text `t(key, title)` shows
 * before the catalogue carries the key — the house convention of a raw i18n
 * key rendering pre-catalogue.
 */
const STATUS_VOCABULARY = [
  ...Object.values(InvoiceStatus),
  ...Object.values(CreditNoteStatus)
].map(code => {
  const i18n = `invoices.filter_option.status.${code}`;
  return { const: code, title: i18n, i18n };
});

/**
 * The `category.slug` column's WHOLE offerable vocabulary — every
 * {@link InvoiceCategoryCode} member (`design.md` "Filter columns"), derived
 * and keyed the same way as {@link STATUS_VOCABULARY}.
 */
const CATEGORY_VOCABULARY = Object.values(InvoiceCategoryCode).map(code => {
  const i18n = `invoices.filter_option.category.${code}`;
  return { const: code, title: i18n, i18n };
});

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
            type: ["string", "null"],
            title: "invoices.filter.id"
            // No `properties`: a branch with no operator sub-schema reaches the
            // wire as a BARE `filter[id]`, which the API defaults to
            // equality (`translateQuery`, `query.utils.ts`). Declaring `eq`
            // would spell `filter[...|eq]`, which the platform rejects 422.
          },
          number: {
            type: ["string", "null"],
            title: "invoices.filter.number"
            // No `properties`: a branch with no operator sub-schema reaches the
            // wire as a BARE `filter[number]`, which the API defaults to
            // equality (`translateQuery`, `query.utils.ts`). Declaring `eq`
            // would spell `filter[...|eq]`, which the platform rejects 422.
          },
          "status.code": {
            type: ["string", "array", "null"],
            title: "invoices.filter.status",
            items: { type: "string", oneOf: STATUS_VOCABULARY },
            // Kept on the bare column: the bar's multi-select tester matches on it.
            uniqueItems: true
            // No `properties`: a branch with no operator sub-schema reaches the
            // wire as a BARE `filter[status.code]`, which the API defaults to
            // equality (`translateQuery`, `query.utils.ts`). Declaring `eq`
            // would spell `filter[...|eq]`, which the platform rejects 422.
          },
          client_id: {
            type: ["string", "null"],
            title: "invoices.filter.client_id"
            // No `properties`: a branch with no operator sub-schema reaches the
            // wire as a BARE `filter[client_id]`, which the API defaults to
            // equality (`translateQuery`, `query.utils.ts`). Declaring `eq`
            // would spell `filter[...|eq]`, which the platform rejects 422.
          },
          is_consolidation: {
            type: ["boolean", "null"],
            title: "invoices.filter.is_consolidation",
            enum: [true, false, null]
            // No `properties`: a branch with no operator sub-schema reaches the
            // wire as a BARE `filter[is_consolidation]`, which the API defaults to
            // equality (`translateQuery`, `query.utils.ts`). Declaring `eq`
            // would spell `filter[...|eq]`, which the platform rejects 422.
          },
          "category.slug": {
            type: ["string", "array", "null"],
            title: "invoices.filter.category",
            items: { type: "string", oneOf: CATEGORY_VOCABULARY },
            // Kept on the bare column: the bar's multi-select tester matches on it.
            uniqueItems: true
            // No `properties`: a branch with no operator sub-schema reaches the
            // wire as a BARE `filter[category.slug]`, which the API defaults to
            // equality (`translateQuery`, `query.utils.ts`). Declaring `eq`
            // would spell `filter[...|eq]`, which the platform rejects 422.
          },
          credit_invoice_id: {
            type: ["string", "null"],
            title: "invoices.filter.credit_invoice_id",
            // Seeded from the `.for('invoice', id)` scope slot, never a bar
            // control — `readOnly` marks it not consumer-settable.
            readOnly: true
            // No `properties`: a branch with no operator sub-schema reaches the
            // wire as a BARE `filter[credit_invoice_id]`, which the API defaults to
            // equality (`translateQuery`, `query.utils.ts`). Declaring `eq`
            // would spell `filter[...|eq]`, which the platform rejects 422.
          },
          paid_amount: {
            type: ["number", "null"],
            title: "invoices.filter.paid_amount"
            // No `properties`: a branch with no operator sub-schema reaches the
            // wire as a BARE `filter[paid_amount]`, which the API defaults to
            // equality (`translateQuery`, `query.utils.ts`). Declaring `eq`
            // would spell `filter[...|eq]`, which the platform rejects 422.
          },
          total_amount: {
            type: ["number", "null"],
            title: "invoices.filter.total_amount"
            // No `properties`: a branch with no operator sub-schema reaches the
            // wire as a BARE `filter[total_amount]`, which the API defaults to
            // equality (`translateQuery`, `query.utils.ts`). Declaring `eq`
            // would spell `filter[...|eq]`, which the platform rejects 422.
          },
          net_amount: {
            type: ["number", "null"],
            title: "invoices.filter.net_amount"
            // No `properties`: a branch with no operator sub-schema reaches the
            // wire as a BARE `filter[net_amount]`, which the API defaults to
            // equality (`translateQuery`, `query.utils.ts`). Declaring `eq`
            // would spell `filter[...|eq]`, which the platform rejects 422.
          },
          total_discount_amount: {
            type: ["number", "null"],
            title: "invoices.filter.total_discount_amount"
            // No `properties`: a branch with no operator sub-schema reaches the
            // wire as a BARE `filter[total_discount_amount]`, which the API defaults to
            // equality (`translateQuery`, `query.utils.ts`). Declaring `eq`
            // would spell `filter[...|eq]`, which the platform rejects 422.
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
            type: ["boolean", "null"],
            title: "invoices.filter.proforma",
            enum: [true, false, null]
            // No `properties`: a branch with no operator sub-schema reaches the
            // wire as a BARE `filter[proforma]`, which the API defaults to
            // equality (`translateQuery`, `query.utils.ts`). Declaring `eq`
            // would spell `filter[...|eq]`, which the platform rejects 422.
          },
          // Declared for parity, deliberately undrawn for a client bar — a
          // declared-but-undrawn column is filterable by URL and absent from
          // the bar (design.md "Filter columns").
          fraud_status: {
            type: ["number", "array", "null"],
            title: "invoices.filter.fraud_status",
            items: { type: "number" },
            uniqueItems: true
            // No `properties`: a branch with no operator sub-schema reaches the
            // wire as a BARE `filter[fraud_status]`, which the API defaults to
            // equality (`translateQuery`, `query.utils.ts`). Declaring `eq`
            // would spell `filter[...|eq]`, which the platform rejects 422.
          },
          "contracts.id": {
            type: ["string", "null"],
            title: "invoices.filter.contract_id",
            // Seeded from the `.for('contract', id)` scope slot, never a bar
            // control — `readOnly` marks it not consumer-settable.
            readOnly: true
            // No `properties`: a branch with no operator sub-schema reaches the
            // wire as a BARE `filter[contracts.id]`, which the API defaults to
            // equality (`translateQuery`, `query.utils.ts`). Declaring `eq`
            // would spell `filter[...|eq]`, which the platform rejects 422.
          },
          "products.contracts_product_id": {
            type: ["string", "null"],
            title: "invoices.filter.contracts_product_id",
            // Seeded from the `.for('contracts_product', id)` scope slot, never
            // a bar control — `readOnly` marks it not consumer-settable.
            readOnly: true
            // No `properties`: a branch with no operator sub-schema reaches the
            // wire as a BARE `filter[products.contracts_product_id]`, which the API defaults to
            // equality (`translateQuery`, `query.utils.ts`). Declaring `eq`
            // would spell `filter[...|eq]`, which the platform rejects 422.
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
        scope: "#/properties/filters/properties/number",
        i18n: "invoices.filter_bar.number",
        options: { format: "search", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/status.code",
        i18n: "invoices.filter_bar.status",
        // `multi-select` opts this leaf into the bar's COMPACT checkable menu
        // (`FilterMultiSelectRenderer`). Absent it, the leaf's own shape
        // (`array` + `uniqueItems` + `items.oneOf`) still matches the ui
        // package's expanded tile stack, which is taller and wider than the
        // bar it sits in.
        options: { format: "multi-select", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/category.slug",
        i18n: "invoices.filter_bar.category",
        options: { format: "multi-select", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/is_consolidation",
        i18n: "invoices.filter_bar.is_consolidation",
        options: { format: "button-group", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/total_amount",
        i18n: "invoices.filter_bar.total_amount",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/net_amount",
        i18n: "invoices.filter_bar.net_amount",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/create_datetime",
        i18n: "invoices.filter_bar.create_datetime",
        options: { format: "range", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/due_date",
        i18n: "invoices.filter_bar.due_date",
        options: { format: "range", optionalText: "" }
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
  filters: { "status.code": InvoiceStatusGroups.UNPAID },
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
      "status.code": InvoiceStatusGroups.UNPAID,
      is_consolidation: false,
      "category.slug": [InvoiceCategoryCode.RECURRENT],
      client_id: clientId,
      paid_amount: 0
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
      "category.slug": [
        InvoiceCategoryCode.CREDIT_NOTE,
        InvoiceCategoryCode.CREDIT_NOTE_FOR_REFUND
      ],
      ...(invoiceId ? { credit_invoice_id: invoiceId } : {})
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

/**
 * The criteria model path the invoice lookup control's typed term writes — a
 * top-level `query` string (NOT a `filters` branch), the backend's dedicated
 * quick-search, which `translateQuery` emits as a bare `query=<term>`.
 */
export const INVOICE_LOOKUP_SEARCH_SCOPE = "query";

/**
 * The criteria schema for the async invoice lookup — the whole request state
 * (`query` quick-search + `pagination`) as ONE Draft-07 schema. The picker
 * offers parent invoices for the `.for('invoice', id)` scope slot.
 */
export function useInvoiceLookupSchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      query: {
        type: ["string", "null"],
        title: "invoices.lookup.search",
        minLength: 1
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 1, default: 20 },
          offset: { type: "integer", minimum: 0, default: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}

/** The criteria model path the contract lookup control's typed term writes. */
export const CONTRACT_LOOKUP_SEARCH_SCOPE = "query";

/**
 * The criteria schema for the async contract lookup — quick-search plus
 * pagination. The picker offers the contracts a `.for('contract', id)` scope
 * slot takes.
 */
export function useContractLookupSchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      query: {
        type: ["string", "null"],
        title: "invoices.lookup.search",
        minLength: 1
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 1, default: 20 },
          offset: { type: "integer", minimum: 0, default: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}

/** The criteria model path the contract-product lookup control's term writes. */
export const CONTRACT_PRODUCT_LOOKUP_SEARCH_SCOPE = "query";

/**
 * The criteria schema for the async contract-product lookup — quick-search plus
 * pagination. The picker offers what a `.for('contracts_product', id)` slot
 * takes.
 */
export function useContractProductLookupSchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      query: {
        type: ["string", "null"],
        title: "invoices.lookup.search",
        minLength: 1
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 1, default: 20 },
          offset: { type: "integer", minimum: 0, default: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}
