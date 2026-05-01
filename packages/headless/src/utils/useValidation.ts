// --- external

import { createAjv } from "@jsonforms/core";
import ajvErrors from "ajv-errors";

// --- internal
import * as formats from "./useValidationFormats";
import * as keywords from "./useValidationKeywords";

// --- utils
import {
  compact,
  concat,
  defaultsDeep,
  every,
  forEach,
  get,
  has,
  includes,
  isArray,
  isEmpty,
  isNil,
  isObject,
  isString,
  map,
  omitBy,
  reduce,
  replace,
  set,
  toNumber,
  trimEnd,
  trimStart
} from "lodash-es";
import { parseError, type ResponseError } from "./useError";
import { compactDeep } from "./isDeepEmpty";
import Ajv, { type ErrorObject } from "ajv";

// --- types
import type { JsonSchema7, JsonSchema } from "@jsonforms/core";
import { useI18n } from "../modules/system";

// Allows: example.com, foo.bar.example.solutions
// Disallows: -foo.com, foo-.com, foo..com, foo.com-
// Notes: ASCII only; allows punycode/ no IDN.
export const DOMAIN_LIKE_VALIDATION =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i;

let ajvInstance: Ajv;
// -----------------------------------------------------------------------------

type JsonSchemaExtended = JsonSchema7 & Record<string, any>;
type GenericFieldWithValidation = {
  name: string;
  field_label: string;
  description?: string;
  default_value?: string | number | boolean;
  validation_rules: string[];
  semantic_type?: string;
  options?: { label: string; value: string }[];
} & Record<string, any>;

function parsePcrePattern(pcrePattern: string): string {
  let jsPattern = pcrePattern;

  // 1. Remove delimiters (if present) - Using Lodash
  jsPattern = trimStart(jsPattern, "/");
  jsPattern = trimEnd(jsPattern, "/");

  // 2. Handle common PCRE escape sequences that might be problematic in JS - Using Lodash
  jsPattern = replace(jsPattern, /\\Q/g, "\\\\Q");
  jsPattern = replace(jsPattern, /\\E/g, "\\\\E");
  jsPattern = replace(jsPattern, /\\G/g, "^");
  jsPattern = replace(jsPattern, /\\K/g, "");

  // 3. Handle backslash escaping for underscore
  jsPattern = replace(jsPattern, /\\_/g, "_");

  return jsPattern;
}

