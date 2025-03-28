// --- external

import { createAjv, type JsonSchema } from "@jsonforms/core";
import {
  isValidPhoneNumber,
  type CountryCode,
  type PhoneNumber,
} from "libphonenumber-js";
import ajvErrors from "ajv-errors";

// --- utils
import { forEach, reduce, get, set, defaultsDeep, trimStart } from "lodash-es";

// --- types

// ---
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

export const useValidationParser = (error: any) => {
  if (error?.data) {
    error.message = "Validation error";

    const errors: any[] = [];
    forEach(error.data, (value, key) => {
      // because we have a specific schema for provision_fields, we dont need the prefix of the path
      // we also need to handle any nested properties correctly, JSON schema would have them withing properties

      const instancePath = trimStart(
        key.replace("provision_field_values.", "").replace(".", "/properties/"),
        "/"
      );

      const newError = {
        instancePath: `/${instancePath}`, // AJV style path to the property in the schema
        message: value.toString(),
        // --- optional
        schemaPath: instancePath,
        keyword: "",
        params: {},
      };

      errors.push(newError);
    });

    error.data = errors;
  }
  return error;
};

export const useModelParser = <T extends object = object>(
  schema: JsonSchema | undefined,
  values: T,
  baseModel?: T,
  {
    allowExtraProps,
  }: {
    allowExtraProps?: boolean;
  } = { allowExtraProps: true }
) => {
  if (!schema?.properties) return values;

  const model = reduce(
    schema.properties,
    (result, field, key) => {
      const value =
        field?.const || get(values, key, field?.default || get(baseModel, key));
      set(result, key, value);
      return result;
    },
    {}
  );
  if (!allowExtraProps) model as T;

  return defaultsDeep(model, values) as T;
};
