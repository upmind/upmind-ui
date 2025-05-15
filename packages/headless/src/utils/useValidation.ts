// --- external

import { createAjv, type JsonSchema } from "@jsonforms/core";
import {
  isValidPhoneNumber,
  type CountryCode,
  type PhoneNumber,
} from "libphonenumber-js";
import ajvErrors from "ajv-errors";

// --- utils
import {
  reduce,
  get,
  set,
  defaultsDeep,
  compact,
  map,
  isString,
  isObject,
} from "lodash-es";
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

  ajv.addFormat("address", {
    type: "string",
    validate: (x: string) => !!x,
  });

  ajv.addKeyword({
    keyword: "isPhoneNumber",
    type: ["string", "object"],
    schemaType: "string",
    validate: (schema: CountryCode, data: string | PhoneNumber) => {
      if (isString(data) && data.includes("+")) {
        return isValidPhoneNumber(data);
      } else if (isObject(data)) {
        const value = data?.number || data?.nationalNumber || "";
        const country = data?.country || schema;
        return isValidPhoneNumber(value, country);
      }
      return false;
    },
    error: {
      message: () => "Invalid phone number format",
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

export const useModelParser = <
  T extends Record<string, any> = Record<string, any>,
>(
  schema: JsonSchema | undefined,
  values?: Partial<T>,
  baseModel?: Partial<T>,
  {
    allowExtraProps,
  }: {
    allowExtraProps?: boolean;
  } = { allowExtraProps: true }
): T => {
  if (!schema?.properties) return (values ?? baseModel ?? {}) as T;

  const model = reduce(
    schema.properties,
    (result, field, key) => {
      const value =
        field?.const || get(values, key, field?.default || get(baseModel, key));
      set(result, key, value);
      return result;
    },
    {} as Record<string, any>
  );
  if (!allowExtraProps) return model as T;

  return defaultsDeep(model, values) as T;
};
