// --- external

// --- internal

// --- utils
import {
  useSchema as useDefaultSchema,
  useUischema as useDefaultUischema
} from "../schemas";

// --- types
import type { BraintreeContext } from "./types";
import type { UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export const useSchema = (context: BraintreeContext) => {
  const defaultSchema = useDefaultSchema(context as any);

  const schema = {
    type: "object",
    title: "Payment Gateway Options",
    required: [
      ...(defaultSchema?.required || []) // NB Always include the default schema required fields
    ],

    properties: {
      ...(defaultSchema?.properties || {}) // NB Always include the default schema properties
    }
  };

  return schema;
};

export const useUischema = (context: BraintreeContext) => {
  const defaultUischema = useDefaultUischema(context);

  const uischema = {
    type: "VerticalLayout",
    elements: [
      ...(defaultUischema?.elements || []) // NB Always append the default uischema elements
    ]
  };

  return uischema as UISchemaElement;
};
