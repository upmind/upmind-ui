// --- internal
import { useBrand } from "../../brand";
import { useSystem } from "../../system";

// --- utils
import {
  useFieldsModelParser,
  useFieldsSchemaParser,
  useFieldsUischemaParser
} from "../../../utils";
import { get, remove } from "lodash-es";

// --- types
import type {
  LoginModel,
  GuestContext,
  RecoverModel,
  RegisterModel,
  TWOFAModel
} from "./types";
import { BrandConfigKeys } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export const useRegisterSchemaParser = (data: any) => {
  const { getConfig } = useBrand();
  const { getCountry } = useSystem();

  const phoneRequired = get(
    getConfig(BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION),
    BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION
  );

  const schema = {
    type: "object",
    title: "Register",
    required: ["firstname", "lastname", "username", "password"],
    properties: {
      firstname: {
        type: "string",
        title: "Your first name"
      },
      lastname: {
        type: "string",
        title: "Your last name"
      },
      username: {
        type: "string",
        title: "Your email address",
        format: "email"
      },
      password: {
        type: "string",
        title: "Your password",
        minLength: 8,
        format: "password"
      },
      phone: {
        type: ["object", "null"],
        title: "Phone",
        phone_country_code: getCountry()?.code,
        properties: {
          number: {
            type: ["string", "null"],
            title: "Phone number ( with dialing code )"
          },
          country: {
            type: ["string", "null"],
            title: "Country",
            default: getCountry()?.code || ""
          },
          nationalNumber: {
            type: ["string", "null"],
            title: "Phone number"
          },
          countryCallingCode: {
            type: ["string", "null"],
            title: "Country calling code"
          }
        }
      },
      customFields: useFieldsSchemaParser(data, "auth")
    }
  };

  if (phoneRequired) {
    schema.required.push("phone");
  }

  return schema;
};

export const useRegisterUischemaParser = (data: any) => {
  const { getConfig } = useBrand();
  const phoneRequired: boolean = get(
    getConfig(BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION),
    BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION
  );

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
          placeholder: "Jay,Jane,John,... "
        }
      },
      {
        type: "Control",
        scope: "#/properties/lastname",
        i18n: "auth.register.lastname",
        options: {
          autocomplete: "family-name",
          placeholder: "Doe, Smith, ..."
        }
      },
      {
        type: "Control",
        scope: "#/properties/username",
        i18n: "auth.register.email",
        options: {
          type: "email",
          format: "email",
          autocomplete: "email",
          placeholder: "name@email.com"
        }
      },
      {
        type: "Control",
        scope: "#/properties/password",
        i18n: "auth.register.password",
        options: {
          type: "password",
          autocomplete: "current-password",
          placeholder: "Use a strong password or passphrase"
        }
      },
      {
        type: "Control",
        scope: "#/properties/phone",
        i18n: "client.unified.form.fields.phone",
        options: {
          autocomplete: "tel",
          suggestions: true,
          itemLabel: "number",
          itemValue: "number",
          align: "start",
          side: "bottom"
        }
      },
      ...useFieldsUischemaParser(data)
    ]
  };

  if (!phoneRequired) {
    remove(schema.elements, ["scope", "#/properties/phone"]);
  }

  return schema;
};

export const useRegisterModelParser = (
  model: RegisterModel,
  customfields: GuestContext["customFields"]
): RegisterModel => {
  return {
    firstname: model?.firstname,
    lastname: model?.lastname,
    username: model?.username,
    password: model?.password,
    phone: model?.phone,
    customFields: useFieldsModelParser(customfields)
  };
};

export const useLoginSchemaParser = () => {
  return {
    type: "object",
    title: "Log in",
    required: ["username", "password"],
    properties: {
      username: {
        type: "string",
        title: "Your username or email address"
        // format: "email", // DEPRECATED as we can log in with email OR username
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
        scope: "#/properties/username",
        i18n: "auth.login.email",
        options: {
          autoFocus: true,
          autocomplete: "email",
          placeholder: "name@email.com"
        }
      },
      {
        type: "Control",
        scope: "#/properties/password",
        i18n: "auth.login.password",
        options: {
          autocomplete: "current-password",
          placeholder: "password or passphrase"
        }
      }
    ]
  };
};

export const useLoginModelParser = (model: LoginModel): LoginModel => {
  return {
    username: model?.username,
    password: model?.password
  };
};

export const use2faSchemaParser = () => {
  return {
    type: "object",
    title: "Verify 2FA",
    required: ["token"],
    properties: {
      token: {
        type: ["string", "null"],
        pattern: "\\d{6}",
        title:
          "This account is secured using two-factor authentication. Please enter the code generated by your Authenticator app."
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
          autoFocus: true,
          autocomplete: "off",
          placeholder: "123 456"
          // mask: "### ###"
        }
      }
    ]
  };
};

export const use2faModelParser = (model: TWOFAModel): TWOFAModel => {
  return {
    token: model?.token
  };
};

export const useRecoverSchemaParser = () => {
  return {
    type: "object",
    title: "Send reset",
    required: ["username"],
    properties: {
      username: {
        type: "string",
        title: "Your username or email address"
      }
    }
  };
};

export const useRecoverUischemaParser = () => {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/username",
        i18n: "auth.recover.email",
        options: {
          autoFocus: true,
          autocomplete: "email",
          placeholder: "name@email.com"
        }
      }
    ]
  };
};

export const useRecoverModelParser = (model: RecoverModel): RecoverModel => {
  return {
    username: model?.username
  };
};