function mapLaravelRuleToJSONSchema(
  rule: string,
  field: GenericFieldWithValidation,
  context: Record<string, any> = {}
): JsonSchemaExtended {
  // 1. Basic Type Rules
  if (rule === "string") {
    return { type: "string" };
  } else if (rule === "integer") {
    return { type: "integer" };
  } else if (rule === "numeric") {
    return { type: "number" };
  } else if (rule === "boolean") {
    return { type: "boolean" };
  } else if (rule === "array") {
    return { type: "array" };
  } else if (rule === "required") {
    return {}; // Handled at the schema root
  } else if (rule === "nullable") {
    return { nullable: true }; // Use the standard nullable property
  }
  // 2. Standard Formats
  else if (rule === "email") {
    return { format: "email" };
  } else if (rule === "url") {
    return { format: "url" };
  } else if (rule === "ip") {
    return { format: "ipv4" }; // Or ipv6
  } else if (rule === "ipv4") {
    return { format: "ipv4" };
  } else if (rule === "ipv6") {
    return { format: "ipv6" };
  } else if (rule === "date") {
    return { format: "date" };
  } else if (rule === "uuid") {
    return { format: "uuid" };
  }
  // // Custom Upmind formats
  else if (rule == "international_phone") {
    return {
      type: "string",
      format: "phone",
      phone_country_code: context?.defaultCountry?.code ?? ""
    };
  } else if (rule == "domain_name" || rule == "domain-name") {
    return {
      type: "string",
      format: "domain_name",
      trim: true
    };
  } else if (rule === "alpha") {
    return {
      type: "string",
      format: "alpha"
    };
  } else if (rule === "alpha-dash") {
    return {
      type: "string",
      format: "alpha-dash"
    };
  } else if (rule === "alpha-num") {
    return {
      type: "string",
      format: "alpha-num"
    };
  } else if (rule === "alpha-dash-dot") {
    return {
      type: "string",
      format: "alpha-dash-dot"
      // errorMessage: {
      //   format: "may only contain letters, dots and dashes"
      // }
    };
  }

  // 3. Custom Formats (Patterns and Enums)
  else if (rule.startsWith("regex:")) {
    const regex = rule.substring(6);
    const pattern = parsePcrePattern(regex);
    return { pattern };
  } else if (rule.startsWith("in:")) {
    if (
      isArray(field?.options) &&
      !isEmpty(field?.options) &&
      every(
        field?.options,
        option => has(option, "label") && has(option, "value")
      )
    ) {
      const enums: (string | null)[] = map(
        field?.options,
        ({ value }) => value
      );
      if (!includes(field?.validation_rules, "required")) enums.push(null);

      return {
        enum: enums,
        options: map(field?.options, ({ label, value }) => ({ label, value }))
      };
    } else {
      const enums: (string | null)[] = rule.substring(3).split(",");
      if (!includes(field?.validation_rules, "required")) enums.push(null);
      return { enum: enums };
    }
  } else if (rule.startsWith("not_in:")) {
    const values = rule.substring(7).split(",");
    return { not: { enum: values } };
  }

  // 4. Min/Max Ranges
  else if (rule.startsWith("min:")) {
    const value = parseInt(rule.substring(4), 10);
    const baseType = ["array", "string"].includes(rule)
      ? "minLength"
      : "minimum";
    return { [baseType]: value };
  } else if (rule.startsWith("max:")) {
    const value = parseInt(rule.substring(4), 10);
    const baseType = ["array", "string"].includes(rule)
      ? "maxLength"
      : "maximum";
    return { [baseType]: value };
  } else if (rule.startsWith("size:")) {
    const value = parseInt(rule.substring(5), 10);
    const baseType = ["array", "string"].includes(rule)
      ? "const"
      : "multipleOf";
    return { [baseType]: value };
  } else if (rule.startsWith("min_digits:")) {
    const value = parseInt(rule.substring(11), 10);
    return {
      type: "number",
      exclusiveMinimum: Math.pow(10, value - 1)
    };
  } else if (rule.startsWith("max_digits:")) {
    const value = parseInt(rule.substring(11), 10);
    return {
      type: "number",
      maximum: Math.pow(10, value) - 1
    };
  } else if (rule.startsWith("digits:")) {
    const value = parseInt(rule.substring(7), 10);
    return {
      type: "number",
      exclusiveMinimum: Math.pow(10, value - 1),
      maximum: Math.pow(10, value) - 1
    };
  } else if (rule.startsWith("digits_between:")) {
    const [min, max] = rule.substring(15).split(",").map(Number);
    return {
      type: "number",
      exclusiveMinimum: Math.pow(10, min - 1),
      maximum: Math.pow(10, max) - 1
    };
  } else if (rule.startsWith("lt:")) {
    const value = parseFloat(rule.substring(3));
    return { exclusiveMaximum: value };
  } else if (rule.startsWith("lte:")) {
    const value = parseFloat(rule.substring(4));
    return { maximum: value };
  } else if (rule.startsWith("gt:")) {
    const value = parseFloat(rule.substring(3));
    return { exclusiveMinimum: value };
  } else if (rule.startsWith("gte:")) {
    const value = parseFloat(rule.substring(4));
    return { minimum: value };
  } else if (rule.startsWith("before:")) {
    const date = rule.substring(7);
    return {
      format: "date",
      formatMaximum: date
    };
  } else if (rule.startsWith("after:")) {
    const date = rule.substring(6);
    return {
      format: "date",
      formatMinimum: date
    };
  } else if (rule.startsWith("before_or_equal:")) {
    const date = rule.substring(16);
    return {
      format: "date",
      formatMaximum: date
    };
  } else if (rule.startsWith("after_or_equal:")) {
    const date = rule.substring(15);
    return {
      format: "date",
      formatMinimum: date
    };
  }

  // 5. Conditional Keywords :- they are handled separately
  else if (rule.startsWith("required_if:")) {
    const [otherField, expectedValue] = rule.substring(12).split(",");
    return {
      required_if: {
        field: otherField,
        value: expectedValue
      }
    };
  } else if (rule.startsWith("required_unless:")) {
    const [otherField, expectedValue] = rule.substring(16).split(",");
    return {
      required_unless: {
        field: otherField,
        value: expectedValue
      }
    };
  } else if (rule.startsWith("required_with:")) {
    const otherField = rule.substring(14);
    return {
      required_with: otherField
    };
  } else if (rule.startsWith("required_without:")) {
    const otherField = rule.substring(17);
    return {
      required_without: otherField
    };
  } else if (rule === "same:") {
    const otherProperty = rule.substring(5);
    return {
      same: otherProperty
    };
  } else if (rule === "different:") {
    const otherProperty = rule.substring(9);
    return {
      different: otherProperty
    };
  }
  // 6. Default
  // For any rule we haven't explicitly mapped, we'll return it as a custom keyword
  return {
    type: "string", // Default to string type for unknown rules
    [rule]: true
  };
}

