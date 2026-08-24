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
import { find, map, reduce } from "lodash-es";
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
 * staff row), followed by the brand's custom field DEFINITIONS, each
 * left-joined against the client's own values by `field_id`. A definition
 * with no matching value still projects — as an empty value, never a row —
 * so a client who has never answered anything still sees every field
 * (parity FE-2824 receipt for this module: the prior value-driven `reduce`
 * showed zero rows for that client, `client-personal-details.mappers.ts:127`
 * pre-fix). Any value whose `field_id` is NOT among `definitions` — the only
 * way this can happen is `definitions` not having resolved/loaded yet, since
 * a deleted definition would also delete its values server-side — still
 * projects via its OWN embedded field, exactly as before this fix; skipped
 * only when neither the value nor `definitions` can name its field, matching
 * legacy's own `if (!fieldCode) return result`. `definitions` defaults to
 * `[]` (this function's read is a pure projection — degrading to
 * native-fields-only on a failed definitions load is
 * `usePersonalDetails.context.ts`'s job, not this one's).
 *
 * @decision iterate `definitions` (module A's collection) for the LEFT JOIN,
 * with a second pass over `record.customFieldValues` for whatever
 * `definitions` doesn't (yet) cover — rather than iterating
 * `record.customFieldValues` alone (the pre-fix shape) or `definitions` alone.
 * what:    for each definition, `find` the matching value by `field_id`.
 *          When one exists, resolve its OWN field via `resolveFieldByValue`
 *          (embedded-first, AC-16) rather than reusing `definition` directly
 *          — cheaper, and correct even before A's collection resolves. With
 *          no matching value, the definition itself supplies the row, and
 *          `mapCustomFieldValue(undefined, field)` already yields each
 *          type's own "unanswered" shape (`""` for TEXT/SELECT, `undefined`
 *          for NUMBER/DATE/IMAGE, `false` for the checkbox) — no separate
 *          empty-value branch needed. A second pass then walks
 *          `record.customFieldValues` for any `field_id` NOT already covered
 *          by `definitions`, resolving each via the value's OWN embedded
 *          field (the pre-fix behaviour, kept verbatim for this remainder)
 *          and skipping one with neither an embedded field nor a
 *          `definitions` match.
 * why:     the read surface must enumerate what the BRAND defines, not what
 *          THIS client happens to have answered — legacy's own
 *          `customFields.vue` renders every definition its `filter[object_type]=client`
 *          fetch returns and joins values in where present, never the
 *          reverse (`clientCustomFieldsForm.vue`'s `custom-fields` call site
 *          passes no `filters`, so this brand's client-facing surface is
 *          unfiltered by the FE at all). The second pass exists because
 *          `definitions` is caller-supplied and MAY legitimately be `[]`
 *          (A's collection still loading, or a caller that never threads it)
 *          — a value the client already carries, embedded field and all,
 *          must not vanish for the SAME reason AC-16 exists: resolving it
 *          needs no collection load at all.
 * rejected: iterating `definitions` alone with no second pass — rejected: it
 *          would blank every custom field row for the entire window before
 *          `definitions` resolves, and for any caller (including this
 *          module's own unit suite) that never threads a `definitions` list
 *          at all, trading the original defect (all-zero for an
 *          unanswered client) for a new one (all-zero for every client,
 *          always, absent a definitions load).
 *
 * @oracle vue-app@ea310f5a42e32b7ae1255c223b77918ef0594286.
 * `customFields.vue` (the client-facing edit/read surface both
 * `clientCustomFieldsForm.vue`, the `/account/profile` call site, and the
 * admin equivalent mount) applies NO client-side `hidden`/`user_only` filter
 * at all — `filteredCustomFields` (`customFields.vue:204-215`) only narrows
 * by the `filters` PROP, which this call site never passes
 * (`clientCustomFieldsForm.vue:4-22`); every definition the
 * `filter[object_type]=client&brand_id=…` fetch returns is rendered
 * unconditionally, `hidden`/`user_only` included. `client_readonly` affects
 * only the EDIT surface: `isReadOnly(field)` (`customFields.vue:273-275`,
 * `field.client_readonly && this.isClient`) disables the input and suppresses
 * the required asterisk — it never hides the row, on the read or the edit
 * side. This mapper already carries `isHidden`/`isUserOnly`/`isReadOnly`
 * straight through on `field.meta` (from `mapCustomField`) with no
 * visibility gate of its own — matching the oracle exactly, so no new
 * filtering was added here.
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
  languages: ILanguage[] = [],
  definitions: CustomField[] = []
): ProfileField[] {
  const { t } = useI18n();
  const languageName =
    find(languages, ["id", record.language])?.language ?? record.language;
  const definedFieldIds = new Set(map(definitions, "id"));

  const remainderFields = reduce(
    record.customFieldValues,
    (result, value) => {
      if (definedFieldIds.has(value.field_id)) return result;
      const field = resolveFieldByValue(value);
      if (!field) return result;

      result.push({
        id: field.id,
        code: field.code,
        fieldPath: `customFields.${field.code}`,
        title: field.name,
        value: mapCustomFieldValue(value.value, field),
        meta: { ...field.meta, isCustomField: true }
      });
      return result;
    },
    [] as ProfileField[]
  );

  return [
    {
      id: "firstName",
      code: "firstName",
      fieldPath: "firstName",
      title: t("form.firstname.label"),
      value: record.firstName,
      meta: { ...NATIVE_FIELD_META, isCustomField: false }
    },
    {
      id: "lastName",
      code: "lastName",
      fieldPath: "lastName",
      title: t("form.lastname.label"),
      value: record.lastName,
      meta: { ...NATIVE_FIELD_META, isCustomField: false }
    },
    {
      id: "publicName",
      code: "publicName",
      fieldPath: "publicName",
      title: t("form.publicName.label"),
      value: record.publicName,
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
    ...map(definitions, definition => {
      const value = find(record.customFieldValues, ["field_id", definition.id]);
      const field = value
        ? (resolveFieldByValue(value, [definition]) ?? definition)
        : definition;

      return {
        id: field.id,
        code: field.code,
        fieldPath: `customFields.${field.code}`,
        title: field.name,
        value: mapCustomFieldValue(value?.value, field),
        meta: { ...field.meta, isCustomField: true }
      };
    }),
    ...remainderFields
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
