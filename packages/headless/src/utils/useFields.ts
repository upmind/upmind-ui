//--- utils
import { useTranslateField } from "./useTranslation";
import {
  forEach,
  get,
  isNil,
  map,
  omitBy,
  set,
  some,
  isString,
  isEmpty,
  reduce,
} from "lodash-es";

// -----------------------------------------------------------------------------

export const useFieldsSchemaParser = (data: any, i18nPrefix?: string) => {
  i18nPrefix = i18nPrefix ? `${i18nPrefix}.fields` : "fields";
  const schema = {
    type: "object",
    title: "Fields",
    i18n: i18nPrefix,
    required: [],
    properties: {},
  };

  if (data?.length) {
    const required: string[] = [];
    const properties = {};

    forEach(data, field => {
      let type = ["string"];
      let format = null;
      const contentMediaType = null;
      const contentEncoding = null;
      // lets map our field types...
      switch (field.type_code) {
        case "input_number":
        case "number":
          type = ["number"];
          break;

        case "input-checkbox":
        case "tick_box":
          type = ["boolean"];
          break;

        case "input_date":
        case "input_datetime":
        case "date":
          type = ["string"];
          format = "date-time";
          break;

        case "input_email":
        case "email":
          type = ["string"];
          format = "email";
          break;

        case "username":
          type = ["string"];
          format = "email";
          break;

        case "input_url":
          type = ["string"];
          format = "uri";
          break;

        case "input_phone":
          type = ["string"];
          format = "phone";
          break;

        case "input_ip":
          type = ["string"];
          format = "ipv4";
          break;

        case "input_ipv6":
          type = ["string"];
          format = "ipv6";
          break;

        case "input_password":
        case "password":
          type = ["string"];
          format = "password";
          break;

          // case "input_file":
          // case "image":
          //   type = ["string"];
          //   contentMediaType = "image";
          //   contentEncoding = "base64";
          break;

        default:
          type = ["string"];
          break;
      }

      // required fields
      if (field.required && !field.hidden && field.show_on_order_form) {
        required.push(field.code);
      } else {
        type.push("null");
      }

      // then we set our property based on the field code
      if (!field.hidden && field.show_on_order_form) {
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
              enum: !some(field.options, isString) ? undefined : field.options, //   ? undefined
              //   : map(field.options, item => {
              //       return {
              //         const: item.value,
              //         title: item.label,
              //       };
              //     }),
              oneOf: !field.values?.length
                ? undefined
                : map(useTranslateField(field, "values"), item => {
                    return {
                      const: item.value,
                      title: item.label,
                    };
                  }),
            },
            isNil
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
  if (!data?.length) {
    return [];
  }
  const schema = reduce(
    data,
    (result: any[], field) => {
      if (!field.hidden && field.show_on_order_form) {
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

          case "input_password":
          case "password":
            type = "password";
            break;

          case "input_file":
          case "image":
            type = "file";
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
            ...options,
          },
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
