// --- external
import { createAjv, type JsonSchema } from "@jsonforms/core";
import ajvErrors from "ajv-errors";
import type Ajv from "ajv";
// --- internal
// --- utils
// --- types
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------

export const useValidation = (ajv?: Ajv) => {
  // use JSON Forms version of AJV as it has formats and other keywords already

  const initial = !ajv;
  const ajvInstance = ajv ?? createAjv({ useDefaults: true, verbose: false });

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
      const validate = ajvInstance.compile(schema);
      const valid = validate(data);
      if (!valid) {
        return validate.errors ?? [];
      }
      return [];
    }
  };
};
