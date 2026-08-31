/** @internal */
import { computed, ref } from "vue";
import { BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useFeedback } from "../feedback";
import { useQuery, invalidateQueryByKey } from "../query";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  mapVaultAsset,
  mapVaultAssetCreate,
  mapVaultAssetUpdate,
  mapVaultAssets
} from "./client-notes.mappers";
import { useQuerySchema, useSchema } from "./client-notes.schemas";
import { ClientNotesContextTypes } from "./client-notes.types";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useModelParser,
  useValidation,
  mapToHeadlessError,
  NotAuthenticatedError,
  DEBOUNCE_DELAY
} from "../../utils";
import { get, isEmpty, isString } from "lodash-es";
import type { ScopeContext } from "../scope";
import type {
  ClientNoteErrorCapture,
  ClientNoteListQuery,
  ClientNoteManagerMachineServices,
  ClientNoteServices,
  VaultAsset,
  VaultAssetContext,
  VaultAssetModel,
  QueryModel
} from "./client-notes.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IVaultAsset } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module client-notes/client-notes.services
 * @description The ONE services file both halves consume — the collection's
 * `loadList`, the manager's per-asset read and writes, the three
 * no-template-slot members (`decrypt` / `setEncrypted` / `setPinned`), the
 * lookups/parse/validate trio the shared `dataManagerMachine` invokes, and
 * the XState services adapter for the two members (`add`/`update`) that need
 * re-shaping. One factory on purpose: one identity seam, one cache key, one
 * arm-resolution switch.
 *
 * `remove` raises feedback AND lands its failure in the scope's captured
 * error state (`@decision` D6 — the oracle raises a toast on delete but the
 * pin toast is component-raised and the note item raises none; delete is the
 * only mutation both oracle surfaces agree on). No other member here raises
 * feedback; a failure elsewhere rejects for the caller.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientNotes.ts` / `useClientNoteManager.ts` only
 * (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/** The eleven-relation expansion list — `vaultProvider.vue:167-180`. Rides `useUrl`'s URL-param door, never the query schema (row C12). */
const VAULT_RELATIONS = [
  "contract_product",
  "contract_product.product.image",
  "contract_product.product.brand.currency",
  "author_user",
  "author_user.image",
  "author_client",
  "author_client.image",
  "editor_user",
  "editor_user.image",
  "editor_client",
  "editor_client.image"
];

/**
 * The module's base cache key. A row mutation or a manager save invalidates
 * it; that, and nothing else, is how a save refreshes the collection.
 */
export const queryKey: QueryKey = ["client", "notes"];

/**
 * Derives the target client id from the RESOLVED scope — the ONE seam every
 * request-issuing function in this file shares.
 *
 * A `.for('client', id)` context names the client being addressed; with none
 * it falls back to the active session's own client (the self case). This
 * compares the CONTEXT the scope builder resolved, never the actor, so it is
 * not a branch on `ScopeActorTypes.SELF`. A manager scoped
 * `.for('client-note', id)` falls through to the session — correct, because
 * a note context names the entity, not its owner.
 *
 * Under the operator cell ruling (2026-08-27) the `CLIENT` branch is
 * currently unreachable from any live matrix cell and is kept anyway: it is
 * the single point every request gate reads, so restoring a staff cell
 * (rows S1-S6) becomes a matrix edit rather than a rewrite of this seam.
 */
function resolveClientId(scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();

  return computed(() =>
    scopeContext?.type === ClientNotesContextTypes.CLIENT
      ? scopeContext.id
      : activeUser.value?.id
  );
}

/** Reads the brand's `security.ui.allow_vault` gate off the config the brand module already fetches (`brand.services.ts:31`). */
function isVaultEnabled(): boolean {
  return !!useBrand().getConfigValue<boolean>(
    BrandConfigKeys.CLIENT_NOTES_AND_SECRETS_ENABLED
  );
}

/**
 * Resolves true only for an authenticated session with an addressable client
 * AND the brand's vault feature switched on.
 *
 * The module's ONE addressability predicate. Every request gate here calls
 * it, and `createClientNoteServices` exposes its reactive form as
 * `service.isAvailable` so the composable layers READ this function rather
 * than re-deriving the expression. `&&` throughout, never `||` (the
 * `client-phone` D-2 receipt: an `||` guard resolved TRUE for an
 * unauthenticated session with no client id).
 */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();

  return isAuthenticated.value && !!clientId && isVaultEnabled();
}

/**
 * The awaited form of `isAddressable`, for the one-shot read/write functions
 * below. `isVaultEnabled` reads the brand config SYNCHRONOUSLY off whatever
 * is cached, and a freshly-minted scope (collection or manager alike) has no
 * guarantee the config fetch `useBrand()` just kicked off has resolved yet —
 * a call issued immediately after mint can race it and see it still
 * unresolved. Awaiting `ensureConfig` here removes the dependency on
 * incidental timing. `loadOne` uses this too (see its own `@decision`): it is
 * the manager's FIRST boot operation, so there is no earlier call to
 * incidentally absorb the wait.
 */
async function ensureAddressable(clientId?: string): Promise<boolean> {
  await useBrand().ensureConfig(
    BrandConfigKeys.CLIENT_NOTES_AND_SECRETS_ENABLED
  );
  return isAddressable(clientId);
}

/**
 * Resolves true for a staged-import client — gates WRITES only; reads still
 * work (row C15, matching `views/client/account/vault/index.vue:33-35`,
 * where `isDisabled` is passed down as a prop and the list still renders).
 *
 * @decision
 * what: reads `staged_import` off `useActiveSession().useContext().activeUser`
 *   defensively (`get(...)`), rather than a typed field access.
 * why: `session-store`'s `SessionUser` type (`session-store.types.ts`) does
 *   not currently declare or populate `staged_import` — `mapSessionUser`
 *   builds a curated shape with no raw passthrough of the client record.
 *   `session-store` is outside this module's write lane, so this predicate
 *   is wired to the correct field name and the correct seam now, ready the
 *   day `SessionUser` carries it, rather than inventing a second identity
 *   read elsewhere in this module.
 * rejected: fetching a second, full `IClient` record (e.g. via
 *   `client-personal-details`) just to read one flag — an extra request per
 *   AC-15's read-back names none, and a second identity source the module
 *   would then have to keep in sync with `resolveClientId`.
 */
function isStagedImport(): boolean {
  const { activeUser } = useActiveSession().useContext();
  return !!get(activeUser.value, "staged_import");
}

/**
 * COLLECTION — the reactive list query, minted once per scope.
 *
 * The whole request state is the DECLARED query schema: `list()` builds the
 * criteria from it and publishes filters/sort/pagination back on the handle.
 * Takes no params — there is no back door beside the schema (row X5 / AC-29).
 *
 * Adds `with_staged_imports: 1` and the eleven-relation `with=` list through
 * the platform's existing `useUrl` channel — URL scoping, not criteria, so
 * neither ever enters the query schema (`client-phone.services.ts:147`
 * sibling precedent).
 */
function loadList(scopeContext?: ScopeContext): ClientNoteListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);
  const targetUrl = () =>
    useUrl(`clients/${clientId.value}/vault`, {
      with_staged_imports: 1,
      with: VAULT_RELATIONS.join()
    });
  const url = targetUrl();

  return list<IVaultAsset[], VaultAsset[], QueryModel>({
    criteria: { schema: useQuerySchema() },
    queryKey: [...queryKey, { client: clientId }],
    url,
    // Must stay an `async` function — `list()` detects a guard by `isPromise`,
    // which tests for an AsyncFunction.
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        url.pathname = targetUrl().pathname;
        resolve(true);
      }),
    withAccessToken: true,
    select: mapVaultAssets,
    // A recorded 5xx retries 3x on the QueryClient's own default (exponential
    // backoff, ~7s+ total) — longer than most callers' settlement bounds. A
    // flat, short delay (the client-phone/client-address sibling precedent)
    // lets the retry budget exhaust and `isFetched`/`isLoading` settle inside
    // a normal test/UI wait instead of hanging on the default ramp (AC-16).
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable(clientId.value)
  });
}

/**
 * MANAGER — per-asset read. A one-shot promise rather than a reactive query:
 * the manager holds a machine, and its `loading` state awaits this.
 *
 * @decision
 * what: gates on `ensureAddressable` (awaited), not the synchronous
 *   `isAddressable`.
 * why: this is the FIRST thing the manager's `loading` state invokes
 *   (`loadLookups` calls it before anything else), so there is no earlier
 *   round-trip to incidentally give the brand-config fetch time to land.
 *   `isAddressable` reads `isVaultEnabled()` synchronously off whatever is
 *   already cached; on a freshly-minted manager the config fetch this same
 *   `useBrand()` call kicks off cannot possibly have resolved yet, so the
 *   synchronous read always loses that race, `loadOne` rejects before any
 *   request fires, and the shared machine's `onError` lands it in the
 *   terminal `unavailable` state with no transition back out — `isAvailable`
 *   then never becomes true (AC-18/M2). The collection's `enabled`/`guard`
 *   don't have this failure mode because TanStack re-evaluates them
 *   reactively once the config resolves; this one-shot `invoke` does not.
 *   The collection's OWN one-shot door, `useActions().isReady()`
 *   (`useClientNotes.actions.ts`), is not TanStack either and carried the
 *   identical race (B5, fixed 2026-08-28): `whenSessionSettles()` now awaits
 *   this same `ensureConfig` lever before its first settled read, so the
 *   "collection is safe" claim below holds for `enabled`/`guard` only, no
 *   longer as a blanket claim over every one-shot read on this module.
 * rejected: leaving `isAddressable` as-is — correct once *something* has
 *   already awaited the config (e.g. a write following a prior `.for(id)`
 *   read), but wrong at the exact point the manager's OWN boot read calls it.
 */
async function loadOne(
  id?: string,
  scopeContext?: ScopeContext
): Promise<VaultAsset | undefined> {
  if (!id) return undefined;

  const { get: getOne, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!(await ensureAddressable(clientId.value))) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return getOne<IVaultAsset, VaultAsset>({
    queryKey: [...queryKey, { client: clientId.value }, id],
    url: useUrl(`clients/${clientId.value}/vault/${id}`),
    select: mapVaultAsset,
    withAccessToken: true
  });
}

/** MANAGER — create, then invalidate the shared key so the list refetches. */
async function add(
  model: VaultAssetModel,
  scopeContext?: ScopeContext
): Promise<IVaultAsset | undefined> {
  const { post, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!(await ensureAddressable(clientId.value)) || isStagedImport()) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return post<IVaultAsset>({
    mutationKey: [...queryKey, "add"],
    url: useUrl(`clients/${clientId.value}/vault`),
    data: mapVaultAssetCreate(model),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** MANAGER — update, then invalidate the shared key so the list refetches. */
async function update(
  id: string,
  model: Partial<VaultAssetModel>,
  scopeContext?: ScopeContext
): Promise<IVaultAsset | undefined> {
  const { put, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!(await ensureAddressable(clientId.value)) || isStagedImport()) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<IVaultAsset>({
    mutationKey: [...queryKey, id],
    url: useUrl(`clients/${clientId.value}/vault/${id}`),
    data: mapVaultAssetUpdate(model as VaultAssetModel),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/**
 * COLLECTION — delete a vault asset. Raises the oracle's own feedback
 * (`@decision` D6) AND captures the failure into state, so both
 * `useContext().error` / `useMeta().hasError` see it too.
 */
async function remove(
  id: string,
  scopeContext: ScopeContext | undefined,
  captureError: ClientNoteErrorCapture
): Promise<void> {
  const { t } = useI18n();
  const { del, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value) || isStagedImport()) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return del<null>({
    mutationKey: [...queryKey, id, "remove"],
    url: useUrl(`clients/${clientId.value}/vault/${id}`),
    withAccessToken: true
  })
    .then(invalidateQueryByKey(queryKey, { exact: false }))
    .then(() => {
      useFeedback().addSuccess(t("confirm.vault_asset_removed"));
    })
    .catch(error => {
      captureError(error);
      useFeedback().addError({
        title: isString(error)
          ? error
          : error?.title || t("error.client_notes_delete_failed"),
        copy: error?.message,
        data: error?.data
      });
      throw error;
    });
}

/**
 * COLLECTION — pin or unpin a vault asset. Body is exactly `{ pinned }`,
 * mirroring `client-phone`'s `setDefault`'s exactly-`{ default: true }` body.
 */
async function setPinned(
  id: string,
  pinned: boolean,
  scopeContext: ScopeContext | undefined,
  captureError: ClientNoteErrorCapture
): Promise<IVaultAsset | undefined> {
  const { put, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value) || isStagedImport()) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<IVaultAsset>({
    mutationKey: [...queryKey, id, "pinned"],
    url: useUrl(`clients/${clientId.value}/vault/${id}`),
    data: { pinned },
    withAccessToken: true
  })
    .then(invalidateQueryByKey(queryKey, { exact: false }))
    .catch(error => {
      captureError(error);
      throw error;
    });
}

/**
 * COLLECTION — convert a note to a secret or a secret to a note. Body is
 * exactly `{ encrypted }` (`@decision` — see the label-required refusal in
 * `useClientNotes.actions.ts`'s `convert`, `@decision` D4).
 */
async function setEncrypted(
  id: string,
  encrypted: boolean,
  scopeContext: ScopeContext | undefined,
  captureError: ClientNoteErrorCapture
): Promise<IVaultAsset | undefined> {
  const { put, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value) || isStagedImport()) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<IVaultAsset>({
    mutationKey: [...queryKey, id, "encrypted"],
    url: useUrl(`clients/${clientId.value}/vault/${id}`),
    data: { encrypted },
    withAccessToken: true
  })
    .then(invalidateQueryByKey(queryKey, { exact: false }))
    .catch(error => {
      captureError(error);
      throw error;
    });
}

/**
 * Reveal a secret's plaintext — the first no-template-slot capability (row
 * C11 / M2).
 *
 * @decision D8
 * what: goes through `useQuery().request`, the raw envelope-returning
 *   primitive, NOT `get`, and its result is returned directly — never handed
 *   to `select` or a query key.
 * why: `useQuery().get` routes through `queryClient.fetchQuery`
 *   (`useQuery.ts:1016-1043`) and would leave the plaintext sitting in the
 *   TanStack cache. `useQuery().request` (`useQuery.ts:1355-1357`) touches no
 *   cache — the exact `storeData:false` analogue the oracle uses.
 * rejected: `get` with `gcTime: 0` — relies on eviction timing to keep a
 *   secret out of a shared cache; the raw request never puts it there at all.
 */
async function decrypt(
  id: string,
  scopeContext?: ScopeContext
): Promise<string> {
  const { request, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const { data } = await request<IVaultAsset>({
    url: useUrl(`clients/${clientId.value}/vault/${id}/decrypt`),
    withAccessToken: true
  });

  return data?.note ?? "";
}

/**
 * `loading` — seeds the form from the existing record when one is being
 * edited and no model has been resolved yet (mirroring the `client-phone`
 * `loadLookups` shape), and decrypts on open when the seeded asset is a
 * secret not yet revealed this instance (row M2).
 *
 * @decision
 * what: never parses against the RAW `schema` context carries in; always
 *   derives its own `useSchema({encrypted})` first and parses against that.
 * why: `loading` invokes `loadLookups` BEFORE the machine's `setSchemas`
 *   action has run (that only fires on `loading`'s `onDone`), so `context.schema`
 *   is still `undefined` at this point. `useModelParser` early-returns
 *   UNPARSED (`if (!schema?.properties) return values`) when handed an
 *   undefined schema — skipping the compactDeep null-stripping pass every
 *   OTHER model mutation (`parse`, in `available.checking.parsing`) applies.
 *   That produced `model`/`baseModel` with DIFFERENT shapes (baseModel still
 *   carrying `contract_product_id`/`label` as literal `null`, model already
 *   stripped by the next `parse` cycle) — `isDirty`'s `isEqual` read that
 *   shape drift as a change no user made. Deriving the real schema here
 *   applies the identical stripping `parse` will apply moments later, so
 *   `model` and `baseModel` start identically shaped.
 * rejected: reading `context.schema` as-is — correct once the machine has
 *   looped through `available.checking.parsing` at least once, but wrong at
 *   the exact point `loading` calls this.
 */
async function loadLookups(
  { id, model, isRevealed, schema }: VaultAssetContext,
  scopeContext?: ScopeContext
): Promise<Partial<VaultAssetContext>> {
  const emptyModel: VaultAssetModel = {
    note: "",
    encrypted: false,
    pinned: false,
    contract_product_id: null,
    visible_for_client: true
  };

  // A model already parsed onto context (a re-entry into `loading` with a
  // live draft already resolved) is re-parsed as-is — never re-derived from
  // the view model, whose shape (`contractProduct`, `meta.*`) does not match
  // the form model's.
  if (!isEmpty(model)) {
    const safeModel = useModelParser<VaultAssetModel>(
      schema ?? useSchema({ encrypted: model?.encrypted }),
      model,
      emptyModel
    );
    return { model: safeModel, baseModel: safeModel };
  }

  const seed = await loadOne(id, scopeContext);

  if (!seed) {
    const safeModel = useModelParser<VaultAssetModel>(
      schema ?? useSchema({ encrypted: false }),
      {},
      emptyModel
    );
    return { model: safeModel, baseModel: safeModel };
  }

  let note = seed.note;
  let revealed = !!isRevealed;

  if (seed.encrypted && !isRevealed) {
    note = await decrypt(seed.id, scopeContext);
    revealed = true;
  }

  const seededModel: VaultAssetModel = {
    id: seed.id,
    note,
    label: seed.label,
    encrypted: seed.encrypted,
    pinned: seed.pinned,
    contract_product_id: seed.contractProduct?.id ?? null,
    visible_for_client: !seed.meta.isHiddenFromClient
  };

  const safeModel = useModelParser<VaultAssetModel>(
    schema ?? useSchema({ encrypted: seed.encrypted }),
    seededModel,
    seededModel
  );

  return { model: safeModel, baseModel: safeModel, isRevealed: revealed };
}

/**
 * `available.checking.parsing` and `processing.validating`'s parse half —
 * schema-parses the incoming model.
 */
async function parse(
  { schema, baseModel }: VaultAssetContext,
  { data }: AnyEventObject
): Promise<Partial<VaultAssetContext>> {
  const parsedModel = useModelParser<VaultAssetModel>(
    schema,
    get(data, "model", data),
    baseModel
  );

  return { model: parsedModel };
}

/**
 * `available.checking.validating` and `processing.validating`. Rejects with a
 * `DetailedError` carrying the AJV errors as `data`; the shared machine's
 * `setError` lands that in context, where the manager exposes it as
 * `validationErrors`. Nothing here raises feedback.
 */
async function validate({
  schema,
  model
}: Partial<VaultAssetContext> = {}): Promise<VaultAssetModel | undefined> {
  const { t } = useI18n();
  if (!schema) return model;

  const { validate: validateAgainstSchema } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validateAgainstSchema(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.client_notes_validation_failed"),
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

/**
 * Invalidates this module's cache key so the collection refetches. The
 * manager calls it after a settled save rather than reaching into the
 * collection composable's query instance, which belongs to a different scope
 * key and may not exist in this consumer at all (never mint a fresh services
 * instance here, which would drop the scope's resolved client).
 */
async function refresh(): Promise<void> {
  await invalidateQueryByKey(queryKey, { exact: false })(undefined);
}

// -----------------------------------------------------------------------------
// Service Factory

/**
 * Service matrix: maps scopeActor types to their service implementations.
 * The shape is the same armed or armless — an armless module has only the
 * `default:` case, so nothing here or downstream changes when an arm is
 * earned (design.md §9 — the arms determination; every candidate row is a
 * `Dropped-with-Linear-issue` staff row, S1-S6).
 */
function scopedServices(
  scopeActor: ScopeActorTypes,
  _scopeContext?: ScopeContext
): Partial<ClientNoteServices> {
  switch (scopeActor) {
    default:
      return {};
  }
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * Services factory — the concrete actor and the context it acts upon arrive
 * first, at construction. `useClientNotes.ts` calls it once and so does
 * `useClientNoteManager.ts`, each with ITS OWN resolved scope, so the two
 * instances share no mutable state.
 */
export const createClientNoteServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ClientNoteServices => {
  const mutationError = ref<ResponseError | undefined>(undefined);
  const clientId = resolveClientId(scopeContext);

  const captureError: ClientNoteErrorCapture = error => {
    mutationError.value = mapToHeadlessError(error);
  };

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    isDisabled: computed(() => isStagedImport()),
    error: computed(() => mutationError.value),
    loadList: () => loadList(scopeContext),
    loadOne: id => loadOne(id, scopeContext),
    add: model => add(model, scopeContext),
    update: (id, model) => update(id, model, scopeContext),
    remove: id => remove(id, scopeContext, captureError),
    setPinned: (id, pinned) =>
      setPinned(id, pinned, scopeContext, captureError),
    setEncrypted: (id, encrypted) =>
      setEncrypted(id, encrypted, scopeContext, captureError),
    decrypt: id => decrypt(id, scopeContext),
    loadLookups: context => loadLookups(context, scopeContext),
    parse,
    validate,
    refresh,
    ...scopedServices(scopeActor, scopeContext)
  };
};

export default createClientNoteServices;

// -----------------------------------------------------------------------------
// Machine-Ready Services (manager half)

/**
 * Adapts the ALREADY-SCOPED services object into the two members of the
 * XState services map the shared `dataManagerMachine` invokes that need
 * re-shaping — `add` / `update` take a `VaultAssetContext`, not a model
 * directly. `loadLookups` / `parse` / `validate` pass straight through:
 * their signatures already match what the machine invokes.
 *
 * The adapter takes `service` as an argument rather than minting its own: the
 * scope, and therefore the target client, is resolved ONCE in
 * `useClientNoteManager.ts` and threaded in. An adapter that built its own
 * services instance would silently drop the scope's retarget.
 * @internal
 */
export const useClientNoteManagerServices = (
  service: ClientNoteServices
): ClientNoteManagerMachineServices => ({
  loadLookups: service.loadLookups,
  parse: service.parse,
  validate: service.validate,

  /** `processing.adding` — entered when the machine's `isNew` guard passes. */
  add: ({ model }: VaultAssetContext) => {
    if (!model) {
      return Promise.reject(
        new DetailedError(
          useI18n().t("error.client_notes_not_available"),
          responseCodes.No_Content,
          ErrorOrigin.Headless,
          { model }
        )
      );
    }
    return service.add(model);
  },

  /** `processing.updating` — entered when the context already carries an id. */
  update: ({ id, model }: VaultAssetContext) => {
    if (!id || !model) {
      return Promise.reject(
        new DetailedError(
          useI18n().t("error.client_notes_not_available"),
          responseCodes.No_Content,
          ErrorOrigin.Headless,
          { id, model }
        )
      );
    }
    return service.update(id, model);
  }
});