function mapLaravelRulesToJsonSchemaProperty(
  field: GenericFieldWithValidation,
  context: Record<string, any> = {}
): JsonSchemaExtended {
  let schemaProperty: JsonSchemaExtended = {};
  forEach(field?.validation_rules, rule => {
    const keywordMap = mapLaravelRuleToJSONSchema(rule, field, context);
    keywordMap.type ??= "string"; // Failsafe: default type to string if not already specified

    // merge each rule into the schemaProperty
    schemaProperty = { ...schemaProperty, ...keywordMap } as JsonSchemaExtended;
  });

  // Handle nullable carefully
  if (schemaProperty.nullable) {
    if (schemaProperty.type === "string") {
      schemaProperty.type = ["string", "null"];
    } else if (!schemaProperty.type) {
      schemaProperty.type = "null";
    } else if (
      isArray(schemaProperty.type) &&
      !schemaProperty.type.includes("null")
    ) {
      schemaProperty.type.push("null");
    } else if (
      typeof schemaProperty.type === "string" &&
      schemaProperty.type !== "null"
    ) {
      schemaProperty.type = [schemaProperty.type, "null"];
    }
  }

  if (field?.semantic_type) {
    schemaProperty.semantic_type = field.semantic_type;
  }

  return schemaProperty;
}

export function useLaravalSchemaParser(
  fields: GenericFieldWithValidation[],
  context: Record<string, any> = {}
): JsonSchema7 {
  const properties: JsonSchema7["properties"] = {};
  const requiredFields: JsonSchema7["required"] = [];

  forEach(fields, field => {
    if (isEmpty(field)) return;
    if (!field?.deferrable || field?.defer_mode != "hidden") {
      const schema = {
        title: field.field_label,
        description: field.description,
        default: field?.default_value,
        ...mapLaravelRulesToJsonSchemaProperty(field, context) // Map the rules
      };

      // Handle 'required'
      if (includes(field?.validation_rules, "required")) {
        requiredFields.push(field.name);
      }

      set(properties, field.name, omitBy(schema, isNil));
    }
  });

  return omitBy(
    {
      type: "object",
      properties,
      required: requiredFields
    },
    isEmpty
  ) as JsonSchema7;
}

function isErrorObject(error: any): error is ErrorObject {
  if (isArray(error)) return every(error, isErrorObject);

  return (
    error && isObject(error) && "instancePath" in error && "schemaPath" in error
  );
}

export const useValidationParser = (error: ResponseError): ErrorObject[] => {
  //NB we may be given an error that is already an ErrorObject[] or a single ErrorObject
  if (isErrorObject(error.data))
    return isArray(error.data) ? error.data : ([error.data] as ErrorObject[]);

  return compact(
    reduce(
      error?.data,
      (result: ErrorObject[], value, key) => {
        const parsed = parseError(value, key);
        return concat(result, parsed);
      },
      []
    )
  );
};

export const useModelParser = <
  TModel extends Record<string, any> = Record<string, any>,
  TBaseModel = TModel
>(
  schema: JsonSchema | undefined,
  values?: Partial<TModel>,
  baseModel?: Partial<TBaseModel>,
  {
    allowExtraProps
  }: {
    allowExtraProps?: boolean;
  } = { allowExtraProps: true }
): TModel => {
  // values = omitBy(values, isEmpty) as Partial<TModel>;
  // baseModel = omitBy(baseModel, isEmpty) as Partial<TBaseModel>;

  values = defaultsDeep(values, baseModel) as Partial<TModel>;

  if (!schema?.properties) return values as TModel;

  /**
   * Recursively retrieves a value from the schema based on the field type.
   * If the field is an object or has properties, it recursively processes its properties.
   * If the field has a const value, it returns that; otherwise, it checks the
   * values object for the key, or falls back to the field's default value.
   * If no value is found, it returns null.
   *
   * @param field
   * @param values
   * @param key
   * @returns
   */
  function safeValue(field: JsonSchema, values: any, key: string): any {
    // Only recurse into objects with explicit named properties
    // NB: schemas using additionalProperties (e.g. subproduct categories)
    // should fall through to default handling below
    if (!isEmpty(field?.properties)) {
      return reduce(
        field.properties,
        (result, subField, subKey) => {
          const subValue = safeValue(subField, values?.[key], subKey);
          set(result, subKey, subValue);
          return result;
        },
        {} as Record<string, any>
      );
    }

    // NB ensure we always cast booleans correctly, we dont want null or undefined for booleans
    if (includes(["boolean"], field?.type)) {
      return field?.const ?? get(values, key, field?.default) ?? false;
    }

    // NB ensure we sanitize NaN for number/integer fields - empty string parsed as a number produces NaN
    if (includes(["number", "integer"], field?.type)) {
      const raw = field?.const ?? get(values, key, field?.default);
      return (isFinite(raw) ? raw : field?.default) ?? null;
    }

    return field?.const ?? get(values, key, field?.default) ?? null;
  }

  const model = reduce(
    schema.properties,
    (result, field, key) => {
      const value = safeValue(field, values, key);
      set(result, key, value);
      return result;
    },
    {} as Record<string, any>
  );
  if (!allowExtraProps) return compactDeep(model) as TModel;

  const parsed = (
    !allowExtraProps ? model : defaultsDeep(model, values)
  ) as TModel;

  return compactDeep(parsed) as TModel;
};

