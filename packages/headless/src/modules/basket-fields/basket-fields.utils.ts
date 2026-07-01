import {
  useFieldsSchemaParser,
  useFieldsUischemaParser,
  useFieldsModelParser
} from "../../utils";
import { get } from "lodash-es";
import type { FieldsModel, FieldsContext } from "./basket-fields.types";
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
        title: "Order Notes"
      },
      customFields: useFieldsSchemaParser(fields)
    }
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
        i18n: "form.field_notes",
        options: {
          multi: true,
          autosize: true,
          autocomplete: "off"
        }
      },
      ...useFieldsUischemaParser(fields, "basket.fields")
    ]
  };

  return schema as UISchemaElement;
};

export const useModelParser = (
  fields: FieldsContext["fields"],
  values: FieldsModel
) => {
  const model = {
    notes: values?.notes,
    customFields: useFieldsModelParser(fields, get(values, "customFields", {}))
  };
  return model as FieldsModel;
};
