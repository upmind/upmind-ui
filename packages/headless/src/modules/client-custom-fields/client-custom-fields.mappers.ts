/** @internal */
// graphify-out/graph.json (2026-08-10): `resolveFieldByValue`, `flushImages`,
// `mapCustomFieldValues`, `mapCustomFieldValuesToRequest`,
// `mapCustomFieldDisplay` — 0 nodes each, minted. `mapCustomFieldValue` EXISTS
// at `client-personal-details.mappers.ts:87` — relocated here per R2, not
// re-minted. See design.md §0.
import dayjs from "dayjs";
import { CustomFieldsTypes } from "@upmind-automation/types";
import {
  DetailedError,
  mapToHeadlessError,
  useTranslateName,
  useUrl
} from "../../utils";
import {
  compact,
  find,
  get,
  isArray,
  isEmpty,
  isNil,
  isObject,
  isString,
  reduce,
  set
} from "lodash-es";
import type {
  CustomField,
  CustomFieldDisplay,
  CustomFieldModel
} from "./client-custom-fields.types";
import type { ICustomField, ICustomFieldValue } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/client-custom-fields.mappers
 * @description Wire ↔ view-model shaping for custom field definitions and
 * values. Pure — no side effects, no HTTP, and never actor-scoped.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientCustomFields.ts` / `useClientCustomFieldImage.ts` only
 * (`@internal/no-cross-module-imports`).
 */

/**
 * The backend's fixed datetime format — mirrors legacy's
 * `data/date.ts:BACKEND_DATETIME_FORMAT` ("YYYY-MM-DD HH:mm:ss").
 */
const BACKEND_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

/** Maps one wire definition to the view-model, at full `ICustomField` fidelity. */
export function mapCustomField(raw: ICustomField): CustomField {
  return {
    id: raw.id,
    code: raw.code,
    name: useTranslateName(raw),
    type: raw.type_code,
    typeId: raw.type,
    options: raw.values,
    order: raw.order,
    meta: {
      isRequired: raw.required,
      isReadOnly: raw.client_readonly,
      isDisabled: !raw.editable,
      isHidden: raw.hidden,
      isUserOnly: raw.user_only,
      isEditable: raw.editable,
      showOnOrderForm: raw.show_on_order_form,
      showOnInvoice: raw.show_on_invoice,
      displayContexts: raw.display_contexts
    }
  };
}

/**
 * @decision per-type coercion switches on the oracle-specified numeric
 * `field.typeId` (`CustomFieldsTypes`), never the wire's `type_code` string.
 * what:    the switch below matches every `CustomFieldsTypes` member
 *          directly — TEXT, PASSWORD, SELECT, SELECT_RADIO, TEXTAREA, DATE,
 *          NUMBER, IMAGE (`packages/types/src/data/enums/customFields.ts`).
 * why:     the numeric enum is 8/8 oracle-specified and is what legacy's own
 *          component switches key on (`customFields.vue:14,25,33-35,...`) —
 *          see `CustomField.typeId`'s own `@decision`
 *          (`client-custom-fields.types.ts`) for why the wire's `type_code`
 *          string was rejected as a discriminator (2/8 confirmed, 6/8
 *          guessed — a fabrication risk this switch no longer carries).
 * rejected: keying on `field.type` (`type_code` string) — the prior draft's
 *          approach; rejected per `CustomField.typeId`'s own `@decision` for
 *          the identical reason (unverified guesses across 6 of 8 members).
 */
export function mapCustomFieldValue(
  value: unknown,
  field?: CustomField
): unknown {
  if (!field) return value;

  switch (field.typeId) {
    case CustomFieldsTypes.NUMBER:
      return isNil(value) || value === "" ? undefined : Number(value);

    case CustomFieldsTypes.DATE: {
      if (isNil(value) || value === "") return undefined;
      const parsed = dayjs(value as string);
      return parsed.isValid()
        ? parsed.format(BACKEND_DATETIME_FORMAT)
        : undefined;
    }

    case CustomFieldsTypes.SELECT_RADIO:
      return isString(value) ? value === "true" || value === "1" : !!value;

    case CustomFieldsTypes.IMAGE:
      return value;

    case CustomFieldsTypes.TEXT:
    case CustomFieldsTypes.PASSWORD:
    case CustomFieldsTypes.SELECT:
    case CustomFieldsTypes.TEXTAREA:
    default:
      // `""`, never a raw nullish: this branch's contract is a STRING, and a
      // raw `undefined`/`null` return would render as the literal
      // "undefined"/"null" the moment any consumer (or String()) displays it
      // (AC-14).
      return isNil(value) || value === "" ? "" : String(value);
  }
}

/**
 * Client record values → the code-keyed model (seam A-9). `fields` is an
 * explicit argument here so this stays a pure mapper — the seam's bound
 * convenience (`useClientCustomFields().useContext().resolveFieldByValue`,
 * `mapCustomFieldValues` re-exported unbound) supplies the loaded collection.
 */
export function mapCustomFieldValues(
  values: ICustomFieldValue[] = [],
  fields: CustomField[] = []
): CustomFieldModel {
  return reduce(
    values,
    (result, value) => {
      const field = resolveFieldByValue(value, fields);
      if (!field) return result;
      result[field.code] = mapCustomFieldValue(value.value, field);
      return result;
    },
    {} as CustomFieldModel
  );
}

/**
 * Dirty diff against `baseModel`, `""` → `null`, code-keyed (seam A-7).
 * `undefined` signals an empty diff so a caller can short-circuit with zero
 * requests — legacy's own `_.isEmpty(this.customFieldsValues)` guard
 * (`clientCustomFieldsForm.vue:128-137`).
 */
export function mapCustomFieldValuesToRequest(
  model?: CustomFieldModel,
  baseModel?: CustomFieldModel
): CustomFieldModel | undefined {
  const differences = reduce(
    model ?? {},
    (result, value, code) => {
      if ((baseModel ?? {})[code] === value) return result;
      result[code] = value === "" ? null : value;
      return result;
    },
    {} as CustomFieldModel
  );

  return isEmpty(differences) ? undefined : differences;
}

/**
 * Resolves a value's definition, preferring the EMBEDDED `value.field`
 * (seam A-8, AC-16) so a caller never needs the collection loaded. Falls
 * back to the supplied definitions list when no embedded field is present.
 */
export function resolveFieldByValue(
  value?: ICustomFieldValue,
  fields: CustomField[] = []
): CustomField | undefined {
  if (!value) return undefined;
  if (value.field) return mapCustomField(value.field);
  return find(fields, ["id", value.field_id]);
}

/** Read-only display projection for a single value (AC-17). */
export function mapCustomFieldDisplay(
  value: unknown,
  field?: CustomField
): CustomFieldDisplay {
  if (!field) return value as CustomFieldDisplay;

  const coerced = mapCustomFieldValue(value, field);

  switch (field.typeId) {
    case CustomFieldsTypes.SELECT: {
      const option = find(field.options, ["value", coerced]);
      return (option?.label ?? coerced) as CustomFieldDisplay;
    }

    case CustomFieldsTypes.SELECT_RADIO:
      return coerced ? "yes" : "no";

    case CustomFieldsTypes.IMAGE:
      return isEmpty(coerced)
        ? undefined
        : {
            downloadUrl: buildImageDownloadUrl(coerced as string),
            preview: buildImageDownloadUrl(coerced as string)
          };

    default:
      return coerced as CustomFieldDisplay;
  }
}

/** Mirrors `system-upload.machine.ts`'s own `src` derivation for a hash. */
function buildImageDownloadUrl(hash: string): string {
  return useUrl(`images/${hash}/download`).toString();
}

/**
 * True for an AJV-shaped error entry naming the bare `image` field —
 * `system-upload.machine.ts`'s own `setError` runs a 422 through
 * `useValidationParser`, so what reaches here is `{ instancePath: "/image",
 * propertyName: "image", message, … }`, never legacy's axios
 * `data.image: string[]` (AC-19's corrected shape).
 */
function isImageValidationError(
  entry: unknown
): entry is { propertyName?: string; instancePath?: string; message?: string } {
  if (!isObject(entry)) return false;
  const candidate = entry as {
    propertyName?: unknown;
    instancePath?: unknown;
  };
  return (
    candidate.propertyName === "image" || candidate.instancePath === "/image"
  );
}

/** Every `image`-field message found in `source`, in whatever shape it arrives. */
function extractImageMessages(source: unknown): string[] {
  if (isArray(source)) {
    return compact(
      source.map(entry =>
        isImageValidationError(entry)
          ? (entry.message as string | undefined)
          : undefined
      )
    );
  }
  // Defensive fallback for the axios-style `{ image: string[] }` shape
  // (AC-19's own — now corrected — original assumption); never the observed
  // shape, but harmless to also recognise.
  const bareImage = get(source, "image");
  return isArray(bareImage) ? bareImage : [];
}

/**
 * Rewrites the `image`-field API error onto the field's own
 * `custom_fields.<code>` key — legacy's `customFields.vue:399-403` (AC-19).
 * `code` MUST be the field's own `code`, never its `id` — `CustomFieldModel`
 * (the body the consumer actually submitted) is keyed by `code`, so an error
 * key built from `id` cannot be mapped back to what was sent.
 *
 * `useUpload().add()` double-wraps its rejection (`useUpload.ts`'s own
 * `catch`, out of scope), so the validation-parsed entries this needs land
 * on `mapped.origin`'s own `data`, not `mapped.data` — read both so a
 * differently-shaped or absent `origin` never throws, only finds nothing.
 *
 * @decision an unresolvable `code` (the caller's own definition lookup came
 * back empty) returns the error UNREWRITTEN rather than keying on the
 * field's `id` instead.
 * what:    with no `code`, this is a no-op — the original error passes
 *          through untouched, `image` key and all.
 * why:     a fallback to `id` LOOKS like a fix (a `custom_fields.<something>`
 *          key exists) while silently building a key the consumer's
 *          code-keyed model can never match — the exact defect this
 *          function exists to close, reintroduced in the one path
 *          (definition lookup failure) least likely to be noticed in
 *          review. An unrewritten `image` key is visibly incomplete, not
 *          plausibly wrong.
 * rejected: falling back to `id` — rejected as the reintroduced bug, above.
 */
export function rewriteImageErrorKey(
  error: unknown,
  code: string | undefined
): unknown {
  if (!code) return error;

  const mapped = mapToHeadlessError(error);
  if (!mapped) return error;

  const messages = [
    ...extractImageMessages(get(mapped.origin, "data")),
    ...extractImageMessages(mapped.data)
  ];
  if (isEmpty(messages)) return error;

  const data = isObject(mapped.data) ? { ...(mapped.data as object) } : {};
  set(data, [`custom_fields.${code}`], messages);
  delete (data as Record<string, unknown>).image;

  return new DetailedError(
    mapped.message,
    mapped.status as number,
    mapped.origin,
    data
  );
}
