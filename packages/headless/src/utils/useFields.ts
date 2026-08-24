//--- utils
import { isArray } from "xstate/lib/utils";
import { BlueprintFieldsTypes } from "@upmind-automation/types";
import { useTranslateField } from "./useTranslation";
import {
  filter,
  flatMap,
  forEach,
  get,
  isEmpty,
  map,
  omitBy,
  set,
  isString,
  reduce,
  includes,
  split,
  startsWith
} from "lodash-es";
import type { CustomField } from "../modules/client-custom-fields";
import type {
  JsonSchema7,
  ControlElement,
  UISchemaElement
} from "@jsonforms/core";
import type { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

export const useFieldsSchemaParser = (data?: CustomField[]): JsonSchema7 => {
  const schema: JsonSchema7 = {
    type: "object",
    title: "Fields",
    required: [],
    properties: {}
  };

  if (!isEmpty(data)) {
    const required: string[] = [];
    const properties = {};

    forEach(data, field => {
      let type: string | string[] = "string";
      let format = null;

      switch (field.type) {
        case BlueprintFieldsTypes.INPUT_NUMBER:
        case "number":
          type = "number";
          break;

        case BlueprintFieldsTypes.CHECKBOX:
        case "tick_box":
          type = "boolean";
          break;

        case BlueprintFieldsTypes.INPUT_DATE:
        case BlueprintFieldsTypes.INPUT_DATETIME:
        case "date":
          type = "string";
          format = "date-time";
          break;

        case BlueprintFieldsTypes.INPUT_TEL:
        case "phone":
          type = "string";
          format = "phone";
          break;

        case BlueprintFieldsTypes.INPUT_PASSWORD:
        case "password":
          type = "string";
          format = "password";
          break;

        default:
          type = "string";
          break;
      }

      // required fields
      if (field?.meta?.isRequired) {
        required.push(field.code);
      } else {
        type = (!isArray(type) ? [type] : type) as string[];
        if (!includes(type, "null")) type.push("null");
      }

      // Now set/clean any enum values that will restrict the field input
      const enumValues = reduce(
        field?.options || [],
        (acc: (string | number | null)[], item) => {
          const value = isString(item) ? item : item?.value;
          if (!isEmpty(value) && !includes(acc, value)) acc.push(value);
          return acc;
        },
        []
      );
      // MB add null option for non required fields
      if (!field.meta.isRequired && enumValues?.length) {
        enumValues.unshift(null);
      }

      // then we set our property based on the field code
      set(
        properties,
        field.code,
        omitBy(
          {
            type,
            format,
            title: useTranslateField(field, "name"),
            description: useTranslateField(field, "description"),
            readonly: field.meta.isReadOnly,
            enum: !enumValues?.length ? undefined : enumValues,
            options: !field.options?.length
              ? undefined
              : useTranslateField(field, "options")
          },
          isEmpty
        )
      );
    });

    set(schema, "required", required);
    set(schema, "properties", properties);
  }

  return schema;
};

export const useFieldsUischemaParser = (
  data?: CustomField[],
  i18nKey = "fields"
): ControlElement[] => {
  if (isEmpty(data)) return [];

  const schema = reduce(
    data,
    (result: any[], field) => {
      let type = null;
      let multi = false;

      const options: Record<string, any> = {};

      // lets map our server field types to jsonforms field types...
      switch (field.type) {
        case BlueprintFieldsTypes.TEXTAREA:
          multi = true;
          break;

        case BlueprintFieldsTypes.INPUT_NUMBER:
          type = "number";
          break;

        case BlueprintFieldsTypes.INPUT_DATE:
          type = "date";
          break;

        case BlueprintFieldsTypes.INPUT_DATETIME:
          type = "datetime-local";
          break;

        case BlueprintFieldsTypes.INPUT_PASSWORD:
          type = "password";
          break;

        case BlueprintFieldsTypes.FILE:
          type = "file";
          options.field = {
            field_id: field?.id,
            field_type: "client_custom_field",
            field_is_default: false
          };
          break;

        case BlueprintFieldsTypes.IMAGE:
        case "image":
          type = "image";
          options.field = {
            field_id: field?.id,
            field_type: "client_custom_field",
            field_is_default: false
          };
          break;

        case BlueprintFieldsTypes.SELECT:
          type = "select";
          break;

        case BlueprintFieldsTypes.INPUT_RADIO:
          type = "select";
          options.variant = "radio";
          break;

        case BlueprintFieldsTypes.CHECKBOX:
          type = "checkbox";
          break;

        default:
        case "string":
          type = "string";
          break;
      }

      const schema = {
        type: "Control",
        scope: `#/properties/customFields/properties/${field.code}`,
        i18n: `${i18nKey}.${field.code}`,
        options: {
          label: useTranslateField(field, "name"),
          multi,
          type,
          ...options
        }
      };

      result.push(schema);

      return result;
    },
    []
  );

  return schema;
};

export const useFieldsModelParser = (fields: any, values: any = {}) => {
  const model = values || {};
  if (!isEmpty(fields)) {
    forEach(fields, field => {
      const value = get(model, `${field.code}`, field?.value || field?.default);
      set(model, field.code, value);
    });
  }
  return model;
};

// -----------------------------------------------------------------------------
// UISCHEMA NARROWING UTILITIES (FE-3103)
// -----------------------------------------------------------------------------

/** Options for `pickUischemaControls`. */
export type PickUischemaControlsOptions = {
  /**
   * When true, returns the input uischema unchanged if no matching controls
   * are found — never an empty form. Defaults to true.
   */
  fallbackToFull?: boolean;
};

/**
 * Converts a dotted field token to its JSON schema scope.
 *
 * @example
 * tokenToScope('firstName') => '#/properties/firstName'
 * tokenToScope('customFields.age') => '#/properties/customFields/properties/age'
 */
function tokenToScope(token: string): string {
  const parts = split(token, ".");
  return "#/properties/" + parts.join("/properties/");
}

/**
 * Recursively collects Control elements whose scope matches any of the given
 * field tokens.
 */
function collectMatchingControls(
  node: UISchemaElement,
  scopes: Set<string>
): UISchemaElement[] {
  const scope = get(node, "scope") as string | undefined;
  if (scope && scopes.has(scope)) return [node];

  const elements = get(node, "elements", []) as UISchemaElement[];
  return flatMap(elements, child => collectMatchingControls(child, scopes));
}

/**
 * Walks a whole uischema tree recursively and returns a uischema of the same
 * root layout type holding only the Control elements whose scope matches the
 * given field tokens.
 *
 * Token grammar:
 * - A simple token maps directly: `firstName` → `#/properties/firstName`
 * - A dotted token maps to a nested scope: `customFields.age` →
 *   `#/properties/customFields/properties/age`
 *
 * Unknown tokens simply match nothing. When no controls match and
 * `options.fallbackToFull` is true (the default), the input is returned
 * unchanged — never an empty form.
 *
 * @param uischema The whole uischema tree to filter.
 * @param fields The field tokens to include.
 * @param options Optional settings.
 * @returns A uischema containing only the matching controls, or the input if
 * no matches and fallbackToFull is true.
 */
export function pickUischemaControls(
  uischema: UISchemaElement | undefined,
  fields: string[],
  options: PickUischemaControlsOptions = {}
): UISchemaElement | undefined {
  if (!uischema || isEmpty(fields)) return uischema;

  const { fallbackToFull = true } = options;
  const scopes = new Set(map(fields, tokenToScope));
  const matching = collectMatchingControls(uischema, scopes);

  if (isEmpty(matching)) return fallbackToFull ? uischema : undefined;

  return {
    type: get(uischema, "type", "VerticalLayout"),
    elements: matching
  } as UISchemaElement;
}

/**
 * Extracts field tokens from AJV validation errors.
 *
 * Handles both:
 * - `instancePath` errors: `/customFields/age` → `customFields.age`
 * - `required` errors with `missingProperty`: `firstName` → `firstName`
 *
 * @param errors AJV ErrorObject array from validation.
 * @returns Unique field tokens extracted from the errors.
 */
export function fieldsFromValidationErrors(
  errors: ErrorObject[] | undefined
): string[] {
  if (!errors || isEmpty(errors)) return [];

  const tokens = flatMap(errors, error => {
    const results: string[] = [];

    // Handle instancePath: /customFields/age → customFields.age
    const instancePath = get(error, "instancePath") as string | undefined;
    if (instancePath && instancePath !== "") {
      const path = startsWith(instancePath, "/")
        ? instancePath.slice(1)
        : instancePath;
      results.push(path.replace(/\//g, "."));
    }

    // Handle required errors with missingProperty
    const missingProperty = get(error, ["params", "missingProperty"]) as
      | string
      | undefined;
    if (missingProperty) {
      // If there's an instancePath, the missing property is nested under it
      if (instancePath && instancePath !== "") {
        const basePath = startsWith(instancePath, "/")
          ? instancePath.slice(1)
          : instancePath;
        results.push(basePath.replace(/\//g, ".") + "." + missingProperty);
      } else {
        results.push(missingProperty);
      }
    }

    return results;
  });

  return filter([...new Set(tokens)], Boolean) as string[];
}
