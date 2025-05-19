// --- external
import { createAjv } from "@jsonforms/core";

import ajvErrors from "ajv-errors";
import addFormats from "ajv-formats";

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
  isArray,
  isEmpty,
  isNil,
  map,
  omit,
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
import type { JsonSchema7 } from "@jsonforms/core";

let ajvInstance: Ajv;
// -----------------------------------------------------------------------------

type JsonSchemaExtended = JsonSchema7 & Record<string, any>;
type GenericFieldWithValidation = {
  name: string;
  field_label: string;
  description?: string;
  default_value?: string | number | boolean;
  validation_rules: string[];
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
  // const { getCountry } = useSystem();
  // const defaultCountry = getCountry();

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
      format: "international_phone",
      phoneCountryCode: context?.defaultCountry?.code ?? "",
      errorMessage: "Please enter a valid international phone number",
    };
  } else if (rule == "domain_name") {
    return {
      format: "domain_name",
      errorMessage: "Please enter a valid domain name",
    };
  } else if (rule === "alpha") {
    return {
      format: "alpha",
      errorMessage: {
        format: "may only contain letters",
      },
    };
  } else if (rule === "alpha-dash") {
    return {
      format: "alpha-dash",
      errorMessage: {
        format: "may only contain letters, numbers, and dashes",
      },
    };
  } else if (rule === "alpha-num") {
    return {
      format: "alpha_num",
      errorMessage: {
        format: "may only contain letters and numbers",
      },
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
      return {
        oneOf: map(field?.options, option => ({
          const: option.value,
          title: option.label,
        })),
      };
    } else {
      const values = rule.substring(3).split(",");
      return { enum: values };
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
      exclusiveMinimum: Math.pow(10, value - 1),
    };
  } else if (rule.startsWith("max_digits:")) {
    const value = parseInt(rule.substring(11), 10);
    return {
      type: "number",
      maximum: Math.pow(10, value) - 1,
    };
  } else if (rule.startsWith("digits:")) {
    const value = parseInt(rule.substring(7), 10);
    return {
      type: "number",
      exclusiveMinimum: Math.pow(10, value - 1),
      maximum: Math.pow(10, value) - 1,
    };
  } else if (rule.startsWith("digits_between:")) {
    const [min, max] = rule.substring(15).split(",").map(Number);
    return {
      type: "number",
      exclusiveMinimum: Math.pow(10, min - 1),
      maximum: Math.pow(10, max) - 1,
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
      formatMaximum: date,
    };
  } else if (rule.startsWith("after:")) {
    const date = rule.substring(6);
    return {
      format: "date",
      formatMinimum: date,
    };
  } else if (rule.startsWith("before_or_equal:")) {
    const date = rule.substring(16);
    return {
      format: "date",
      formatMaximum: date,
    };
  } else if (rule.startsWith("after_or_equal:")) {
    const date = rule.substring(15);
    return {
      format: "date",
      formatMinimum: date,
    };
  }
  // 5. Custom Keywords
  else if (rule.startsWith("required_if:")) {
    return {};
    // const [otherProperty, value] = rule.substring(12).split(",");
    // return {
    //   if: {
    //     properties: {
    //       [otherProperty]: { const: value },
    //     },
    //   },
    //   then: {
    //     required: [otherProperty],
    //   },
    // };
  } else if (rule.startsWith("required_unless:")) {
    return {};
    // const [otherProperty, value] = rule.substring(16).split(",");
    // return {
    //   if: {
    //     not: {
    //       properties: {
    //         [otherProperty]: { const: value },
    //       },
    //     },
    //   },
    //   then: {
    //     required: [otherProperty],
    //   },
    // };
  } else if (rule.startsWith("required_with:")) {
    return {};
    // const otherProperties = rule.substring(14).split(",");
    // return {
    //   if: {
    //     properties: Object.fromEntries(
    //       otherProperties.map(prop => [prop, { type: "any" }])
    //     ),
    //     required: otherProperties,
    //   },
    //   then: {
    //     required: otherProperties,
    //   },
    // };
  } else if (rule.startsWith("required_without:")) {
    return {};
    // const otherProperties = rule.substring(17).split(",");
    // return {
    //   if: {
    //     not: {
    //       anyOf: otherProperties.map(prop => ({
    //         properties: {
    //           [prop]: { type: "any" },
    //         },
    //         required: [prop],
    //       })),
    //     },
    //   },
    //   then: {
    //     required: otherProperties,
    //   },
    // };
  } else if (rule === "same:") {
    return {};
    // const otherProperty = rule.substring(5);
    // return {
    //   const: { $data: `#/properties/${otherProperty}` },
    // };
  } else if (rule === "different:") {
    return {};
    // const otherProperty = rule.substring(9);
    // return {
    //   not: { const: { $data: `#/properties/${otherProperty}` } },
    // };
  }
  // 6. Default
  // For any rule we haven't explicitly mapped, we'll return it as a custom keyword
  return { [rule]: true };
}

