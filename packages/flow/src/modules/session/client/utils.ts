// --- utils
import {
  useFieldsSchemaParser,
  useFieldsUischemaParser,
  useFieldsModelParser
} from "../../../utils";

export { useValidationParser } from "../../../utils";

// --------------------------------------------------------

export const useRegisterSchemaParser = (data: any) => {
  const schema = {
    type: "object",
    title: "Register",
    required: ["firstname", "lastname", "email", "password"],
    properties: {
      firstname: {
        type: ["string", "null"],
        title: "Your first name"
      },
      lastname: {
        type: ["string", "null"],
        title: "Your last name"
      },
      email: {
        type: ["string", "null"],
        title: "Your email address",
        format: "email"
      },
      password: {
        type: ["string", "null"],
        title: "Your password",
        minLength: 8
      },
      custom_fields: useFieldsSchemaParser(data)
    }
  };

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
      },
      useFieldsUischemaParser(data)
    ]
  };

  return schema;
};

export const useRegisterModelParser = (data: any) => {
  const model = {
    firstname: null,
    lastname: null,
    email: null,
    password: null,
    custom_fields: useFieldsModelParser(data)
  };

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
        type: ["string", "null"],
        format: "email",
        title: "Your email address"
      },
      password: {
        type: ["string", "null"],
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
        type: ["string", "null"],
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
