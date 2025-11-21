// --- internal
import {
  useFieldsSchemaParser,
  useFieldsUischemaParser,
  useFieldsModelParser
} from "../../../utils";

import { FieldsContext, FieldsModel } from "./types";

// --- utils
import { get, map } from "lodash-es";

// --- types
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";

export const useSchema = ({ fields }: FieldsContext): JsonSchema7 => {
  console.log("useSchema fields:", fields);
  const schema: JsonSchema7 = {
    type: "object",
    required: [],
    properties: {
      firstName: {
        type: ["string", "null"]
      },
      lastName: {
        type: ["string", "null"]
      },
      customFields: useFieldsSchemaParser(fields)
    }
  };

  return schema;
};

export const useUischema = ({ fields }: FieldsContext) => {
  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/firstName",
        i18n: "form.first_name"
      },
      {
        type: "Control",
        scope: "#/properties/lastName",
        i18n: "form.last_name"
      },
      // {
      //   type: "Control",
      //   scope: "#/properties/email",
      //   i18n: "form.email",
      //   options: {
      //     autoFocus: true,
      //     autocomplete: "email",
      //     placeholder: "name@email.com"
      //   }
      // },
      ...useFieldsUischemaParser(fields)
    ]
  };

  return schema as UISchemaElement;
};

export const useModelParser = (
  fields: FieldsContext["fields"],
  values: FieldsModel
) => {
  const model = {
    firstName: values?.firstName,
    lastName: values?.lastName,
    customFields: useFieldsModelParser(fields, get(values, "customFields", {}))
  };
  return model as FieldsModel;
};
