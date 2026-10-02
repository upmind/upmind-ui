/** @internal */
import { computed, ref } from "vue";
import {
  CustomFieldsMajorTypes,
  ImageObjectTypes
} from "@upmind-automation/types";
import { useQuery, invalidateQueryByKey } from "../query";
import { ScopeActorTypes, ScopeContextPatterns } from "../scope/scope.types";
import { resolveContextDeclarations } from "../scope/scope.utils";
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
  CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX,
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
import {
  filter,
  includes,
  isArray,
  isEmpty,
  isEqual,
  map,
  sortBy
} from "lodash-es";
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
import type { QueryKey } from "@tanstack/vue-query";
import type { ICustomField } from "@upmind-automation/types";
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
 * The catalogues a scope may SELECT, read off the matrix itself so the two can
 * never drift: every SELECTOR member the CLIENT cell declares, and nothing
 * else. `resolveContextDeclarations` is the scope platform's ONE reading of a
 * cell — this module does not learn a second one.
 *
 * A function, not a module-level const: `scope.utils` imports `session-store`,
 * so calling into it while THIS module is still evaluating re-enters it
 * mid-initialisation (see `CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX`'s own
 * `@decision`). Called per resolution instead, over a three-member cell.
 */
function selectableCatalogues(): string[] {
  return map(
    filter(
      resolveContextDeclarations(
        CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX[ScopeActorTypes.CLIENT]
      ),
      { pattern: ScopeContextPatterns.SELECTOR }
    ),
    "type"
  );
}

/**
 * Resolves WHICH catalogue this scope reads — the catalogue a SELECTOR context
 * names, or the client catalogue when the scope names none. This is the
 * `filter[object_type]` value and the cache axis, both.
 *
 * Only a declared SELECTOR answers. The `CLIENT` retarget context and the image
 * half's `FIELD` context each name an ENTITY, not a catalogue, so both fall to
 * the client default: without the membership test a `.for(FIELD, id)` scope
 * would ask the API for `filter[object_type]=field`, a catalogue it has not got.
 */
function resolveCatalogue(scopeContext?: ScopeContext): string {
  const type = scopeContext?.type;
  return type && includes(selectableCatalogues(), type)
    ? type
    : CustomFieldsMajorTypes.CLIENT;
}

/**
 * The catalogue axis as a cache-key segment, or `undefined` at the client
 * default — the ONE normalisation `loadList`'s query key and
 * {@link catalogueQueryKey} both fold through.
 */
function catalogueKeySegment(scopeContext?: ScopeContext): string | undefined {
  const catalogue = resolveCatalogue(scopeContext);
  return catalogue === CustomFieldsMajorTypes.CLIENT ? undefined : catalogue;
}

/**
 * The key `invalidate` / `reset` / `refresh` scope onto — this catalogue's
 * rows and no sibling's.
 *
 * NOT the key `loadList` registers under: that one also carries `client` and
 * `brand`, which stay unconstrained here so one press still reaches every
 * client and criteria variant OF THIS CATALOGUE under `exact: false`. The
 * default catalogue omits `objectType` from `loadList`'s key entirely (AC-2),
 * and an explicit `undefined` here still matches that under TanStack's partial
 * equality, while another catalogue's `objectType` string never does — so the
 * two can no longer prefix-match one another.
 */
function catalogueQueryKey(scopeContext?: ScopeContext): QueryKey {
  return [...queryKey, { objectType: catalogueKeySegment(scopeContext) }];
}

/**
 * Derives the target client id from the RESOLVED scope — the ONE seam every
 * request-issuing function in this file shares, and the fix for a services
 * layer that hardwires the session's client for every call.
 *
 * A `.for('client', id)` context names the client being addressed; with none
 * it falls back to the active session's own client (the self case). A `FIELD`
 * context (the image half) deliberately falls through to the session too — a
 * field context names the entity, not its owner. This compares the CONTEXT the
 * scope builder resolved, never the actor, so it is not a branch on
 * `ScopeActorTypes.SELF`. ADR-001 amendment 2026-09-15: the client retarget
 * rides in a `.for()` context; `.withId()` carries a record id, never the owner.
 *
 * The `&& scopeContext.id` is load-bearing: the context id became OPTIONAL in
 * FE-3239, so an id-less context of this type would otherwise resolve
 * `undefined` AS the identity instead of falling through. The guard now holds
 * what the type used to hold.
 */
function resolveClientId(scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();

  return computed(() =>
    scopeContext?.type === ClientCustomFieldsContextTypes.CLIENT &&
    scopeContext.id
      ? scopeContext.id
      : activeUser.value?.id
  );
}

/**
 * Resolves the field id out of a `FIELD`-context scope; `undefined` for the
 * collection's own `CLIENT` scope, which has none.
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
 * COLLECTION — the reactive list query, minted once per scope.
 *
 * The KEY carries the client id as a REF: vue-query deep-unwraps refs inside a
 * query key, so it arriving or changing late re-derives the options into a
 * DIFFERENT cache entry (AC-1). `enabled` and `guard` hold the unaddressable
 * entry shut. The API scopes the read by the access token, so no `brand_id`
 * rides the request or the key.
 */
function loadList(scopeContext?: ScopeContext): ClientCustomFieldsListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);
  const catalogue = resolveCatalogue(scopeContext);
  const catalogueSegment = catalogueKeySegment(scopeContext);

  // URL SCOPING, not criteria: this says WHICH catalogue is being read. It is
  // not a filter a consumer may change, so it never enters the query model —
  // parity Q5 / AC-32.
  const targetUrl = () =>
    useUrl("custom_fields", {
      "filter[object_type]": catalogue
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
    // The catalogue axis is OMITTED at the client default, never written as
    // `objectType: undefined` — the default consumer's key must serialise
    // byte-identically to what it did before the axis existed (AC-2). Two
    // catalogues on the same client would otherwise collide on one cache entry
    // and the second would be served the first's rows.
    queryKey: [
      ...queryKey,
      {
        client: clientId,
        ...(catalogueSegment ? { objectType: catalogueSegment } : {})
      }
    ],
    url,
    // `enabled:` only stops the query starting; this rejects a forced
    // `refetch()` on a dead or unaddressable scope with the typed error instead
    // of a raw request. Must stay an `async` function — `list()` detects a
    // guard by `isPromise`.
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
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
    enabled: () => isAddressable(clientId.value)
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

/** Invalidates this catalogue's cache key so the collection refetches. */
async function refresh(scopeContext?: ScopeContext): Promise<void> {
  await invalidateQueryByKey(catalogueQueryKey(scopeContext), {
    exact: false
  })(undefined);
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
    queryKey: catalogueQueryKey(scopeContext),
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    error: computed(() => mutationError.value),
    loadList: () => loadList(scopeContext),
    resolveFieldById: id => resolveFieldById(id, scopeContext),
    uploadFieldImage,
    flushImages: model => flushImages(model, scopeContext),
    validate,
    refresh: () => refresh(scopeContext),
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
