// --- external

import { createAjv } from "@jsonforms/core";
import { isValidPhoneNumber } from "libphonenumber-js";
import ajvErrors from "ajv-errors";

// --- utils

// --- types
import type { Ajv } from "ajv";
import type { JsonSchema } from "@jsonforms/core";
import { type CountryCode, type PhoneNumber } from "libphonenumber-js";
// --------------------------------------------------------

export const useValidation = (ajv?: Ajv) => {
  // us JSON Forms version of AJV as it has formats and other keywords already
  ajv ??= createAjv({ useDefaults: true, allErrors: true });
  ajvErrors(ajv, { singleError: true });

  ajv.addFormat(
    "domain_name",
    // /^(((?!-))(xn--|_)?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9][a-z0-9\-]{0,60}|[a-z0-9-]{1,30}\.[a-z]{2,})$/
    /^(?!-)[A-Za-z0-9-]+([-.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$/
  );

  ajv.addKeyword({
    keyword: "isPhoneNumber",
    type: ["string", "object"],
    schemaType: "string",
    validate: (schema: CountryCode, data: PhoneNumber) => {
      const value = data?.number || data?.nationalNumber || "";
      const country = data?.country || schema;
      return isValidPhoneNumber(value, country);
    },
    error: {
      message: cxt => "invalid phone number format", // return `must be a valid ${cxt.schema} phone number`;
    },
  });

  return {
    ajv,
    validate: (schema, data) => {
      const validate = ajv.compile(schema);
      const valid = validate(data);
      if (!valid) {
        return validate.errors;
      }
      return [];
    },
  } as {
    ajv: Ajv;
    validate: (schema: JsonSchema, data: object) => Object[];
  };
};
