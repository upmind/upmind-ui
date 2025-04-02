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
import type { Field, FieldsContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

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
      customFields: useFieldsSchemaParser(fields),
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
        i18n: "basket.fields.notes",
        options: {
          multi: true,
          autosize: true,
          autocomplete: "off",
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
        }),
        "basket.fields"
      ),
    ],
  };

  return schema as UISchemaElement;
};

export const useModelParser = (
  fields: FieldsContext["fields"],
  values: Field
) => {
  const model = {
    notes: values?.notes,
    customFields: useFieldsModelParser(fields, get(values, "customFields", {})),
  };
  return model as Field;
};
