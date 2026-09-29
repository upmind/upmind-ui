import type { ProfileModel } from "./client-personal-details.types";
import type { QueryKey } from "@tanstack/vue-query";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/client-personal-details.utils
 * @description Pure helpers for the services file — the shared client-record
 * cache key, the clear-intent predicate, and the cleared-field restoration
 * `parse()` applies. No HTTP, no state reads.
 */

/**
 * The last segment of the shared client-record key. MUST stay byte-identical
 * to `client-custom-fields.services.ts`'s own private
 * `CLIENT_RECORD_QUERY_KEY_SEGMENT` — A resolves `brand_id` off the SAME
 * `clients/{id}?with=custom_fields,custom_fields.field` resource under the
 * SAME key (design.md §3.3/T-B2), so the two dedupe onto one request per
 * boot instead of two. Not imported from A's `@internal` services file
 * (B "imports nothing else from A", design.md §4) — mirrored as a literal.
 */
export const RECORD_QUERY_KEY_SEGMENT = "record" as const;

/** Builds the shared client-record key for a resolved id. */
export function recordQueryKey(clientId?: string): QueryKey {
  return ["client", clientId, RECORD_QUERY_KEY_SEGMENT];
}

/** `true` for the two wire representations of "the caller cleared this field". */
export function isClearIntent(value: unknown): boolean {
  return value === "" || value === null;
}

const NATIVE_MODEL_KEYS = [
  "firstName",
  "lastName",
  "publicName",
  "language"
] as const;

/**
 * Re-instates every key the caller explicitly cleared (AC-46/AC-47) that
 * `useModelParser`'s own final `compactDeep` step just dropped.
 *
 * @decision restore cleared keys HERE, in `parse()`, rather than in
 * `useValidation.ts`/`isDeepEmpty.ts` or by reintroducing an `omitBy` in
 * `mapIProfileFields` — and restore the NATIVE and CUSTOM-FIELD halves to
 * DIFFERENT wire values, matching the oracle rather than one convenient
 * shape for both.
 * what:    for every native key `incoming` carries as `""`/`null`, restore
 *          that key to `""` on `parsed` if `useModelParser` dropped it. For
 *          every `customFields` code `incoming.customFields` carries as
 *          `""`/`null`, restore that code to `null`. A key `incoming` never
 *          mentions is left alone — this never invents a clear, only
 *          preserves one the caller already stated.
 * why:     `useModelParser`'s final step (`compactDeep(model, {preserveContainers:true})`,
 *          run on BOTH `allowExtraProps` branches, not only the `false` one
 *          this file passes) treats an empty string as "not meaningful"
 *          (`utils/isDeepEmpty.ts`'s `isMeaningful`) and OMITS the key
 *          entirely — never sets it to `""` or `null`, just removes it.
 *          `null` fails the SAME `isNil` check and is dropped too. So
 *          `mapIProfileFields` (AC-46/AC-47) never sees the clear at all:
 *          `model.firstName` reads `undefined` (indistinguishable from
 *          "untouched"), the native-field diff still fires
 *          (`undefined !== baseModel.firstName`) and sets
 *          `diff.firstname = undefined`, which `JSON.stringify` drops from
 *          the wire body — a PUT that "succeeds" and clears nothing. For a
 *          custom field the loss is total: `mapCustomFieldValuesToRequest`
 *          (A-7) reduces over `model.customFields`'s OWN keys, so a
 *          stripped code produces no diff entry at all, not even a
 *          `key: undefined`. AC-45's empty-diff no-op is UNAFFECTED by this
 *          fix — it short-circuits on `mapIProfileFields`'s own diff being
 *          empty, which restoring a GENUINE clear does not change (an
 *          untouched field was never in `incoming` and is never restored).
 *          The NATIVE value restores as `""`, not `null`: legacy's own
 *          profile form sends the blanked form value straight through
 *          (`clientProfileBasicConfigurationForm.vue:260-269`,
 *          `omitBy(form, (v,k) => initForm()[k] === v)` — no `"" -> null`
 *          coercion), and the recorded capture
 *          (`put-clients-id-case-native-falsy.json`) is `{"public_name":""}`.
 *          Legacy maps `"" -> null` ONLY for custom fields
 *          (`clientCustomFieldsForm.vue:78-80`), matching
 *          `put-clients-id-case-clear-custom-field.json`'s recorded
 *          `{"custom_fields":{"age":null}}`. `schemas.ts`'s native
 *          properties type as `["string","null"]` with no `minLength` /
 *          `format` / `pattern` keyword on any of the four, so `""` passes
 *          AJV the same as `null` would.
 * rejected: restoring the native value as `null` (this function's earlier
 *          shape) — it passed validation and produced a green pipeline
 *          spec, but MSW replays the recorded 200 regardless of request
 *          body, so nothing proved the API accepts `null` on a native
 *          string field; the ONE recorded capture for this case is
 *          `{"public_name":""}`, not `null` — proving a value the fixture
 *          never recorded is exactly Blocker 1's own lesson from the other
 *          direction. Fixing this in `useValidation.ts` (`useModelParser`)
 *          or `isDeepEmpty.ts` (`compactDeep`/`isMeaningful`) — both outside
 *          this module's write lane, and `compactDeep`'s "empty is not
 *          meaningful" contract is used far beyond this one call site, so
 *          changing it there is a platform-wide behaviour change this run
 *          does not own. Reintroducing `omitBy(..., isNil)` /
 *          `omitBy(..., isEmpty)` in `mapIProfileFields` — rejected
 *          outright, it is the exact defect AC-46/AC-47 exist to close, and
 *          the earlier `@decision` there already explains why.
 */
export function restoreClearedFields(
  parsed: ProfileModel,
  incoming?: Partial<ProfileModel>
): ProfileModel {
  if (!incoming) return parsed;

  const restored: ProfileModel = { ...parsed };

  for (const key of NATIVE_MODEL_KEYS) {
    if (isClearIntent(incoming[key]) && !(key in restored)) {
      restored[key] = "";
    }
  }

  if (incoming.customFields) {
    const clearedCodes = Object.entries(incoming.customFields).filter(
      ([, value]) => isClearIntent(value)
    );
    if (clearedCodes.length) {
      const customFields = { ...(restored.customFields ?? {}) };
      for (const [code] of clearedCodes) {
        if (!(code in customFields)) customFields[code] = null;
      }
      restored.customFields = customFields;
    }
  }

  return restored;
}
