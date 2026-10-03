/** @internal */
import { SortDirection } from "../query/query.types";
import { PAGINATION } from "../query/query.utils";
import { LEGACY_INVOICE_DEFAULT_SORT } from "./legacy-invoices.types";
import type { QuerySchema } from "../query/query.types";
import type { ControlElement, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/legacy-invoices.schemas
 * @description The archive's query schema and its filter-bar and sort
 * uischemas. Three filter columns, each with the operator branch ruling OD4
 * declares; `number`'s `like` operator is CONTAINS only, never a prefix or a
 * suffix match, because the wire translation wraps the value on both sides
 * and that translation is off limits (ruling OD5). The two date operators
 * `before`/`after` carry no date-time format, because a format declaration
 * refuses their relative expression (D-19). The module declares BOTH
 * page-window defaults itself (D-24) — the `invoices` exemplar declares only
 * `limit`, so AC9's fallback anchor stays on this module's own declaration,
 * never on the query core.
 *
 * @decision
 * what: this file exports `useQuerySchema` / `useQueryUischema` /
 * `useSortUischema`, never the query template's own generic
 * `useSchemaDefinitions` / `useSchema` / `useUischemaDefinitions` /
 * `useUischema` / `useLegacyInvoicesModelParser` /
 * `createLegacyInvoicesSchemas` / a `default` export.
 * why: `design.md` section 5.1 names this file's real content
 * (`legacy-invoices.schemas.ts # useQuerySchema, useQueryUischema,
 * useSortUischema`) against the `invoices` exemplar (ruling B6/D-2), and the
 * SDD design document is the content authority over an unfilled template
 * placeholder (`code-scoped-composable` SKILL.md, Template law: "the rules
 * bind the content of each slot"). The `$ref`/definitions pattern
 * `ARMS.md` describes exists to let an ARM `$ref` a shared field/control
 * definition for every column it does not override; arms=none here (ruling
 * OD1), so there is no arm to share a definition with, and the definitions
 * indirection would be structure with nothing pointing at it.
 * rejected: the generic `useSchema`/`useUischema`/definitions shape with no
 * arm ever consuming it — an unearned indirection the module has no use for.
 */
// -----------------------------------------------------------------------------

export function useQuerySchema(): QuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        // oracle: filters/invoice.ts:190-193 — LegacyInvoicesFilters keeps only these three keys.
        properties: {
          // oracle: filters/invoice.ts:42-47 — NumberFilter, key `number` (STRING → eq/neq/like, OD4).
          number: {
            type: "object",
            additionalProperties: false,
            properties: {
              eq: { type: ["string", "null"] },
              neq: { type: ["string", "null"] },
              like: { type: ["string", "null"], minLength: 1 }
            }
          },
          // oracle: filters/invoice.ts:49-54 — TotalAmountFilter, key `total_amount` (NUMBER → eq/neq/gt/gte/lt/lte, OD4).
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
          // oracle: filters/invoice.ts:81-86 — DateCreatedFilter, key `create_datetime` (DATE → eq/gt/gte/lt/lte/before/after, OD4).
          create_datetime: {
            type: "object",
            additionalProperties: false,
            properties: {
              // EXACT-date leaves carry format "date", not "date-time": a
              // DateRenderer pick writes `YYYY-MM-DD`, which the criteria gate
              // then passes to the wire (ruling F2-R). This diverges from the
              // oracle's `YYYY-MM-DD HH:mm:ss` datetime (vue-app
              // src/helpers/table.ts:169-176); staging accepts both.
              eq: { type: ["string", "null"], format: "date" },
              gt: { type: ["string", "null"], format: "date" },
              gte: { type: ["string", "null"], format: "date-time" },
              lt: { type: ["string", "null"], format: "date" },
              lte: { type: ["string", "null"], format: "date-time" },
              // Relative expressions — no date-time format (D-19).
              before: { type: ["string", "null"] },
              after: { type: ["string", "null"] }
            }
          }
        }
      },
      sort: {
        type: "array",
        // oracle: legacyInvoicesProvider.vue:66-69 — default sort `create_datetime` descending.
        default: LEGACY_INVOICE_DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            // oracle: sorters/invoices.ts:48-51 — LegacyInvoicesSorters (`create_datetime` :15-18, `total_amount` :5-8).
            field: { enum: ["create_datetime", "total_amount"] },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: PAGINATION.limit },
          offset: { type: "integer", minimum: 0, default: PAGINATION.offset }
        }
      }
    }
  } satisfies QuerySchema;
}