function mapLaravelConditionalRuleToJSONSchema(
  field: GenericFieldWithValidation
): JsonSchema7 | undefined {
  for (const rule of field.validation_rules) {
    if (rule.startsWith("required_if:")) {
      const [otherField, expectedValue] = rule.substring(12).split(",");
      return {
        if: {
          properties: {
            [otherField]: { const: expectedValue },
          },
        },
        then: {
          required: [field.name],
        },
        else: {},
      };
    }
    // ---
    else if (rule.startsWith("required_unless:")) {
      const [otherField, expectedValue] = rule.substring(16).split(",");
      return {
        if: {
          not: {
            properties: {
              [otherField]: { const: expectedValue },
            },
          },
          then: {
            required: [field.name],
          },
          else: {},
        },
      };
    }
    // ---
    else if (rule.startsWith("required_with:")) {
      const otherFields = rule.substring(14).split(",");
      return {
        if: {
          required: otherFields,
        },
        then: {
          required: [field.name],
        },
        else: {},
      };
    }
    // ---
    else if (rule.startsWith("required_without:")) {
      const otherFields = rule.substring(17).split(",");
      return {
        if: {
          not: {
            anyOf: otherFields.map(field => ({ required: [field] })),
          },
        },
        then: {
          required: [field.name],
        },
        else: {},
      };
    }
  }

  return undefined; // Return undefined if no matching rule is found
}

function mapLaravelRulesToJsonSchemaProperty(
  field: GenericFieldWithValidation,
  context: Record<string, any> = {}
): JsonSchemaExtended {
  let schemaProperty: JsonSchemaExtended = {};
  for (const rule of field.validation_rules) {
    const keywordMap = mapLaravelRuleToJSONSchema(rule, field, context);
    // merge each rule into the schemaProperty
    schemaProperty = { ...schemaProperty, ...keywordMap } as JsonSchemaExtended;

    // Handle nullable carefully
    if (rule === "nullable") {
      if (schemaProperty.type === "string") {
        schemaProperty.type = ["string", "null"];
      } else if (!schemaProperty.type) {
        schemaProperty.type = "null";
      } else if (
        Array.isArray(schemaProperty.type) &&
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
  }
  return schemaProperty;
}

export function useLaravalSchemaParser(
  fields: GenericFieldWithValidation[],
  context: Record<string, any> = {}
): JsonSchema7 {
  const properties: JsonSchema7["properties"] = {};
  const requiredFields: JsonSchema7["required"] = [];
  const allOf: JsonSchema7["allOf"] = [];

  forEach(fields, field => {
    if (!field.deferrable || field.defer_mode != "hidden") {
      const schema = {
        title: field.field_label,
        description: field.description,
        default: field?.default_value,
        ...mapLaravelRulesToJsonSchemaProperty(field, context), // Map the rules
      };

      // Handle 'required'
      if (field.validation_rules.includes("required")) {
        requiredFields.push(field.name);
      }

      // Handle conditional requirements
      const conditionalRule = mapLaravelConditionalRuleToJSONSchema(field);
      if (conditionalRule) {
        allOf.push(conditionalRule);
      }

      set(properties, field.name, omitBy(schema, isNil));
    }
  });

  return omitBy(
    {
      type: "object",
      properties,
      required: requiredFields,
      // allOf: allOf,
    },
    isEmpty
  ) as JsonSchema7;
}

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
  const initial = !ajvInstance;

  if (initial) {
    debugger;
    ajvInstance =
      ajv ?? createAjv({ useDefaults: true, allErrors: true, verbose: false });

    ajvErrors(ajvInstance, {
      keepErrors: false,
      singleError: false,
    });

    addFormats(ajvInstance, {});

    forEach(formats, format =>
      ajvInstance.addFormat(format.name, format.validate)
    );

    forEach(keywords, keyword => ajvInstance.addKeyword(keyword));
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
