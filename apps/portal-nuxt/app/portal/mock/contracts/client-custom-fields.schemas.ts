// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-custom-fields.schemas
 * @standin packages/headless/src/modules/client-custom-fields/client-custom-fields.schemas.ts
 * @description A STAND-IN for the real module's own schema builders, carrying
 * the same three export names and the same `CustomField[]` /
 * `CustomFieldModel` parameters. go-real: swap this import for the real
 * module.
 *
 * The real file is three RE-EXPORTS of the shared parsers at
 * `packages/headless/src/utils/useFields.ts`, and `utils/` sits outside
 * `modules/`, which is the only runtime reach into headless this app allows
 * (eslint.config.mjs) — so the parsers themselves are transcribed here,
 * switch arm for switch arm, exactly as `mock/forms/ajv.ts` transcribes
 * `useValidation`'s formats and keywords.
 *
 * The uischema parser scopes each control at
 * `#/properties/customFields/properties/<code>`, so the fields compose UNDER a
 * `customFields` property of the parent schema — the caller owns that wrapper
 * (`mock/forms/custom-fields-context.ts`), exactly as the real consumers do.
 *
 * @module-oracle vue-app `clientCustomFieldsComp.vue`.
 */

import { BlueprintFieldsTypes } from "@upmind-automation/types";
import {
  assign,
  castArray,
  forEach,
  get,
  includes,
  isEmpty,
  isString,
  omitBy,
  reduce,
  set
} from "lodash-es";
import type { ControlElement, JsonSchema7 } from "@jsonforms/core";
import type {
  CustomField,
  CustomFieldModel
} from "@upmind-automation/headless";

/** A translated field label where the wire carries one, else the plain field. */
function useTranslateField(item: unknown, field: string): unknown {
  return get(item, `${field}_translated`, get(item, field));
}

/** Re-export of `useFieldsSchemaParser` (seam A-3). */
export const useCustomFieldsSchema = (data?: CustomField[]): JsonSchema7 => {
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
        const nullable = castArray(type);
        if (!includes(nullable, "null")) nullable.push("null");
        type = nullable;
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
      // add a null option for non-required fields
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

/** Re-export of `useFieldsUischemaParser` (seam A-4). */
export const useCustomFieldsUischema = (
  data?: CustomField[],
  i18nKey = "fields"
): ControlElement[] => {
  if (isEmpty(data)) return [];

  return reduce(
    data,
    (result: ControlElement[], field) => {
      let type = null;
      let multi = false;

      const options: Record<string, unknown> = {};

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
          options["field"] = {
            field_id: field?.id,
            field_type: "client_custom_field",
            field_is_default: false
          };
          break;

        case BlueprintFieldsTypes.IMAGE:
        case "image":
          type = "image";
          options["field"] = {
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
          options["variant"] = "radio";
          break;

        case BlueprintFieldsTypes.CHECKBOX:
          type = "checkbox";
          break;

        default:
        case "string":
          type = "string";
          break;
      }

      result.push({
        type: "Control",
        scope: `#/properties/customFields/properties/${field.code}`,
        i18n: `${i18nKey}.${field.code}`,
        options: assign(
          {
            label: useTranslateField(field, "name"),
            multi,
            type
          },
          options
        )
      });

      return result;
    },
    []
  );
};

/** Re-export of `useFieldsModelParser` (seam A-5). */
export const useCustomFieldsModel = (
  fields: CustomField[],
  values?: CustomFieldModel
): CustomFieldModel => {
  const model: CustomFieldModel = values || {};
  if (!isEmpty(fields)) {
    forEach(fields, field => {
      const value = get(
        model,
        `${field.code}`,
        get(field, "value") || get(field, "default")
      );
      set(model, field.code, value);
    });
  }
  return model;
};
