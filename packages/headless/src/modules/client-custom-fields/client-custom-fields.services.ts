/** @internal */
import { computed, ref, watch } from "vue";
import {
  CustomFieldsMajorTypes,
  ImageObjectTypes
} from "@upmind-automation/types";
import { useQuery, invalidateQueryByKey } from "../query";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import { useUpload } from "../system-upload";
import {
  mapCustomField,
  rewriteImageErrorKey
} from "./client-custom-fields.mappers";
import {
  useCustomFieldsSchema,
  useQuerySchema
} from "./client-custom-fields.schemas";
import {
  ClientCustomFieldContextTypes,
  ClientCustomFieldsContextTypes,
  CUSTOM_FIELD_DEFAULT_SORT
} from "./client-custom-fields.types";
import {
  useTime,
  ErrorOrigin,
  useValidation,
  DetailedError,
  responseCodes,
  useCollection,
  mapToHeadlessError,
  NotAuthenticatedError,
  DEBOUNCE_DELAY
} from "../../utils";
import { isArray, isEmpty, isEqual, map, sortBy } from "lodash-es";
import type { ScopeContext } from "../scope";
import type {
  ClientCustomFieldsListQuery,
  ClientCustomFieldsServices,
  ClientCustomFieldImageServices,
  CustomField,
  CustomFieldModel,
  QueryModel
} from "./client-custom-fields.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { ICustomField, IClient } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/client-custom-fields.services
 * @description The ONE services file both composables consume — the
 * collection's `loadList`, definition lookups, the IMAGE upload wiring, and
 * the aggregate save-time flush. One factory on purpose: one identity seam,
 * one cache key, one arm-resolution switch.
 *
 * Nothing here raises feedback. A failure rejects for the caller and lands in
 * the scope's own error state, which the composables expose.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientCustomFields.ts` / `useClientCustomFieldImage.ts` only
 * (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/** The module's base cache key. */
export const queryKey: QueryKey = ["client", "customFields"];

/**
 * Derives the target client id from the RESOLVED scope — the ONE seam every
 * request-issuing function in this file shares, and the fix for a services
 * layer that hardwires the session's client for every call.
 *
 * A `VALUES` context names the client's own value set being addressed; with
 * none it falls back to the active session's own client (the self case). A
 * `FIELD` context (the image half) deliberately falls through to the
 * session too — a field context names the entity, not its owner. This
 * compares the CONTEXT the scope builder resolved, never the actor, so it is
 * not a branch on `ScopeActorTypes.SELF`.
 */
function resolveClientId(scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();

  return computed(() =>
    scopeContext?.type === ClientCustomFieldsContextTypes.VALUES
      ? scopeContext.id
      : activeUser.value?.id
  );
}

/**
 * Resolves the field id out of a `FIELD`-context scope; `undefined` for the
 * collection's own `VALUES` scope, which has none.
 */
function resolveFieldId(scopeContext?: ScopeContext): string | undefined {
  return scopeContext?.type === ClientCustomFieldContextTypes.FIELD
    ? scopeContext.id
    : undefined;
}

/**
 * Resolves true only for an authenticated session with an addressable
 * client.
 *
 * The module's ONE addressability predicate. Every request gate here calls
 * it, and both services factories expose its reactive form as
 * `service.isAvailable` so the composable layers READ this function rather
 * than re-deriving the expression.
 */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();

  return isAuthenticated.value && !!clientId;
}

