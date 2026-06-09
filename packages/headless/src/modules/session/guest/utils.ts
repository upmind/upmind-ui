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
import { BrandConfigKeys, TwofaProviders } from "@upmind-automation/types";

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
        format: "password",
        minLength: 8,
        // Lookaheads require: at least one letter, at least one digit, at least
        // one non-alphanumeric. Mirrors the rule set used by the strength meter
        // and the `auth_password.error.*` i18n keys — keep these in lockstep.
        pattern: "(?=.*[a-zA-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9])"
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
      customFields: useFieldsSchemaParser(data)
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
        i18n: "form.firstname",
        options: {
          autoFocus: true,
          autocomplete: "given-name",
          placeholder: "Jay,Jane,John,... "
        }
      },
      {
        type: "Control",
        scope: "#/properties/lastname",
        i18n: "form.lastname",
        options: {
          autocomplete: "family-name",
          placeholder: "Doe, Smith, ..."
        }
      },
      {
        type: "Control",
        scope: "#/properties/username",
        i18n: "form.auth_email",
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
        i18n: "form.auth_password",
        options: {
          type: "password",
          autocomplete: "new-password",
          placeholder: "Use a strong password or passphrase",
          // Per-rule regexes the password renderer tests against to resolve
          // which rule failed — unmet keys map to `auth_password.error.*`
          // (e.g. `letter` unmet → `missing_letter`, `min_length` unmet →
          // `min_length_<other-unmet>`). Keep these rules, the schema
          // `pattern` above, and the `error` i18n keys in lockstep.
          requirements: {
            min_length: ".{8,}",
            letter: "(?=.*[a-zA-Z])",
            number: "(?=.*\\d)",
            symbol: "(?=.*[^a-zA-Z0-9])"
          }
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
        title: "Your email"
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
        i18n: "form.auth_login",
        options: {
          autoFocus: true,
          autocomplete: "username",
          placeholder: "name@email.com"
        }
      },
      {
        type: "Control",
        scope: "#/properties/password",
        i18n: "form.auth_password",
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
        type: "string",
        pattern: "\\d{6}",
        title: "Two-factor authentication"
      }
    },
    errorMessage: {
      properties: {
        token: "Please enter a valid 6-digit code."
      }
    }
  };
};

// Per-provider 2FA UI defaults.
const TWOFA_PROVIDER_OPTIONS = {
  [TwofaProviders.EMAIL]: {
    i18n: "form.twofa_email",
    autocomplete: "off"
  },
  [TwofaProviders.TOTP]: {
    i18n: "form.twofa_totp",
    autocomplete: "one-time-code"
  }
} as const;

const TWOFA_DEFAULT_OPTIONS = {
  i18n: "form.twofa",
  autocomplete: "off"
} as const;

export const use2faUischemaParser = (provider?: TwofaProviders) => {
  const { i18n, ...controlOptions } =
    (provider && TWOFA_PROVIDER_OPTIONS[provider]) ?? TWOFA_DEFAULT_OPTIONS;

  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/token",
        i18n,
        options: {
          format: "otp",
          autoFocus: true,
          ...controlOptions
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
        title: "Your email"
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
        i18n: "form.auth_login",
        options: {
          autoFocus: true,
          autocomplete: "username",
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
