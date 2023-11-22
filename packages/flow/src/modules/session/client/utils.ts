import { forEach, set, omitBy, isNil, map, some } from "lodash-es";

const translate = (item, field) => {
  const translated = item[`${field}_translated`];
  if (translated) return translated;
  return item[field];
};

export const useSchemaParser = (data: any) => {
  const hasRequired = some(data, field => field.required);
  const required = [];
  const schema = {
    type: "object",
    required: ["firstname", "lastname", "email", "password"],
    properties: {
      firstname: {
        type: "string",
        title: "Your first name"
      },
      lastname: {
        type: "string",
        title: "Your last name"
      },
      email: {
        type: "string",
        title: "Your email address",
        format: "email"
      },
      password: {
        type: "string",
        title: "Your password",
        minLength: 8
      }
    }
  };

  if (data?.length) {
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

      // then we set our property based on the field code
      set(
        properties,
        field.code,
        omitBy(
          {
            type,
            format,
            title: translate(field, "name"),
            description: translate(field, "description"),
            default: field.default,
            const: field.const,
            enum: field.options?.length ? field.options : undefined
          },
          isNil
        )
      );
    });

    if (required.length) schema.required.push("custom_fields");

    set(schema, "properties.custom_fields", {
      type: "object",
      properties,
      required
    });
  }

  console.log("useSchemaParser", { schema, data });
  return schema;
};

export const useUischemaParser = (data: any) => {
  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/firstname",
        options: {
          focus: true,
          autocomplete: "given-name",
          placeholder: "Jay,Jane,John,... "
        }
      },
      {
        type: "Control",
        scope: "#/properties/lastname",
        options: {
          autocomplete: "family-name",
          placeholder: "Doe, Smith, ..."
        }
      },
      {
        type: "Control",
        scope: "#/properties/email",
        options: {
          autocomplete: "email",
          placeholder: "name@email.com"
        }
      },
      {
        type: "Control",
        scope: "#/properties/password",
        options: {
          type: "password",
          autocomplete: "current-password",
          placeholder: "Use a strong password or passphrase"
        }
      }
    ]
  };

  if (data?.length) {
    const group = {
      type: "Group",
      label: "Additional Fields",
      elements: map(data, field => ({
        type: "Control",
        scope: `#/properties/custom_fields/properties/${field.code}`
      }))
    };

    schema.elements.push(group);
  }

  console.log("useUischemaParser", { schema, data });
  return schema;
};

export const useValidationParser = (data: any) => {
  const errors = [];
  forEach(data, (value, key) => {
    const newError = {
      instancePath: `/${key}`, // AJV style path to the property in the schema
      message: value.toString(),
      // --- optional
      schemaPath: "",
      keyword: "",
      params: {}
    };
    errors.push(newError);
  });

  return errors;
};
