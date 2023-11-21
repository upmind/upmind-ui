import { forEach, set, omitBy, isNil } from "lodash-es";

const translate = (item, field) => {
  const translated = item[`${field}_translated`];
  if (translated) return translated;
  return item[field];
};

export const useCustomFieldsParser = (data: any) => {
  const required: string[] = [];
  const properties = {};

  forEach(data, field => {
    if (field.required) required.push(field.code);

    let type = "string";
    let format = null;

    // lets map our field types...
    switch (field.type_code) {
      case "input_number":
        type = "number";
        break;
      case "input-checkbox":
        type = "boolean";
        break;
      case "input_date":
        type = "string";
        format = "date";
        break;
      case "input_datetime":
        type = "string";
        format = "date-time";
        break;
      case "input_email":
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

      default:
        type = "string";
        break;
    }

    const schema = {
      type,
      format,
      title: translate(field, "name"),
      description: translate(field, "description"),
      default: field.default,
      enum: field.options?.length ? field.options : undefined
    };

    set(properties, field.code, omitBy(schema, isNil));
  });

  console.log("useCustomFieldsParser", { properties, required, data });

  // return a fully formed json schema
  return {
    type: "object",
    properties,
    required
  };
};
