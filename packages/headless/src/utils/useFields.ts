//--- utils
import { isArray } from "xstate/lib/utils";
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

// -----------------------------------------------------------------------------

export const useFieldsSchemaParser = (data: any, i18nPrefix?: string) => {
  i18nPrefix = i18nPrefix ? `${i18nPrefix}.fields` : "fields";
  const schema = {
    type: "object",
    title: "Fields",
    i18n: i18nPrefix,
    required: [],
    properties: {}
  };

  if (!!data?.length) {
    const required: string[] = [];
    const properties = {};

    forEach(data, field => {
      let type: string | string[] = "string";
      let format = null;
      const contentMediaType = null;
      const contentEncoding = null;

      // export enum BlueprintFieldsTypes {
      //   INPUT_TEXT = "input_text",
      //   INPUT_TEL = "input_tel",
      //   INPUT_PASSWORD = "input_password",
      //   INPUT_NUMBER = "input_number",
      //   INPUT_RANGE = "input_range",
      //   INPUT_DATE = "input_date",
      //   INPUT_DATETIME = "input_datetime",
      //   INPUT_RADIO = "input_radio",
      //   CHECKBOX = "checkbox",
      //   SELECT = "select",
      //   TEXTAREA = "textarea"
      // };

      // lets map our field types...

      switch (field.type_code) {
        case "input_number":
        case "number":
          type = "number";
          break;

        case "input-checkbox":
        case "tick_box":
          type = "boolean";
          break;

        case "input_date":
        case "input_datetime":
        case "date":
          type = "string";
          format = "date-time";
          break;

        case "input_email":
        case "email":
          type = "string";
          format = "email";
          break;

        case "username":
          type = "string";
          format = "email";
          break;

        case "input_url":
          type = "string";
          format = "uri";
          break;

        case "input_phone":
          type = "string";
          format = "phone";
          break;

        case "input_ip":
          type = "string";
          format = "ipv4";
          break;

        case "input_ipv6":
          type = "string";
          format = "ipv6";
          break;

        case "input_password":
        case "password":
          type = "string";
          format = "password";
          break;

        // case "input_file":
        // case "image":
        //   type = "string";
        //   contentMediaType = "image";
        //   contentEncoding = "base64";
        // break;

        default:
          type = "string";
          break;
      }

      // required fields
      if (field.required && !field.hidden) {
        required.push(field.code);
      } else {
        type = (!isArray(type) ? [type] : type) as string[];
        if (!includes(type, "null")) type.push("null");
      }

      debugger;

      // Now set/clean any enum values that will restrict the field input
      const enumValues = reduce(
        field?.values,
        (acc: (string | null)[] | (number | null)[], item) => {
          const value = isString(item) ? item : item?.value;
          // NB only add unique values that are not nullish
          if (!isEmpty(value) && !includes(acc, value)) acc.push(value);
          return acc;
        },
        []
      );
      // MB add null option for non required fields
      if (!field.required && enumValues?.length) {
        enumValues.unshift(null);
      }

      // then we set our property based on the field code
      if (!field.hidden) {
        set(
          properties,
          field.code,
          omitBy(
            {
              type,
              format,
              contentMediaType,
              contentEncoding,
              title: useTranslateField(field, "name"),
              description: useTranslateField(field, "description"),
              i18n: `${i18nPrefix}.${field.code}`,
              default: field.default,
              const: field.const,
              enum: !enumValues?.length ? undefined : enumValues,
              options: !field.values?.length
                ? undefined
                : useTranslateField(field, "values")
            },
            isEmpty
          )
        );
      }
    });

    set(schema, "required", required);
    set(schema, "properties", properties);
  }

  return schema;
};

export const useFieldsUischemaParser = (data: any, i18nKey = "fields") => {
  if (isEmpty(data)) return [];

  const schema = reduce(
    data,
    (result: any[], field) => {
      if (!field.hidden) {
        let type = null;
        let multi = false;

        const options = field?.options || {};

        // lets map our server field types to jsonforms field types...
        switch (field.type_code) {
          case "textarea":
          case "text_area":
            multi = true;
            break;

          case "input_number":
          case "number":
            type = "number";
            break;

          case "input_date":
          case "date":
            type = "date";
            break;

          case "input_datetime":
          case "datetime":
            type = "datetime-local";
            break;

          case "input_email":
          case "email":
            type = "email";
            break;

          case "username":
            type = "email";
            break;

          case "string":
            type = "string";
            break;

          case "input_password":
          case "password":
            type = "password";
            break;

          case "input_file":
            type = "file";
            options.field = {
              field_id: field?.id,
              field_type: "client_custom_field",
              field_is_default: false
            };
            break;

          case "image":
            type = "image";
            options.field = {
              field_id: field?.id,
              field_type: "client_custom_field",
              field_is_default: false
            };

            break;
        }

        const schema = {
          type: "Control",
          scope: `#/properties/customFields/properties/${field.code}`,
          i18n: `${i18nKey}.${field.code}`,
          options: {
            label: useTranslateField(field, "name"),
            description: useTranslateField(field, "description"),
            placeholder: useTranslateField(field, "placeholder"),
            multi,
            type,
            ...options
          }
        };

        result.push(schema);
      }

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