export function useQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        // The `like` string leaf, not the column object — FilterSearchRenderer's
        // tester is `and(isStringControl, optionIs("format","search"))`, so the
        // search box binds the string operator the wire translator wildcards
        // (OD4 branch, OD5 contains-only; exemplar `number`, invoices.schemas 128).
        scope: "#/properties/filters/properties/number/properties/like",
        i18n: "form.legacy_invoice_number_filter",
        options: { format: "search", optionalText: "" }
      },
      // The scalar operator leaves the range/search renderers cannot reach draw
      // through the format-less generic controls, one control per leaf, so a hand
      // can drive every OD4 operator the oracle's picker offers (F1-R). Each leaf
      // carries no `format`, so it falls to the base renderer that tests its
      // JSON-schema type: a string leaf → StringRenderer
      // (StringRenderer.vue:111, `{ rank:1, controlType: isStringControl }`); a
      // number leaf → NumberRenderer (NumberRenderer.vue:80-83,
      // `or(isNumberControl, isIntegerControl)`); an exact-date leaf (eq/gt/lt)
      // carries `format: "date"` since ruling F2-R, so it falls to DateRenderer
      // through its `formatIs("date")` branch (DateRenderer.vue:30-33, rank 2
      // over StringRenderer). The gte/lte date-time pair keeps to the range
      // renderer, never DateRenderer.
      {
        type: "Control",
        scope: "#/properties/filters/properties/number/properties/eq",
        i18n: "form.legacy_invoice_number_eq_filter",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/number/properties/neq",
        i18n: "form.legacy_invoice_number_neq_filter",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/total_amount",
        i18n: "form.legacy_invoice_total_filter",
        // FilterRangeRenderer is the ONE renderer whose tester matches an object
        // operator column — `and(isObjectControl, optionIs("format","range"))`. It
        // draws the gte/lte pair; the schema keeps the full OD4 branch. This is
        // the exemplar's own object-column format (invoices.schemas 166).
        options: { format: "range", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/total_amount/properties/eq",
        i18n: "form.legacy_invoice_total_eq_filter",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/total_amount/properties/neq",
        i18n: "form.legacy_invoice_total_neq_filter",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/total_amount/properties/gt",
        i18n: "form.legacy_invoice_total_gt_filter",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/total_amount/properties/lt",
        i18n: "form.legacy_invoice_total_lt_filter",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/create_datetime",
        i18n: "form.legacy_invoice_created_filter",
        options: { format: "range", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/create_datetime/properties/eq",
        i18n: "form.legacy_invoice_created_eq_filter",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/create_datetime/properties/gt",
        i18n: "form.legacy_invoice_created_gt_filter",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/create_datetime/properties/lt",
        i18n: "form.legacy_invoice_created_lt_filter",
        options: { optionalText: "" }
      },
      // `after`/`before` carry no `date-time` format (D-19, relative expressions),
      // so they fall to StringRenderer as free-text relative controls.
      {
        type: "Control",
        scope:
          "#/properties/filters/properties/create_datetime/properties/after",
        i18n: "form.legacy_invoice_created_after_filter",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope:
          "#/properties/filters/properties/create_datetime/properties/before",
        i18n: "form.legacy_invoice_created_before_filter",
        options: { optionalText: "" }
      }
    ]
  } as UISchemaElement;
}

export function useSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.legacy_invoice_sort"
  };
}