/**
 * A's OWN client-record read — NOT a shared cache entry with Module B's
 * profile read, despite both reading `GET
 * clients/{id}?with=custom_fields,custom_fields.field` under the same base
 * literal (design.md §3.3/T-B2's original intent). Corrected: an earlier
 * revision of this file claimed the two dedupe onto one request; they do
 * not, and forcing them to would be unsafe, not merely incomplete — see
 * `rejected` below. This constant is intentionally NOT exported: nothing
 * imports it (B mirrors the literal independently, by its own admission in
 * `client-personal-details.services.ts`), so exporting it asserted a sharing
 * that was never real.
 *
 * @decision A resolves `brand_id` via its OWN independently-keyed read of
 * the resource Module B's read half also targets, rather than sharing one
 * cache entry with B.
 * what:    a one-shot (`get()` = `queryClient.fetchQuery`) read of
 *          `clients/{id}?with=custom_fields,custom_fields.field`, selecting
 *          only `data?.brand_id`, under THIS module's own key. That key is
 *          NOT the same cache entry as B's: `get()` appends a `{locale}`
 *          segment (`useQuery.ts:262`) unless `withoutLocale` is passed,
 *          which this read does not do, while B's own key is a raw literal
 *          with no such segment — so the two entries cannot dedupe, and
 *          wherever both paths run the identical profile resource is
 *          fetched twice rather than once.
 * why:     `session-store` carries neither `brand_id` NOR `customFields` on
 *          `activeUser` — `SessionUser` declares no `brand_id`
 *          (`session-store.types.ts:93-141`) and `customFields` is declared
 *          but never assigned by `mapSessionUser`
 *          (`session-store.mappers.ts:53-88`, `requirements.md` §7.1). That
 *          ONE structural absence is what forces BOTH modules to compensate
 *          with their own `GET clients/{id}` read — A for `brand_id` (AC-2),
 *          B for the read verb itself (AC-30/AC-31, design.md §3.3's own
 *          `@decision`). `session-store/` is explicitly out of this run's
 *          scope; widening it is the right fix for a session-store story,
 *          not this one — flagged as a follow-up, not fixed here.
 * rejected: (a) `useBrand()`'s session brand — rejected outright by AC-2's
 *          own wording ("never useBrand()'s session brand"). (b) widening
 *          `SessionUser`/`mapSessionUser` — rejected: touches `session-store`,
 *          named out of scope (the follow-up above). (c) deferring brand
 *          resolution to Module B — rejected: A converts FIRST and must
 *          satisfy AC-1/AC-2 on its own. (d) making the two keys
 *          byte-identical (this module's own earlier claim) — rejected as
 *          UNSAFE, not just unrealised: `useQuery().get()`'s own
 *          `getRequest` bakes its `select` INSIDE `queryFn`, so the CACHED
 *          value under a shared key would be whichever side's `queryFn` won
 *          the race — this module's bare `brand_id` string, or B's full
 *          `IClient` — poisoning the loser. B's own
 *          `client-personal-details.services.ts` documents this exact
 *          poisoning, empirically observed, for its `loadLookups` one-shot
 *          read, and works around it there by bypassing the shared cache
 *          entirely; B's OWN reactive `loadProfile()` still assumes a shared
 *          key with this module that its actual key (a raw `vueUseQuery`
 *          key, no `{locale}` segment) never matches against THIS module's
 *          real key (`get()` appends `{locale}` unless `withoutLocale`,
 *          which this read does not pass) — so the two were never actually
 *          sharing, only assumed to be. Reconciling that requires changing
 *          B's own read strategy too, out of this module's write lane.
 * cost:    two independently-keyed cache entries for the same
 *          `clients/{id}?with=custom_fields,custom_fields.field` resource,
 *          each staled at `staleTime` DAY (so a remount of either is warm),
 *          which cannot dedupe onto one request for the mechanism above. The
 *          actual per-boot request count is an open measurement, not
 *          restated here — see `parity.yaml` G-P2 and
 *          `evidence/07-gaps-and-limits.md` G3. A genuinely shared, safe
 *          entry needs B's own dispatch to resolve the `select`-baking
 *          hazard above — not fixed here.
 */
const CLIENT_RECORD_QUERY_KEY_SEGMENT = "record" as const;

