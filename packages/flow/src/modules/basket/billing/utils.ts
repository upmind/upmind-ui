// --- external

// --- internal

// --- utils
import { get, map } from "lodash-es";

// --- types
import type { IBillingDetails, BillingDetailssContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const useSchema = ({ fields }: BillingDetailssContext) => {
  const schema = {
    type: "object",
    title: "BillingDetailss",
    required: [],
    properties: {
      notes: {
        type: ["string", "null"],
        title: "Order Notes"
      }
    }
  };

  return schema as JsonSchema;
};

export const useUischema = ({ fields }: BillingDetailssContext) => {
  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/notes",
        options: {
          multi: true,
          focus: true,
          autocomplete: "off",
          placeholder: "Add notes here..."
        }
      }
    ]
  };

  return schema as UISchemaElement;
};

export const useModelParser = (
  { fields }: BillingDetailssContext,
  values: IBillingDetails
) => {
  const model = {
    notes: values?.notes
  };

  return model as IBillingDetails;
};