// -----------------------------------------------------------------------------

/**
 * Translates a validation i18n key using the same logic as jsonforms `createTranslator`.
 * Handles:
 * 1. Format-specific errors: tries `validation.{format}` before `validation.format`
 * 2. Standard keyword translation with count/pluralization
 * 3. Optional i18n overrides from schema/data (via `tm`)
 *
 * @param key - The validation key (e.g. `validation.required`)
 * @param defaultMessage - Fallback message if no translation is found
 * @param data - Template data for interpolation (title, format, i18n, etc.)
 * @returns The translated error message string
 */
export function useValidationTranslator(
  key: string,
  defaultMessage: string,
  data: Record<string, any>
): string {
  const { t, tm } = useI18n();

  const validationKey = trimStart(key, "validation.");
  const isAdditionalError = isEmpty(validationKey);

  // Handle format errors: try format-specific key first (e.g., validation.email)
  if (validationKey === "format" && data?.format) {
    const formatSpecificKey = `validation.${data.format}`;
    const formatSpecificError = t(formatSpecificKey, { ...data });
    // If we found a format-specific message, use it
    if (formatSpecificError && formatSpecificError !== formatSpecificKey) {
      return formatSpecificError;
    }
  }

  // Get the default error type translation based on the validation key and any count for pluralization
  const count = toNumber(data?.[validationKey]) ?? 0;
  let error: string | Record<string, any> | undefined = t(key, {
    ...data,
    count
  });

  // NB: Override the error if we have a specific i18n error message defined in the data object
  //     AND we have a validation key to look for. An empty key means this is an ADDITIONAL ERROR and not generated by the schema validation
  // If the data object contains an "i18n" property, attempt to retrieve a localized error message.
  // This property may be a string (overriding the default error message) or an object with specific messages keyed by validation error type.
  if (!isAdditionalError && !isEmpty(data?.i18n) && tm) {
    const errorOverride = get(tm(data.i18n), "error");
    if (errorOverride) {
      error = isString(errorOverride)
        ? errorOverride
        : (get(errorOverride, key) ?? error); // fallback to the default error if specific one not found
    }
  }

  // Finally, return the error message if found, otherwise return the default message
  return isEmpty(error) || error == key
    ? (defaultMessage as string)
    : (error as string);
}

/**
 * Translates an array of raw AJV errors by resolving the field-level schema
 * for each error and running the message through the shared validation i18n
 * translator. Reusable across any module that validates a model against a
 * JSON schema.
 *
 * @param errors - Raw AJV error objects
 * @param schema - The JSON schema used for validation (used to resolve field titles)
 * @returns Translated error objects with human-readable messages
 */
export function useValidationErrorsTranslator(
  errors: ErrorObject[],
  schema: JsonSchema7
): ErrorObject[] {
  return map(errors, error => {
    // For `required` errors, AJV sets instancePath to the parent object
    // and places the missing field name in params.missingProperty.
    // We must combine them to get the full path to the actual field.
    let path = trimStart(error.instancePath, "/");
    if (error.keyword === "required" && error.params?.missingProperty) {
      path = path
        ? `${path}/${error.params.missingProperty}`
        : error.params.missingProperty;
    }

    const fieldSchema =
      get(schema, `properties.${replace(path, /\//g, ".properties.")}`) ??
      get(schema, `properties.${path}`);
    const title = fieldSchema?.title ?? path;

    const key = `validation.${error.keyword}`;
    const message = useValidationTranslator(key, error.message ?? "", {
      ...fieldSchema,
      ...error.params,
      title,
      path
    });

    return { ...error, params: { ...error.params, title }, message };
  });
}

// -----------------------------------------------------------------------------

export const useValidation = (ajv?: Ajv) => {
  // use JSON Forms version of AJV as it has formats and other keywords already
  const initial = !ajvInstance;

  if (initial) {
    ajvInstance =
      ajv ??
      createAjv({
        useDefaults: true,
        verbose: false
      });

    ajvErrors(ajvInstance, {
      keepErrors: false,
      singleError: true
    });

    forEach(formats, format => ajvInstance.addFormat(format.name, format));

    forEach(keywords, keyword => ajvInstance.addKeyword(keyword));
  }

  return {
    ajv: ajvInstance,
    validate: (schema: JsonSchema, data: any): ErrorObject[] => {
      const validate = ajvInstance.compile(schema);
      const valid = validate(data);
      if (!valid) {
        return validate.errors ?? [];
      }
      return [];
    }
  };
};
