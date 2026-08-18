/** @internal */
// A's schema/uischema contract (A-3/A-4, R4) — consumed here, never
// re-derived locally (AC-59).
import {
  useCustomFieldsSchema,
  useCustomFieldsUischema
} from "../client-custom-fields";
import { filter, includes, isEmpty, map, pick, pickBy } from "lodash-es";
import type { CustomField } from "../client-custom-fields";
import type { ProfileContext } from "./client-personal-details.types";
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement
} from "@jsonforms/core";
import type { ILanguage } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/client-personal-details.schemas
 * @description Schema/uischema generation for the profile editor. The
 * custom-field sub-schema/controls are A's contract (A-3/A-4); this file
 * owns only the four native fields and the `filterFields` narrowing.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `usePersonalDetailsManager.ts` / the barrel only.
 */

type LanguageOption = { label: string; value: string; disabled?: boolean };

/**
 * `options` is a UI-renderer extension, not a core JSON Schema keyword —
 * mirrors `useFieldsSchemaParser`'s own property shape (`utils/useFields.ts`),
 * which carries the same extension, without widening to `any`.
 */
type SchemaProperty = JsonSchema7 & { options?: unknown };
type SchemaProperties = Record<string, SchemaProperty>;

/**
 * The language enum + options, with legacy's "unknown current language"
 * fallback (AC-35): a client whose current language id is absent from the
 * brand's list still gets that id as a selectable-but-disabled option, so
 * `input()` never silently blanks the field.
 */
function languageOptions(
  languages: ILanguage[],
  currentLanguageId?: string
): { enum: (string | null)[]; options: LanguageOption[] } {
  const known = map(languages, ({ id }) => id);
  const options: LanguageOption[] = map(languages, ({ language, id }) => ({
    label: language,
    value: id
  }));

  if (currentLanguageId && !includes(known, currentLanguageId)) {
    return {
      enum: [...known, currentLanguageId],
      options: [
        ...options,
        { label: currentLanguageId, value: currentLanguageId, disabled: true }
      ]
    };
  }

  return { enum: known, options };
}

/** Schema for the profile editor. Consumes A's contract for `customFields`. */
export const useSchema = (context: ProfileContext): JsonSchema7 => {
  const lookupFields = (context.lookups?.fields ?? []) as CustomField[];
  const languages = (context.lookups?.languages ?? []) as ILanguage[];
  const filterFields = (context.lookups?.filterFields ?? []) as string[];
  const currentLanguageId =
    context.model?.language ?? context.baseModel?.language;

  const customFields = useCustomFieldsSchema(lookupFields);
  const { enum: languageEnum, options: languageOpts } = languageOptions(
    languages,
    currentLanguageId
  );

  let schemaProps: SchemaProperties = {
    firstName: { type: ["string", "null"] },
    lastName: { type: ["string", "null"] },
    publicName: { type: ["string", "null"] },
    language: {
      type: ["string", "null"],
      enum: isEmpty(languageEnum) ? undefined : languageEnum,
      options: isEmpty(languageOpts) ? undefined : languageOpts
    },
    customFields
  };

  if (!isEmpty(filterFields)) {
    customFields.properties = pickBy(
      customFields["properties"],
      (_value, key) => filterFields.includes(`customFields.${key}`)
    ) as JsonSchema7["properties"];

    customFields.required = filter(customFields.required, field =>
      filterFields.includes(`customFields.${field}`)
    );

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

/** UI schema for the profile editor. Consumes A's contract for `customFields`. */
export const useUischema = (context: ProfileContext): UISchemaElement => {
  const lookupFields = (context.lookups?.fields ?? []) as CustomField[];
  const filterFields = (context.lookups?.filterFields ?? []) as string[];

  const elements: ControlElement[] = [
    {
      type: "Control",
      scope: "#/properties/firstName",
      i18n: "form.first_name"
    },
    { type: "Control", scope: "#/properties/lastName", i18n: "form.last_name" },
    {
      type: "Control",
      scope: "#/properties/publicName",
      i18n: "form.public_name"
    },
    { type: "Control", scope: "#/properties/language", i18n: "form.language" },
    ...useCustomFieldsUischema(lookupFields)
  ];

  return {
    type: "VerticalLayout",
    elements: isEmpty(filterFields)
      ? elements
      : filter(elements, element => {
          const field = element.scope
            .replace("#/properties/", "")
            .replace("/properties/", ".");
          return filterFields.includes(field);
        })
  } as UISchemaElement;
};
