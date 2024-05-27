// --- external

// --- internal
import {
  useFieldsSchemaParser,
  useFieldsUischemaParser,
  useFieldsModelParser,
} from "../../../utils";

// --- utils
import { get, map } from "lodash-es";

// --- types
import type { IField, FieldsContext } from "./types.d";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const useSchema = ({ fields }: FieldsContext) => {
  const schema = {
    type: "object",
    title: "Fields",
    required: [],
    properties: {
      notes: {
        type: ["string", "null"],
        title: "Order Notes",
      },
      custom_fields: useFieldsSchemaParser(fields),
    },
  };

  return schema as JsonSchema;
};

export const useUischema = ({ fields }: FieldsContext) => {
  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/notes",
        options: {
          multi: true,
          focus: true,
          autosize: true,
          autocomplete: "off",
          placeholder: "Add notes here...",
          size: "sm",
        },
      },
      ...useFieldsUischemaParser(
        map(fields, field => {
          if (["input_file", "image"].includes(field.type_code)) {
            field.options ??= {};

            field.options.field = {
              field_id: field?.id,
              field_type: "client_custom_field",
              field_is_default: false,
            };
          }

          return field;
        })
      ),
    ],
  };

  return schema as UISchemaElement;
};

export const useModelParser = (
  fields: FieldsContext["fields"],
  values: IField
) => {
  const model = {
    notes: values?.notes,
    custom_fields: useFieldsModelParser(
      fields,
      get(values, "custom_fields", {})
    ),
  };

  return model as IField;
};
