/** @internal */
// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import { PAGINATION, SortDirection } from "../query";
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement
} from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module module/module.schemas
 * @description Module form schemas and the collection's query schema family.
 */

function useSchemaDefinitions(): JsonSchema7["definitions"] {
  return {
    id: { type: "string", readOnly: true, default: "" },
    name: { type: "string", minLength: 1 },
    email: { type: "string", format: "email" }
  };
}

export const useSchema = (): JsonSchema7 => ({
  type: "object",
  title: "text.module_title",
  definitions: useSchemaDefinitions(),
  properties: {
    id: { $ref: "#/definitions/id" },
    name: { $ref: "#/definitions/name" },
    email: { $ref: "#/definitions/email" }
  },
  required: ["name"]
});

// Keyed by field so an actor arm can reuse one control and replace another.
function useUischemaDefinitions() {
  return {
    name: {
      type: "Control",
      scope: "#/properties/name",
      i18n: "form.module_name"
    },
    email: {
      type: "Control",
      scope: "#/properties/email",
      i18n: "form.module_email"
    }
  };
}

export const useUischema = (): UISchemaElement => {
  const controls = useUischemaDefinitions();

  return {
    type: "VerticalLayout",
    elements: [controls.name, controls.email]
  } as UISchemaElement;
};
// -----------------------------------------------------------------------------
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
            title: "text.module_name",
            additionalProperties: false,
            properties: {
              // The translator adds the % wildcards.
              like: { type: ["string", "null"], minLength: 1 }
            }
          },
          verified: {
            type: "object",
            title: "text.verified_label",
            additionalProperties: false,
            properties: {
              eq: {
                type: ["boolean", "null"],
                oneOf: [
                  { const: true, title: "text.yes" },
                  { const: false, title: "text.no" }
                ]
              }
            }
          }
        }
      },
      sort: {
        type: "array",
        default: [{ field: "created_at", dir: SortDirection.DESC }],
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["created_at", "name"] },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          // `limit: 0` is one unpaged page.
          limit: { type: "integer", minimum: 0, default: PAGINATION.limit },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}

export function useQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/name/properties/like",
        i18n: "form.module_search",
        options: { format: "search", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/verified/properties/eq",
        i18n: "form.verified_filter",
        options: { format: "button-group", noLabel: true, optionalText: "" }
      }
    ]
  } as UISchemaElement;
}

export function useSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.module_sort"
  };
}
