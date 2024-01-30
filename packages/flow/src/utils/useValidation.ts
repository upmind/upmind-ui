// --- external
import { createAjv } from "@jsonforms/core";
import { isValidPhoneNumber } from "libphonenumber-js";
import ajvErrors from "ajv-errors";
// --- utils
import { forEach, isString } from "lodash-es";

// --------------------------------------------------------

export const useValidation = () => {
  // us JSON Forms version of AJV as it has formats and other keywords already
  const ajv = createAjv({ useDefaults: true, allErrors: true });
  ajvErrors(ajv, { singleError: true });

  ajv.addFormat(
    "domain_name",
    // /^(((?!-))(xn--|_)?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9][a-z0-9\-]{0,60}|[a-z0-9-]{1,30}\.[a-z]{2,})$/
    /^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$/
  );

  ajv.addKeyword({
    keyword: "isPhoneNumber",
    type: ["string", "object"],
    schemaType: "string",
    validate: (schema, data) => {
      const value = data?.number || data?.nationalNumber || "";
      const country = data?.country || schema;
      return isValidPhoneNumber(value, country);
    },
    error: {
      message: cxt => `must be a valid ${cxt.schema} phone number`
    }
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
    }
  };
};

export const useValidationParser = (error: any) => {
  if (error?.data) {
    error.message = "Validation error";

    const errors = [];
    forEach(error.data, (value, key) => {
      const newError = {
        instancePath: `/${key}`, // AJV style path to the property in the schema
        message: value.toString(),
        // --- optional
        schemaPath: "",
        keyword: "",
        params: {}
      };
      errors.push(newError);
    });

    error.data = errors;
  }

  return error;
};
