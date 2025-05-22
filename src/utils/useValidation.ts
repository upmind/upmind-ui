// --- external
import { createAjv, type JsonSchema } from "@jsonforms/core";
import Ajv from "ajv";

import ajvErrors from "ajv-errors";

// --- internal

// --- utils
import { compact, concat, defaultsDeep, get, reduce, set } from "lodash-es";
import { parseError } from "./useError";

// --- types
import type { ErrorObject } from "ajv";

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

export const useModelParser = (schema: JsonSchema, values: any) => {
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
  const ajvInstance = ajv ?? createAjv({ useDefaults: true, verbose: false });

  if (initial) {
    ajvErrors(ajvInstance, {
      keepErrors: false,
      singleError: true,
    });
  }

  return {
    ajv: ajvInstance,
    validate: (
      schema: JsonSchema,
      data: Record<string, any>
    ): ErrorObject[] => {
      const validate = ajvInstance.compile(schema);
      const valid = validate(data);
      if (!valid) {
        return validate.errors ?? [];
      }
      return [];
    },
  };
};
