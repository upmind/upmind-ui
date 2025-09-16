// --- external
import { createAjv, type JsonSchema } from "@jsonforms/core";
import Ajv from "ajv";

import localize from "ajv-i18n";
import ajvErrors from "ajv-errors";

// --- internal

// --- utils

// --- types
import type { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

export const useValidation = (ajv?: Ajv, currentLocale = "en") => {
  // use JSON Forms version of AJV as it has formats and other keywords already

  const initial = !ajv;
  const ajvInstance =
    ajv ??
    createAjv({
      useDefaults: true,
      verbose: false,
      allErrors: true
    });

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
        localize[currentLocale as keyof typeof localize](validate.errors);
        return validate.errors ?? [];
      }
      return [];
    }
  };
};
