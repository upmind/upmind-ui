// --- external
import { createAjv } from "@jsonforms/core";

import ajvErrors from "ajv-errors";
import addFormats from "ajv-formats";

// --- internal

// --- utils
import {
  compact,
  concat,
  defaultsDeep,
  every,
  forEach,
  get,
  has,
  isArray,
  isEmpty,
  isNil,
  map,
  omitBy,
  reduce,
  replace,
  set,
  trimEnd,
  trimStart,
} from "lodash-es";
import { parseError } from "./useError";
import Ajv, { type ErrorObject } from "ajv";

// --- types

// -----------------------------------------------------------------------------

export const useValidationParser = (error: any): ErrorObject[] => {
  if (error?.data) {
    error.message = "Validation error";
    error.data = compact(
      reduce(
        error?.data,
        (result: ErrorObject[], value, key) => {
          const parsed = parseError(value, key);
          return concat(result, parsed);
        },
        []
      )
    );
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

// -----------------------------------------------------------------------------

export const useValidation = (ajv?: Ajv) => {
  // use JSON Forms version of AJV as it has formats and other keywords already

  const initial = !ajv;
  const ajvInstance =
    ajv ?? createAjv({ useDefaults: true, allErrors: true, verbose: false });

  if (initial) {
    ajvErrors(ajvInstance, {
      keepErrors: false,
      singleError: false,
    });

    addFormats(ajvInstance, {});
  }

  return {
    ajv: ajvInstance,
    validate: (schema: any, data: any) => {
      const validate = ajvInstance.compile(schema);
      const valid = validate(data);
      if (!valid) {
        return validate.errors;
      }
      return [];
    },
  };
};
