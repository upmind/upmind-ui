/** @internal */
// -----------------------------------------------------------------------------
import { SortDirection } from "../query/query.types";
import { CustomPagesSortableProperties } from "./client-custom-pages.types";
import type { CustomPagesQuerySchema } from "./client-custom-pages.types";
import type { ControlElement, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages/client-custom-pages.schemas
 * @description The collection's QUERY schema — its whole request state
 * (filters · sort · pagination) as ONE Draft-07 schema over one model — with
 * its two presentations (`useQueryUischema` / `useSortUischema`), per the
 * ADR-032:286 three-member amendment. A SELF-CONTAINED JSON literal, so it
 * lifts straight into ajv or a test.
 *
 * The criteria-subversion law (ADR-032 decision 13, `:224`) governs: every
 * filter, sort and limit reaches the wire ONLY through
 * `list({ criteria: { schema: useQuerySchema() } })`
 * (`client-custom-pages.services.ts`). No `filter[...]` literal, sort string,
 * or limit value exists anywhere outside this file.
 *
 * WARNING: Do not import directly from another module — the barrel exports
 * no schema.
 */
// -----------------------------------------------------------------------------

/**
 * `showOnMenu` narrows to the pages the nav injects (D4, parity O25); `slug`
 * narrows the list to one page by its route slug (operator ruling C2 — the
 * list filter ships ALONGSIDE the single-read door, neither drops the other).
 *
 * No `sort.default` (design.md D4/D5, parity O6/O33): the oracle's boot read
 * is unparameterised — insertion order, no `order` param — so `sort` must
 * carry nothing until a consumer calls `sortBy()`, or the very first read
 * would send an `order` the oracle never does.
 *
 * `pagination.limit`/`.offset` DO default — to `0`, not `PAGINATION.limit`
 * (`query.utils.ts`). Every consumer (nav, listing) walks the WHOLE
 * collection client-side, so `limit: 0` asks for the unpaged read by default
 * (mirrors `client-address.schemas.ts`'s `pagination` block). A
 * `PAGINATION.limit` default here is FE-3103's truncation bug re-introduced:
 * it silently drops every page past the tenth from the nav with no error
 * (`isEmpty` false, `hasError` false) — see
 * `query/__tests__/page-window-declaration-wins.test.ts`, which names this
 * module's six siblings shipping `default: 0` for exactly this reason.
 */
export function useQuerySchema(): CustomPagesQuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          show_on_menu: {
            type: "object",
            title: "text.show_on_menu_label",
            additionalProperties: false,
            properties: {
              eq: {
                type: ["boolean", "null"],
                enum: [true, false, null]
              }
            }
          },
          slug: {
            type: "object",
            title: "text.slug_label",
            additionalProperties: false,
            properties: {
              eq: { type: ["string", "null"], minLength: 1 }
            }
          }
        }
      },
      sort: {
        type: "array",
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: {
              enum: [
                CustomPagesSortableProperties.DEFAULT,
                CustomPagesSortableProperties.NAME
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
          limit: { type: "integer", minimum: 0, default: 0 },
          offset: { type: "integer", minimum: 0, default: 0 }
        }
      }
    }
  } satisfies CustomPagesQuerySchema;
}

/**
 * The module's DEFAULT filter-bar presentation — ONE uischema over the one
 * query schema. `slug` carries no element: it is declared and settable
 * through `setCriteria` for the list-narrowing capability (C2), but the bar
 * draws only the menu toggle a consumer actually offers.
 */
export function useQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/show_on_menu/properties/eq",
        i18n: "form.show_on_menu_filter",
        options: { format: "toggle-group", noLabel: true, optionalText: "" }
      }
    ]
  } as UISchemaElement;
}

/**
 * The collection's ORDERING presentation — one element over the query
 * schema's `sort` branch, per the ADR-032:286 amendment.
 */
export function useSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.custom_pages_sort"
  };
}
