/** @internal */
import { useFieldsSchemaParser, useFieldsUischemaParser } from "../../utils";
import { map, pick, filter, isEmpty, pickBy } from "lodash-es";
import type { FieldsContext } from "./client-personal-details.types";
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement
} from "@jsonforms/core";

export const useSchema = ({ lookups }: FieldsContext): JsonSchema7 => {
  const customFields = useFieldsSchemaParser(lookups?.fields);
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
      enum: isEmpty(lookups?.languages)
        ? undefined
        : map(lookups?.languages, "id"),
      options: isEmpty(lookups?.languages)
        ? undefined
        : map(lookups?.languages, ({ language, id }) => ({
            label: language,
            value: id
          }))
    },
    customFields
  } as Record<string, any>;

  if (!isEmpty(lookups?.filterFields)) {
    customFields.properties = pickBy(
      customFields["properties"],
      (_value, key) =>
        (lookups?.filterFields ?? []).includes(`customFields.${key}`)
    ) as JsonSchema7["properties"];

    customFields.required = filter(customFields.required, field =>
      (lookups?.filterFields ?? []).includes(`customFields.${field}`)
    );

    schemaProps = {
      ...pick(schemaProps, lookups?.filterFields ?? []),
      ...(isEmpty(customFields["properties"]) ? {} : { customFields })
    };
  }

  return {
    type: "object",
    required: [],
    properties: schemaProps
  };
};

export const useUischema = ({ lookups }: FieldsContext) => {
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
    ...useFieldsUischemaParser(lookups?.fields)
  ];

  return {
    type: "VerticalLayout",
    elements: !isEmpty(lookups?.filterFields)
      ? filter(schemaElements, element => {
          const field = element.scope
            .replace("#/properties/", "")
            .replace("/properties/", ".");
          return lookups?.filterFields?.includes(field);
        })
      : schemaElements
  } as UISchemaElement;
};