function loadClientBrandId(scopeContext?: ScopeContext) {
  const clientId = resolveClientId(scopeContext);
  const brandId = ref<string | undefined>(undefined);
  const error = ref<unknown>(undefined);
  const isSettled = ref(false);

  async function resolve(id?: string): Promise<void> {
    const { get: getOne, useUrl } = useQuery();

    try {
      brandId.value = await getOne<IClient, IClient["brand_id"] | undefined>({
        queryKey: ["client", id, CLIENT_RECORD_QUERY_KEY_SEGMENT],
        url: useUrl(`clients/${id}`, {
          with: "custom_fields,custom_fields.field"
        }),
        select: data => data?.brand_id,
        withAccessToken: true,
        staleTime: useTime().DAY
      });
    } catch (err) {
      error.value = err;
    } finally {
      isSettled.value = true;
    }
  }

  // Self-stopping: only WAITS while the session has not yet resolved a
  // client id (the cold-boot edge case, `design.md` §7). A fixed scope
  // instance never legitimately flips between two different defined client
  // ids, so resolving once per instance — rather than watching forever — is
  // what keeps this from being an unstoppable watcher (unlike `list()`'s own
  // watchers, which TanStack's cache GC eventually reaps).
  // `let` + a no-op initializer, not `const`: `{ immediate: true }` can invoke
  // this callback SYNCHRONOUSLY, inside the `watch()` call itself, before its
  // return value would otherwise be assigned — calling `stop()` at that point
  // hit a TDZ `ReferenceError` under `const`.
  let stop: () => void = () => {};
  stop = watch(
    clientId,
    id => {
      if (!isAddressable(id)) return;
      stop();
      resolve(id);
    },
    { immediate: true }
  );

  return {
    brandId: computed(() => brandId.value),
    error: computed(() => error.value),
    isSettled: computed(() => isSettled.value)
  };
}

/**
 * COLLECTION — the reactive list query, minted once per scope.
 *
 * The KEY carries the client id AND the resolved brand id as REFS: vue-query
 * deep-unwraps refs inside a query key, so either arriving or changing late
 * re-derives the options into a DIFFERENT cache entry (AC-1, AC-2). `enabled`
 * and `guard` hold the unaddressable-or-brand-unresolved entry shut.
 */
function loadList(scopeContext?: ScopeContext): ClientCustomFieldsListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);
  const brand = loadClientBrandId(scopeContext);

  // URL SCOPING, not criteria: these two say WHICH catalogue is being read.
  // They are not filters a consumer may change, so they never enter the query
  // model — parity Q5 / AC-32.
  const targetUrl = () =>
    useUrl("custom_fields", {
      "filter[object_type]": CustomFieldsMajorTypes.CLIENT,
      brand_id: brand.brandId.value ?? ""
    });
  const url = targetUrl();

  // Self-referencing `const`: `select` (below) reads `query.criteria` — the
  // SAME criteria model `list()` returns — to tell a consumer's declared sort
  // apart from the schema's own default. Safe because `select` only ever
  // runs inside `queryFn`, strictly after this initializer finishes and
  // `query` is bound — `list()`'s own `vueUseQuery` never invokes `queryFn`
  // synchronously. Reads the ONE criteria path; does not add one.
  const query: ClientCustomFieldsListQuery = list<
    ICustomField[],
    CustomField[],
    QueryModel
  >({
    criteria: { schema: useQuerySchema() },
    queryKey: [...queryKey, { client: clientId, brand: brand.brandId }],
    url,
    // `enabled:` only stops the query starting; this rejects a forced
    // `refetch()` on a dead, unaddressable, or brand-unresolved scope with
    // the typed error instead of a raw request. Must stay an `async`
    // function — `list()` detects a guard by `isPromise`.
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        if (brand.error.value) {
          reject(mapToHeadlessError(brand.error.value));
          return;
        }
        if (!brand.brandId.value) {
          reject(new NotAuthenticatedError());
          return;
        }
        url.search = targetUrl().search;
        resolve(true);
      }),
    withAccessToken: true,
    // AC-3's own scenario holds even against a scrambled wire response, so
    // the DEFAULT view is still sorted client-side rather than trusted from
    // the wire — legacy's own second, unconditional reorder
    // (`customFieldsView.vue:89-91`, `orderBy(['order','asc'])`). A
    // consumer's OWN declared sort (AC-30) must win instead: once the live
    // criteria departs from the schema's `CUSTOM_FIELD_DEFAULT_SORT`, this
    // stops re-ordering and the requested `order=` response stands as
    // returned.
    select: data => {
      const mapped = map(data ?? [], mapCustomField);
      return isEqual(query.criteria.value.sort, CUSTOM_FIELD_DEFAULT_SORT)
        ? sortBy(mapped, "order")
        : mapped;
    },
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    // `enabled` gates on the brand read having SETTLED, never on it having
    // SUCCEEDED (`!!brand.brandId.value` — the AC-6 bug this replaces): a
    // failed or empty-`brand_id` brand read still flips `isSettled`, so this
    // still fires the query, and `guard` above (which already checks
    // `brand.error`/`brand.brandId`) turns that into the query's OWN
    // rejection instead of a permanently-disabled entry `isFetched` can never
    // reach. A `!!brand.brandId.value` gate can never fetch AT ALL on that
    // failure, which is what left `isReady()` unbounded.
    enabled: () => isAddressable(clientId.value) && brand.isSettled.value
  });

  return query;
}

