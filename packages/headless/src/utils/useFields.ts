//--- utils
import { isArray } from "xstate/lib/utils";
import { BlueprintFieldsTypes } from "@upmind-automation/types";
import { useTranslateField } from "./useTranslation";
import {
  forEach,
  get,
  isEmpty,
  omitBy,
  set,
  isString,
  reduce,
  includes
} from "lodash-es";
import type { CustomField } from "../modules/client-custom-fields";
import type { JsonSchema7, ControlElement } from "@jsonforms/core";

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
