// --- external

import { createAjv } from "@jsonforms/core";
import {
  isValidPhoneNumber,
  type CountryCode,
  type PhoneNumber,
} from "libphonenumber-js";
import ajvErrors from "ajv-errors";

// --- utils

// --- types

// --------------------------------------------------------

export const useValidation = () => {
  // us JSON Forms version of AJV as it has formats and other keywords already
  const ajv = createAjv({ useDefaults: true, allErrors: true });
  ajvErrors(ajv, { singleError: true });

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
      message: cxt => "invalid phone number format",
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
  };
};
