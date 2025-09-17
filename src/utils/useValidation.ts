// --- external
import Ajv from "ajv";
import ajvErrors from "ajv-errors";
import { createAjv, type JsonSchema } from "@jsonforms/core";

// --- internal

// --- utils
import { isFunction } from "lodash-es";

// --- types
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------

export const useValidation = (
  ajv?: Ajv,
  validate?: (schema: JsonSchema, data: Record<string, any>) => ErrorObject[]
) => {
  // use JSON Forms version of AJV as it has formats and other keywords already

  const initial = !ajv;
  const ajvInstance = ajv ?? createAjv({ useDefaults: true, verbose: false });
  const validationOverride = validate;

  if (initial) {
    ajvErrors(ajvInstance, {
      keepErrors: false,
      singleError: true
    });
  }

  return {
    ajv: ajvInstance,
    validate: (
      schema: JsonSchema,
      data: Record<string, any>
    ): ErrorObject[] => {
      if (isFunction(validationOverride))
        return validationOverride(schema, data);

      const validator = ajvInstance.compile(schema);
      const valid = validator(data);
      if (!valid) {
        return validator.errors ?? [];
      }
      return [];
    }
  };
};