/** Resolves a single definition by id from the (awaited) collection. */
async function resolveFieldById(
  id: CustomField["id"] | undefined,
  scopeContext?: ScopeContext
): Promise<CustomField | undefined> {
  if (!id) return undefined;

  const query = loadList(scopeContext);
  await query.promise.value.finally();

  const { getOne } = useCollection<CustomField>(
    isArray(query.data.value) ? query.data.value : []
  );

  return getOne(id);
}

function isPendingImageUpload(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

/**
 * Uploads a field's IMAGE value through `system-upload`'s existing
 * `clients/fields/{field_id}/image` route (`system-upload.services.ts:48-52`)
 * — A does not implement the POST (R5). Mints and disposes a throwaway
 * `useUpload` instance; used only by the aggregate {@link flushImages},
 * which has no need of the per-field composable's persistent one.
 */
async function uploadFieldImage(
  file: File,
  field: CustomField
): Promise<string | undefined> {
  const upload = useUpload({
    field_id: field.id,
    field_type: ImageObjectTypes.CLIENT_CUSTOM_FIELD,
    field_is_default: false
  });

  return upload
    .add(file as unknown as string)
    .then(hash => (isEmpty(hash) ? undefined : (hash as string)))
    .catch(error => {
      throw rewriteImageErrorKey(error, field.code);
    })
    .finally(() => upload.stop());
}

/**
 * Aggregate save-time flush (seam A-11): every dirty (pending-upload) IMAGE
 * value in `model` is uploaded and replaced by its hash; untouched values
 * (already a stored hash) pass through unchanged — legacy's own dirty check
 * (`customFields.vue:349-356`), expressed structurally here instead, since a
 * bare `CustomFieldModel` carries no baseline to diff against.
 */
async function flushImages(
  model: CustomFieldModel = {},
  scopeContext?: ScopeContext
): Promise<CustomFieldModel> {
  const dirty = Object.entries(model).filter(([, value]) =>
    isPendingImageUpload(value)
  ) as [string, File][];

  if (isEmpty(dirty)) return model;

  const clientId = resolveClientId(scopeContext);
  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const query = loadList(scopeContext);
  await query.promise.value.finally();

  const { findOne } = useCollection<CustomField>(
    isArray(query.data.value) ? query.data.value : []
  );

  const uploaded = await Promise.all(
    dirty.map(async ([code, file]) => {
      const field = findOne({ code });
      if (!field) return [code, model[code]] as const;
      return [code, await uploadFieldImage(file, field)] as const;
    })
  );

  return { ...model, ...Object.fromEntries(uploaded) };
}

/**
 * Schema validation against this scope's own definitions. Rejects with a
 * `DetailedError` carrying the AJV errors as `data`.
 */
async function validate(
  model?: CustomFieldModel,
  fields?: CustomField[]
): Promise<CustomFieldModel | undefined> {
  const { t } = useI18n();
  const schema = useCustomFieldsSchema(fields);
  const { validate: validateAgainstSchema } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validateAgainstSchema(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.client_custom_fields_validation_failed"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          errors
        )
      );
    } else {
      resolve(model);
    }
  });
}

/** Invalidates this module's cache key so the collection refetches. */
async function refresh(): Promise<void> {
  await invalidateQueryByKey(queryKey, { exact: false })(undefined);
}

