/** @internal */
import { CustomFieldsTypes } from "@upmind-automation/types";
import { SortDirection } from "../query/query.types";
import { CUSTOM_FIELD_DEFAULT_SORT } from "./client-custom-fields.types";
import {
  useFieldsModelParser,
  useFieldsSchemaParser,
  useFieldsUischemaParser
} from "../../utils";
import type {
  CustomField,
  CustomFieldModel
} from "./client-custom-fields.types";
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement
} from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/client-custom-fields.schemas
 * @description A's contract-ownership-by-RE-EXPORT seam (R4). The three
 * shared field parsers stay at `utils/useFields.ts` — imported there by
 * `auth/auth.schemas.register.ts` and `basket-fields/basket-fields.utils.ts`,
 * both out of this run's scope — and this module takes ownership of the
 * CONTRACT by re-exporting them under its own names (seam A-3/A-4/A-5).
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientCustomFields.ts` / the barrel only.
 */

/** Re-export of `useFieldsSchemaParser` (seam A-3). */
export const useCustomFieldsSchema = (fields?: CustomField[]): JsonSchema7 =>
  useFieldsSchemaParser(fields);

/** Re-export of `useFieldsUischemaParser` (seam A-4). */
export const useCustomFieldsUischema = (
  fields?: CustomField[],
  i18nKey?: string
): ControlElement[] => useFieldsUischemaParser(fields, i18nKey);

/** Re-export of `useFieldsModelParser` (seam A-5). */
export const useCustomFieldsModel = (
  fields: CustomField[],
  values?: CustomFieldModel
): CustomFieldModel => useFieldsModelParser(fields, values);

// -----------------------------------------------------------------------------
// QUERY schema — the collection's whole request state, as ONE Draft-07 schema
// -----------------------------------------------------------------------------
//
// @graphify-citation `graphify query "QueryModel FilterModel SortModel
// SortEntry CUSTOM_FIELD_DEFAULT_SORT"` (2026-08-22) —
// `graphify-out/graph.json` shows no `useQuerySchema`/`useQueryUischema`/
// `useSortUischema` node in THIS module; the pattern consumed is
// `client-email.schemas.ts`'s own trio. No duplicate to reuse; not barrelled
// — `useContext().schemas.query` is the only door (D1).

/**
 * The collection's QUERY schema — its whole request state (filters · sort ·
 * pagination) as ONE Draft-07 schema over one model. A SELF-CONTAINED JSON
 * literal, so it can be lifted straight into ajv or a test and run standalone.
 *
 * The catalogue is read WHOLE by the form surfaces that render it, so
 * `limit: 0` asks for the unpaged read by default — and that DECLARED default
 * is what beats the pager's own `PAGINATION.limit` of 10 through
 * `withPageWindow`'s merge. Both defaults are LEGACY PARITY, not invention:
 * `customFields.vue:261-272` dispatches
 * `params: { brand_id, limit: 0, order: "order" }`. `name` is the added
 * alternative — legacy offered no choice of server-side ordering at all.
 */
export function useQuerySchema(): JsonSchema7 {
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
            properties: {
              // The bare term — the translator adds the % wildcards.
              like: { type: ["string", "null"], minLength: 1 }
            }
          },
          type: {
            type: "object",
            title: "Field type",
            additionalProperties: false,
            properties: {
              // The numeric enum from CustomFieldsTypes; `null` clears the filter.
              eq: {
                type: ["integer", "null"],
                enum: [
                  CustomFieldsTypes.TEXT,
                  CustomFieldsTypes.PASSWORD,
                  CustomFieldsTypes.SELECT,
                  CustomFieldsTypes.SELECT_RADIO,
                  CustomFieldsTypes.TEXTAREA,
                  CustomFieldsTypes.DATE,
                  CustomFieldsTypes.NUMBER,
                  CustomFieldsTypes.IMAGE,
                  null
                ]
              }
            }
          },
          required: {
            type: "object",
            title: "Required",
            additionalProperties: false,
            properties: {
              // `null` is a MEMBER, not an absence: it is the value the unset
              // position writes, so a tri-state's clear has to validate, and it
              // is the enum entry whose label the control resolves.
              eq: {
                type: ["boolean", "null"],
                enum: [true, false, null]
              }
            }
          }
        }
      },
      sort: {
        type: "array",
        default: CUSTOM_FIELD_DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["order", "name"] },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        // `minimum: 0`, not 1: `limit: 0` stays legal — this module's own
        // unpaged default (legacy parity, see the docblock above).
        properties: {
          limit: { type: "integer", minimum: 0, default: 0 },
          offset: { type: "integer", minimum: 0, default: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}

/** Controls over the declared filters — field-name search, type and required. */
export function useQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/name/properties/like",
        i18n: "form.custom_field_search",
        options: {
          format: "search",
          icon: "search-md",
          noLabel: true,
          optionalText: ""
        }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/type/properties/eq",
        i18n: "form.type_filter",
        options: { format: "select", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/required/properties/eq",
        i18n: "form.required_filter",
        options: { format: "button-group", noLabel: true, optionalText: "" }
      }
    ]
  } as UISchemaElement;
}

/**
 * The ordering presentation. Its `i18n` is also the option-key PREFIX, so a
 * field resolves as `form.custom_field_sort.order` / `.name`. i18n keys never
 * live in the schema.
 */
export function useSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.custom_field_sort"
  };
}
