/** @internal */
import { UserMetaKeys } from "@upmind-automation/types";
// `mapCustomFieldValuesToRequest` lives in `client-custom-fields` (A-8, R2) —
// consumed here, never re-implemented (AC-59).
import {
  mapCustomFieldValue,
  mapCustomFieldValuesToRequest
} from "../client-custom-fields";
import { find, isBoolean, isEqual, map, omitBy } from "lodash-es";
import type {
  ProfileField,
  ProfileModel,
  ProfileUpdateBody
} from "./client-personal-details.types";
import type { CustomField } from "../client-custom-fields";
import type { ILanguage } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/client-personal-details.mappers
 * @description Wire <-> view-model shaping for a client's profile. Pure — no
 * side effects, no HTTP, and never actor-scoped. The record read itself is
 * mapped once by the `client` module (`mapClientRecord`); this file owns only
 * the write diff.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `usePersonalDetails.ts` / the barrel only (`@internal/no-cross-module-imports`).
 */

/**
 * The native profile fields at wire shape; native text leaves coerced `?? ""`.
 * `PUT clients/{id}` rejects `null` for these (422) and clears on `""`.
 */
function toProfileWire(model: ProfileModel): ProfileUpdateBody {
  return {
    firstname: model.firstName ?? "",
    lastname: model.lastName ?? "",
    public_name: model.publicName ?? "",
    // `document_language_id` tracks the interface language — both diff together
    // on a language change, both omitted otherwise (AC-48).
    interface_language_id: model.language,
    document_language_id: model.language
  };
}

/**
 * The dirty `PUT clients/{id}` body. The native fields are diffed the
 * `client-address.mappers.ts:130-151` way — model and baseModel mapped to wire
 * shape, clearables coerced `?? null` on BOTH sides, then `omitBy(isEqual)`.
 * The custom-field and `meta` halves keep their own diffs. `undefined` for an
 * empty diff so the caller short-circuits with zero requests (AC-45).
 */
export function mapIProfileFields(
  model: ProfileModel,
  baseModel: ProfileModel = {}
): ProfileUpdateBody | undefined {
  const next = toProfileWire(model);
  const previous = toProfileWire(baseModel);

  const diff = omitBy(next, (value, key) =>
    isEqual(previous[key as keyof ProfileUpdateBody], value)
  ) as ProfileUpdateBody;

  const customFields = mapCustomFieldValuesToRequest(
    model.customFields,
    baseModel.customFields
  );
  if (customFields !== undefined) diff.custom_fields = customFields;

  if (
    isBoolean(model.excludeDelegatedProducts) &&
    model.excludeDelegatedProducts !== baseModel.excludeDelegatedProducts
  ) {
    diff.meta = {
      [UserMetaKeys.UI_PRODUCTS_EXCLUDE_DELEGATES]:
        model.excludeDelegatedProducts ? "1" : "0"
    };
  }

  return Object.keys(diff).length ? diff : undefined;
}

/** The client-surface permission metadata every native profile row carries. */
const NATIVE_FIELD_META: CustomField["meta"] = {
  isRequired: false,
  isReadOnly: false,
  isDisabled: false,
  isHidden: false,
  isUserOnly: false,
  isEditable: true,
  showOnOrderForm: false,
  showOnInvoice: false,
  displayContexts: { invoice: false, order_form: false }
};

/** Projects the edit model and resolved lookups into the read display list — native fields, then one row per custom-field definition. */
export function mapProfileFields(
  model: ProfileModel | undefined,
  fields: CustomField[] = [],
  languages: ILanguage[] = [],
  t: (key: string) => string
): ProfileField[] {
  if (!model) return [];

  const languageName =
    find(languages, ["id", model.language])?.language ?? model.language ?? "";

  return [
    {
      id: "firstName",
      code: "firstName",
      fieldPath: "firstName",
      title: t("form.firstname.label"),
      value: model.firstName,
      meta: { ...NATIVE_FIELD_META, isCustomField: false }
    },
    {
      id: "lastName",
      code: "lastName",
      fieldPath: "lastName",
      title: t("form.lastname.label"),
      value: model.lastName,
      meta: { ...NATIVE_FIELD_META, isCustomField: false }
    },
    {
      id: "publicName",
      code: "publicName",
      fieldPath: "publicName",
      title: t("form.publicName.label"),
      value: model.publicName,
      meta: { ...NATIVE_FIELD_META, isCustomField: false }
    },
    {
      id: "language",
      code: "language",
      fieldPath: "language",
      title: t("form.language.label"),
      value: languageName,
      meta: { ...NATIVE_FIELD_META, isRequired: true, isCustomField: false }
    },
    ...map(fields, field => ({
      id: field.id,
      code: field.code,
      fieldPath: `customFields.${field.code}`,
      title: field.name,
      value: mapCustomFieldValue(model.customFields?.[field.code], field),
      meta: { ...field.meta, isCustomField: true }
    }))
  ];
}
