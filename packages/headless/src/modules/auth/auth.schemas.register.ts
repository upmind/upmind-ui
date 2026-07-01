/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module auth/schemas.register
 * @description Registration form schemas.
 * Used for new client registration with custom fields from brand config.
 */

import { BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useSystem } from "../system";
import { useFieldsSchemaParser, useFieldsUischemaParser } from "../../utils";
import { get } from "lodash-es";
import type { CustomField } from "../client-custom-fields";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
/**
 * JSON Schema for the registration form.
 * Includes custom fields from brand configuration.
 */
export const useRegisterSchema = (customFields?: CustomField[]): JsonSchema => {
  const { getConfig } = useBrand();
  const { getCountry } = useSystem();

  const phoneRequired = get(
    getConfig(BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION),
    BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION
  );

  const required = ["firstname", "lastname", "username", "password"];
  if (phoneRequired) {
    required.push("phone");
  }

  const countryCode = getCountry()?.code || "";

  return {
    type: "object",
    title: "Register",
    required,
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
        properties: {
          number: {
            type: ["string", "null"],
            title: "Phone number ( with dialing code )"
          },
          country: {
            type: ["string", "null"],
            title: "Country",
            default: countryCode
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
      customFields: useFieldsSchemaParser(customFields)
    }
  };
};

/**
 * UI Schema for the registration form.
 */
export const useRegisterUischema = (
  customFields?: CustomField[]
): UISchemaElement => {
  const { getConfig } = useBrand();
  const phoneRequired: boolean = get(
    getConfig(BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION),
    BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION
  );

  const elements: unknown[] = [
    {
      // HorizontalLayout stacks on mobile, sits on one row from md up.
      type: "HorizontalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/firstname",
          i18n: "form.firstname",
          options: {
            autoFocus: true,
            autocomplete: "given-name",
            placeholder: "Jay, Jane, John, ..."
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
        }
      ]
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
    }
  ];

  if (phoneRequired) {
    elements.push({
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
    });
  }

  elements.push(...useFieldsUischemaParser(customFields));

  return {
    type: "VerticalLayout",
    elements
  } as UISchemaElement;
};
