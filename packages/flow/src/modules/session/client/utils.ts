import { forEach, set, omitBy, isNil, map, some } from "lodash-es";

const translate = (item, field) => {
  const translated = item[`${field}_translated`];
  if (translated) return translated;
  return item[field];
};

export const useRegisterSchemaParser = (data: any) => {
  const schema = {
    type: "object",
    title: "Register",
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
        case "tick_box":
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

  return schema;
};

export const useRegisterUischemaParser = (data: any) => {
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

  return schema;
};

export const useRegisterModelParser = (data: any) => {
  const model = {
    firstname: null,
    lastname: null,
    email: null,
    password: null,
    custom_fields: {}
  };

  if (data?.length) {
    forEach(data, field => {
      set(model, `custom_fields.${field.code}`, field?.default || null);
    });
  }

  return model;
};
// ---

export const useLoginSchemaParser = () => {
  return {
    type: "object",
    title: "Login",
    required: ["email", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
        title: "Your email address"
      },
      password: {
        type: "string",
        format: "password",
        title: "Your password"
      }
    }
  };
};

export const useLoginUischemaParser = () => {
  return {
    type: "VerticalLayout",
    elements: [
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
          placeholder: "password or passphrase"
        }
      }
    ]
  };
};

export const useLoginModelParser = () => {
  return {
    email: null,
    password: null
  };
};
// ---

export const use2faSchemaParser = () => {
  return {
    type: "object",
    title: "Verify 2FA",
    required: ["token"],
    properties: {
      token: {
        type: "string",
        pattern: "\\d{6}",
        title: "Your 2fa code"
      }
    }
  };
};

export const use2faUischemaParser = () => {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/token",
        options: {
          autocomplete: "off",
          placeholder: "123 456"
          // mask: "### ###"
        }
      }
    ]
  };
};

export const use2faModelParser = () => {
  return {
    token: null
  };
};

// ---

export const useValidationParser = (error: any) => {
  if (error?.data) {
    error.message = "Validation error";

    const errors = [];
    forEach(error.data, (value, key) => {
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

    error.data = errors;
  }

  return error;
};