// -----------------------------------------------------------------------------
// Service Factory

/**
 * Service matrix: maps scopeActor types to their service implementations.
 * The shape is the same armed or armless — an armless module has only the
 * `default:` case.
 */
function scopedServices(
  scopeActor: ScopeActorTypes,
  _scopeContext?: ScopeContext
): Partial<ClientCustomFieldsServices> {
  switch (scopeActor) {
    default:
      return {};
  }
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * Services factory for the definitions COLLECTION — the concrete actor and
 * the context it acts upon arrive first, at construction.
 */
export const createClientCustomFieldsServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ClientCustomFieldsServices => {
  const mutationError = ref<ResponseError | undefined>(undefined);
  const clientId = resolveClientId(scopeContext);

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    error: computed(() => mutationError.value),
    loadList: () => loadList(scopeContext),
    resolveFieldById: id => resolveFieldById(id, scopeContext),
    uploadFieldImage,
    flushImages: model => flushImages(model, scopeContext),
    validate,
    refresh,
    ...scopedServices(scopeActor, scopeContext)
  };
};

/**
 * Services factory for the per-field IMAGE editor. Shares the SAME identity
 * seam via `resolveClientId`/`resolveFieldId`, so both composables address
 * the same client. Holds ONE persistent `useUpload` instance for this
 * field's lifetime — the interactive counterpart to {@link uploadFieldImage}'s
 * throwaway one, so `.field`/`.error` and the wrapping composable's
 * context/meta layers have real state to project.
 */
export const createClientCustomFieldImageServices = (
  _scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ClientCustomFieldImageServices => {
  const clientId = resolveClientId(scopeContext);
  const fieldId = resolveFieldId(scopeContext);
  const field = ref<CustomField | undefined>(undefined);
  const mutationError = ref<ResponseError | undefined>(undefined);

  if (fieldId) {
    resolveFieldById(fieldId, scopeContext).then(resolved => {
      field.value = resolved;
    });
  }

  const uploader = useUpload({
    field_id: fieldId,
    field_type: ImageObjectTypes.CLIENT_CUSTOM_FIELD,
    field_is_default: false
  });

  /**
   * The owning field's `code` — never its `id` (`rewriteImageErrorKey`'s own
   * `@decision`). `field.value` is populated asynchronously at construction
   * and may not have settled yet by the time an upload fails, so this awaits
   * the SAME resolution on demand rather than reading a possibly-stale ref;
   * `resolveFieldById` reuses this scope's own collection cache, so this is
   * a cache hit, not a second network round trip, once the collection has
   * loaded once.
   */
  async function resolveFieldCode(): Promise<string | undefined> {
    if (field.value) return field.value.code;

    const resolved = await resolveFieldById(fieldId, scopeContext).catch(
      () => undefined
    );
    if (resolved) field.value = resolved;
    return resolved?.code;
  }

  async function captureError(error: unknown): Promise<void> {
    const code = await resolveFieldCode();
    mutationError.value = mapToHeadlessError(rewriteImageErrorKey(error, code));
  }

  async function upload(file: File): Promise<string | undefined> {
    if (!isAddressable(clientId.value) || !fieldId) {
      return Promise.reject(new NotAuthenticatedError());
    }
    // `useUpload().add` is typed for a `string` but forwards its argument
    // opaquely to `FormData.append` — a raw `File` is the correct runtime
    // value here, exactly as legacy appends `customImage.file.fileObj`.
    return uploader
      .add(file as unknown as string)
      .then(hash => hash as string | undefined)
      .catch(async error => {
        await captureError(error);
        throw error;
      });
  }

  async function flush(value?: unknown): Promise<unknown> {
    if (isPendingImageUpload(value)) return upload(value);
    if (typeof value === "string" && !isEmpty(value)) {
      uploader.getImageByHash(value);
    }
    return value;
  }

  return {
    isAvailable: computed(() => isAddressable(clientId.value)),
    field: computed(() => field.value),
    error: computed(() => mutationError.value),
    upload,
    flush,
    remove: () => uploader.remove(),
    uploader
  };
};

export default createClientCustomFieldsServices;
