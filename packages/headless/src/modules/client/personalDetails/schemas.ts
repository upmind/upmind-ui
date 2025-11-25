// --- internal
import {
  useFieldsSchemaParser,
  useFieldsUischemaParser,
  useFieldsModelParser
} from "../../../utils";

import { FieldsContext, FieldsModel } from "./types";

// --- utils
import {
  get,
  map,
  pick,
  filter,
  forEach,
  isEmpty,
  omitBy,
  isNil,
  pickBy
} from "lodash-es";

// --- types
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement
} from "@jsonforms/core";

export const useSchema = ({
  fields,
  filterFields = [],
  languages
}: FieldsContext): JsonSchema7 => {
  let customFields = useFieldsSchemaParser(fields);
  let schemaProps: JsonSchema7["properties"] = {
    firstName: {
      type: ["string", "null"]
    },
    lastName: {
      type: ["string", "null"]
    },
    publicName: {
      type: ["string", "null"]
    },
    language: {
      type: ["string", "null"],
      ...(languages?.length &&
        Array.isArray(languages) && {
          enum: map(languages, "id"),
          options: map(languages, ({ language, id }) => ({
            label: language,
            value: id
          }))
        })
    },
    customFields
  } as Record<string, any>;

  if (!isEmpty(filterFields)) {
    customFields.properties = pickBy(
      customFields["properties"],
      (_value, key) => filterFields.includes(`customFields.${key}`)
    ) as JsonSchema7["properties"];

    schemaProps = {
      ...pick(schemaProps, filterFields),
      ...(isEmpty(customFields["properties"]) ? {} : { customFields })
    };
  }

  return {
    type: "object",
    required: [],
    properties: schemaProps
  };
};

export const useUischema = ({ fields, filterFields = [] }: FieldsContext) => {
  const schemaElements: ControlElement[] = [
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
    {
      type: "Control",
      scope: "#/properties/publicName",
      i18n: "form.public_name"
    },
    {
      type: "Control",
      scope: "#/properties/language",
      i18n: "form.language"
    },
    ...useFieldsUischemaParser(fields)
  ];

  return {
    type: "VerticalLayout",
    elements: !!filterFields.length
      ? filter(schemaElements, element => {
          const field = element.scope
            .replace("#/properties/", "")
            .replace("/properties/", ".");
          return filterFields.includes(field);
        })
      : schemaElements
  } as UISchemaElement;
};

export const useModelParser = (
  fields: FieldsContext["fields"],
  filterFields = [],
  values: FieldsModel
) => {
  const model = {
    firstName: values?.firstName,
    lastName: values?.lastName,
    publicName: values?.publicName,
    language: values?.language,
    customFields: useFieldsModelParser(fields, get(values, "customFields", {}))
  };

  return model as FieldsModel;
};
