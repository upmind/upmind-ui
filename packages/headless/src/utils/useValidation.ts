// --- external

import { createAjv } from "@jsonforms/core";
import {
  isValidPhoneNumber,
  type CountryCode,
  type PhoneNumber,
} from "libphonenumber-js";
import ajvErrors from "ajv-errors";

// --- utils
import { reduce, get, set, defaultsDeep, compact, map } from "lodash-es";
import { parseError } from "./useError";
import { ErrorObject } from "ajv";

// --- types

// -----------------------------------------------------------------------------

export const useValidation = (ajv?: any) => {
  // us JSON Forms version of AJV as it has formats and other keywords already
  ajv ??= createAjv({ useDefaults: true, allErrors: true });
  ajvErrors(ajv, { singleError: true });

  // "string"
  // "required"
  // "alpha-dash"
  // "regex:/^[^\\_]+$/"

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
      message: () => "invalid phone number format", // return `must be a valid ${cxt.schema} phone number`;
    },
  });

  return {
    ajv,
    validate: (schema: any, data: any) => {
      const validate = ajv.compile(schema);
      const valid = validate(data);
      if (!valid) {
        return validate.errors;
      }
      return [];
    },
  };
};

export const useValidationParser = (error: any): ErrorObject[] => {
  if (error?.data) {
    error.message = "Validation error";
    error.data = compact(map(error.data, parseError));
  }
  return error;
};

export const useModelParser = (schema: any, values: any) => {
  const model = reduce(
    schema?.properties,
    (result, field, key) => {
      const value = field?.const || get(values, key, field?.default);
      set(result, key, value);
      return result;
    },
    {}
  );
  return defaultsDeep(model, values);
};
