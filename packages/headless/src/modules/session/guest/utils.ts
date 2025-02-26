// --- utils
export { useValidationParser } from "../../../utils";
import {
  useFieldsSchemaParser,
  useFieldsUischemaParser,
  useFieldsModelParser,
} from "../../../utils";

import type { AuthModel } from "./types";
// -----------------------------------------------------------------------------

export const useRegisterSchemaParser = (data: any) => {
  const schema = {
    type: "object",
    title: "Register",
    required: ["firstname", "lastname", "username", "password"],
    properties: {
      firstname: {
        type: "string",
        title: "Your first name",
      },
      lastname: {
        type: "string",
        title: "Your last name",
      },
      username: {
        type: "string",
        title: "Your email address",
        format: "email",
      },
      password: {
        type: "string",
        title: "Your password",
        minLength: 8,
        format: "password",
      },
      customFields: useFieldsSchemaParser(data, "auth"),
    },
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
        i18n: "auth.register.firstname",
        options: {
          autoFocus: true,
          autocomplete: "given-name",
          placeholder: "Jay,Jane,John,... ",
        },
      },
      {
        type: "Control",
        scope: "#/properties/lastname",
        i18n: "auth.register.lastname",
        options: {
          autocomplete: "family-name",
          placeholder: "Doe, Smith, ...",
        },
      },
      {
        type: "Control",
        scope: "#/properties/username",
        i18n: "auth.register.email",
        options: {
          type: "email",
          format: "email",
          autocomplete: "email",
          placeholder: "name@email.com",
        },
      },
      {
        type: "Control",
        scope: "#/properties/password",
        i18n: "auth.register.password",
        options: {
          type: "password",
          autocomplete: "current-password",
          placeholder: "Use a strong password or passphrase",
        },
      },
      ...useFieldsUischemaParser(data),
    ],
  };

  return schema;
};

export const useRegisterModelParser = (data: any): AuthModel => {
  const model: AuthModel = {
    firstname: undefined,
    lastname: undefined,
    username: undefined,
    password: undefined,
    customFields: useFieldsModelParser(data),
  };

  return model;
};
// ---

export const useLoginSchemaParser = () => {
  return {
    type: "object",
    title: "Login",
    required: ["username", "password"],
    properties: {
      username: {
        type: "string",
        title: "Your username or email address",
        // format: "email", // DEPRECATED as we can log in with email OR username
      },
      password: {
        type: "string",
        format: "password",
        title: "Your password",
      },
    },
  };
};

export const useLoginUischemaParser = () => {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/username",
        i18n: "auth.login.email",
        options: {
          autoFocus: true,
          autocomplete: "email",
          placeholder: "name@email.com",
        },
      },
      {
        type: "Control",
        scope: "#/properties/password",
        i18n: "auth.login.password",
        options: {
          autocomplete: "current-password",
          placeholder: "password or passphrase",
        },
      },
    ],
  };
};

export const useLoginModelParser = () => {
  return {
    username: undefined,
    password: undefined,
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
        title: "Your 2fa code",
      },
    },
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
          placeholder: "123 456",
          // mask: "### ###"
        },
      },
    ],
  };
};

export const use2faModelParser = () => {
  return {
    token: undefined,
  };
};
