/** @internal */
// `mapCustomFieldValue`, `resolveFieldByValue` and `mapCustomFieldValuesToRequest`
// live in `client-custom-fields` (A-6/A-7/A-8, R2) — consumed here, never
// re-implemented (AC-59).
import {
  mapCustomFieldValue,
  mapCustomFieldValuesToRequest,
  resolveFieldByValue
} from "../client-custom-fields";
import { useI18n } from "../system-localisation";
import { find, reduce } from "lodash-es";
import type { CustomField } from "../client-custom-fields";
import type {
  ProfileField,
  ProfileModel,
  ProfileRecord,
  ProfileUpdateBody
} from "./client-personal-details.types";
import type { IClient, ILanguage } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/client-personal-details.mappers
 * @description Wire <-> view-model shaping for a client's profile. Pure — no
 * side effects, no HTTP, and never actor-scoped.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `usePersonalDetails.ts` / `usePersonalDetailsManager.ts` only
 * (`@internal/no-cross-module-imports`).
 */

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

/** Maps the raw client record into the read half's own view-model. */
export function mapProfile(raw: IClient): ProfileRecord {
  return {
    id: raw.id,
    firstName: raw.firstname,
    lastName: raw.lastname,
    publicName: raw.public_name,
    language: raw.interface_language_id,
    customFieldValues: raw.custom_fields ?? []
  };
}

/**
 * Projects a profile record into the display list — native fields, at their
 * client-surface permission metadata (no gate applies to the client actor;
 * the parity table's would-be `D6`/`D7` gates live entirely on the dropped
 * staff row), followed by the client's custom field values. Each value
 * resolves its definition off the EMBEDDED `value.field` (AC-16) — no
 * `client-custom-fields` collection load required. A value whose definition
 * was deleted from the catalogue is skipped, matching legacy's own
 * `if (!fieldCode) return result`.
 *
 * @decision the language row's DISPLAY value is the resolved NAME, never the
 * raw id — deliberately different from what `ProfileModel.language` holds.
 * what:    `languages` is an explicit second argument, used ONLY to resolve
 *          `record.language` (an id) to its `ILanguage.language` (a name)
 *          for THIS projection's `value`. Falls back to the raw id if the
 *          id isn't in the list (never renders the literal string
 *          "undefined") — the same "keep the unresolved id visible rather
 *          than blank it" instinct AC-35 codifies for the schema option,
 *          applied here to the read-only display row.
 * why:     legacy binds the language id in the form control but renders the
 *          NAME in the read-only profile view
 *          (`clientProfileBasicConfigurationForm.vue:101,120`, logged as
 *          G-9). AC-33 ("tracked by its identity, not by its display name")
 *          is about `ProfileModel.language` / `ProfileContext.model` — the
 *          EDIT side — and stays an id; this function's return value is a
 *          SEPARATE, read-only `ProfileField[]` never fed back into the
 *          model, so resolving the name here cannot regress AC-33.
 * rejected: resolving the name in the PLAYGROUND template instead —
 *          rejected, the lookups this needs (the brand's language list)
 *          are a headless-owned concern already fetched here
 *          (`usePersonalDetails.context.ts` now threads `useBrand().languages`
 *          through), and every other native-field label/value pair is
 *          already resolved at this same layer.
 */
export function mapProfileFields(
  record: ProfileRecord,
  languages: ILanguage[] = []
): ProfileField[] {
  const { t } = useI18n();
  const languageName =
    find(languages, ["id", record.language])?.language ?? record.language;

  return [
    {
      id: "firstName",
      code: "firstName",
      title: t("form.firstname.label"),
      value: record.firstName,
      meta: { ...NATIVE_FIELD_META, isCustomField: false }
    },
    {
      id: "lastName",
      code: "lastName",
      title: t("form.lastname.label"),
      value: record.lastName,
      meta: { ...NATIVE_FIELD_META, isCustomField: false }
    },
    {
      id: "publicName",
      code: "publicName",
      title: t("form.publicName.label"),
      value: record.publicName,
      meta: { ...NATIVE_FIELD_META, isCustomField: false }
    },
    {
      id: "language",
      code: "language",
      title: t("form.language.label"),
      value: languageName,
      meta: { ...NATIVE_FIELD_META, isRequired: true, isCustomField: false }
    },
    ...reduce(
      record.customFieldValues,
      (result, value) => {
        const field = resolveFieldByValue(value);
        if (!field) return result;

        result.push({
          id: field.id,
          code: field.code,
          title: field.name,
          value: mapCustomFieldValue(value.value, field),
          meta: { ...field.meta, isCustomField: true }
        });
        return result;
      },
      [] as ProfileField[]
    )
  ];
}

/**
 * The dirty, diff-only PUT body: keyed to the client-surface fields ONLY —
 * `firstname`, `lastname`, `public_name`, `interface_language_id`,
 * `document_language_id`, `custom_fields` (AC-49) — computed key by key
 * against `baseModel`, never by a value predicate. `undefined` for an empty
 * diff so the caller can short-circuit with zero requests (AC-45), matching
 * legacy's own `_.isEmpty(this.formValues)` guard
 * (`clientProfileBasicConfigurationForm.vue:395`).
 *
 * @decision no `omitBy(..., isEmpty)` / `omitBy(..., isNil)` anywhere here.
 * what:    every key below is set directly from the diff, never filtered by
 *          a value predicate afterwards.
 * why:     the two `omitBy` calls this replaces were the whole of G-4/G-5 —
 *          they stripped the `null` that clears a custom field and the
 *          `""` / `false` / `0` that clears or sets a native one. Emptiness
 *          is decided by the DIFF (a key is absent because it did not
 *          change), never by whether the new value looks "empty".
 * rejected: keeping `omitBy(..., isNil)` on `custom_fields` alone — rejected,
 *          it is the exact defect AC-46 exists to close.
 */
export function mapIProfileFields(
  model: ProfileModel,
  baseModel: ProfileModel = {}
): ProfileUpdateBody | undefined {
  const diff: ProfileUpdateBody = {};

  if (model.firstName !== baseModel.firstName) diff.firstname = model.firstName;
  if (model.lastName !== baseModel.lastName) diff.lastname = model.lastName;
  if (model.publicName !== baseModel.publicName)
    diff.public_name = model.publicName;

  // `document_language_id` is sent ONLY when the interface language itself
  // changed (AC-48) — legacy `clientProfileBasicConfigurationForm.vue:265-266`.
  if (model.language !== baseModel.language) {
    diff.interface_language_id = model.language;
    diff.document_language_id = model.language;
  }

  const customFields = mapCustomFieldValuesToRequest(
    model.customFields,
    baseModel.customFields
  );
  if (customFields !== undefined) diff.custom_fields = customFields;

  return Object.keys(diff).length ? diff : undefined;
}
