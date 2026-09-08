// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-personal-details.schemas
 * @description A STAND-IN for the real module's own schema builders
 * (`packages/headless/src/modules/client-personal-details/client-personal-details.schemas.ts`),
 * carrying the same two exported functions with the same `ProfileContext`
 * parameter — so the swap is one import line, exactly as plan F3 promises.
 *
 * It exists because the real file cannot be reached at runtime today: it
 * imports the `client-custom-fields` BARREL, whose transitive closure is 300
 * modules — `query` → `basket` → `routing` — including several module-load
 * `interpret()` calls. F3 assumed a schema file was a leaf of data; it is
 * not. Recorded as the phase's open question; delete this file the moment
 * the real one can be imported on its own.
 *
 * The four native fields, their `["string", "null"]` types, the language
 * enum/options (with legacy's unknown-current-language fallback) and the
 * empty-list `undefined` guard are the real file's, property for property —
 * no `title`s, so a label is derived from the property name exactly as it is
 * there.
 *
 * ONE divergence remains, and it is the reason this file exists: the
 * `customFields` sub-schema is absent. The real file builds it from
 * `useCustomFieldsSchema(lookups.fields)`, which is the barrel import that
 * drags the 300 modules in. The profile form filters to the natives, so
 * nothing renders differently today; the custom-field form is its own row
 * (plan §3) on its own stand-in.
 *
 * @module-oracle vue-app `clientProfileBasicConfigurationForm.vue`.
 */

import { filter, includes, isEmpty, map } from "lodash-es";
import type {
  ControlElement,
  JsonSchema7,
  VerticalLayout
} from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";
import type { ProfileContext } from "@upmind-automation/headless";
import type { ILanguage } from "@upmind-automation/types";

type LanguageOption = { label: string; value: string; disabled?: boolean };

/**
 * `options` is a UI-renderer extension, not a core JSON Schema keyword — the
 * real module's own property shape carries the same widening.
 */
type SchemaProperty = JsonSchema7 & { options?: LanguageOption[] };

/**
 * A client whose stored language is absent from the brand's list still gets
 * that id as a selectable-but-disabled option, so the field is never silently
 * blanked on load.
 */
function languageOptions(
  languages: readonly ILanguage[],
  currentLanguageId: string | undefined
): { enum: string[]; options: LanguageOption[] } {
  const known = map(languages, ({ id }) => id);
  const options: LanguageOption[] = map(languages, ({ language, id }) => ({
    label: language,
    value: id
  }));

  const isUnknown =
    currentLanguageId !== undefined && !includes(known, currentLanguageId);
  if (!isUnknown) return { enum: known, options };

  return {
    enum: [...known, currentLanguageId],
    options: [
      ...options,
      { label: currentLanguageId, value: currentLanguageId, disabled: true }
    ]
  };
}

/** An empty list reads as ABSENT, never as an empty `enum` — the real file's own guard. */
function orUndefined<T>(list: T[]): T[] | undefined {
  if (isEmpty(list)) return undefined;
  return list;
}

/** Which fields the context narrowed the form to; empty means all of them. */
function narrowedTo(context: ProfileContext): string[] {
  const fields = context.lookups?.["filterFields"] ?? [];
  return filter(fields, (field): field is string => typeof field === "string");
}

function isRendered(field: string, only: readonly string[]): boolean {
  if (isEmpty(only)) return true;
  return includes(only, field);
}

/** Schema for the profile editor. */
export const useSchema = (context: ProfileContext): JsonSchema7 => {
  const languages = filter(
    context.lookups?.["languages"] ?? [],
    (entry): entry is ILanguage => typeof entry?.id === "string"
  );
  const currentLanguageId =
    context.model?.language ?? context.baseModel?.language ?? undefined;
  const { enum: languageEnum, options: languageOpts } = languageOptions(
    languages,
    currentLanguageId
  );
  const only = narrowedTo(context);

  const properties: Record<string, SchemaProperty> = {};
  if (isRendered("firstName", only)) {
    properties["firstName"] = { type: ["string", "null"] };
  }
  if (isRendered("lastName", only)) {
    properties["lastName"] = { type: ["string", "null"] };
  }
  if (isRendered("publicName", only)) {
    properties["publicName"] = { type: ["string", "null"] };
  }
  if (isRendered("language", only)) {
    properties["language"] = {
      type: ["string", "null"],
      enum: orUndefined(languageEnum),
      options: orUndefined(languageOpts)
    };
  }

  return { type: "object", required: [], properties };
};

const PROFILE_CONTROLS: readonly ControlElement[] = [
  { type: "Control", scope: "#/properties/firstName", i18n: "form.first_name" },
  { type: "Control", scope: "#/properties/lastName", i18n: "form.last_name" },
  {
    type: "Control",
    scope: "#/properties/publicName",
    i18n: "form.public_name"
  },
  { type: "Control", scope: "#/properties/language", i18n: "form.language" }
];

/** UI schema for the profile editor. */
export const useUischema = (context: ProfileContext): VerticalLayout => {
  const only = narrowedTo(context);
  return {
    type: "VerticalLayout",
    elements: filter(PROFILE_CONTROLS, control =>
      isRendered(control.scope.replace("#/properties/", ""), only)
    )
  };
};

/**
 * What a profile form opens with when the dataset answers nothing — every
 * native field present and empty, so a control never binds `undefined`. The
 * live form opens on the persona instead (`forms/profile-context.ts`).
 */
export const profileDefaults = (): FormModel => ({
  firstName: "",
  lastName: "",
  publicName: "",
  language: null
});
