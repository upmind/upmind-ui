/** @internal */
import { computed, ref } from "vue";
import { useQuery, invalidateQueryByKey } from "../query";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import { mapEmail, mapEmails, mapIEmail } from "./client-email.mappers";
import { useSchema, useQuerySchema } from "./client-email.schemas";
import { ClientEmailsContextTypes } from "./client-email.types";
import {
  useTime,
  ErrorOrigin,
  useValidation,
  DetailedError,
  responseCodes,
  useCollection,
  useModelParser,
  mapToHeadlessError,
  NotAuthenticatedError,
  DEBOUNCE_DELAY
} from "../../utils";
import { get, isArray, isEmpty, omitBy } from "lodash-es";
import type { ScopeContext } from "../scope";
import type {
  ClientEmailErrorCapture,
  ClientEmailListQuery,
  ClientEmailManagerMachineServices,
  ClientEmailServices,
  Email,
  EmailContext,
  EmailModel,
  QueryModel
} from "./client-email.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IEmail } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module client-email/client-email.services
 * @description The ONE services file both halves consume — the collection's
 * `loadList`, the manager's per-email read and writes, and the XState services
 * adapter the shared `dataManagerMachine` invokes. One factory on purpose: one
 * identity seam, one cache key, one arm-resolution switch.
 *
 * Nothing here raises feedback. A failure rejects for the caller and lands in
 * the scope's own error state, which the composables expose.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientEmails.ts` / `useClientEmailManager.ts` only
 * (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/**
 * The module's base cache key. The manager's writes invalidate it; that, and
 * nothing else, is how a save refreshes the collection.
 */
export const queryKey: QueryKey = ["client", "emails"];

/** The floor every form model is parsed against. */
const baseModel: EmailModel = { email: null };

/**
 * Derives the target client id from the RESOLVED scope — the ONE seam every
 * request-issuing function in this file shares, and the fix for a services
 * layer that hardwires the session's client for every call.
 *
 * A `.for('client', id)` context names the client being addressed; with none it
 * falls back to the active session's own client (the self case). This compares
 * the CONTEXT the scope builder resolved, never the actor, so it is not a
 * branch on `ScopeActorTypes.SELF`. A manager scoped `.for('email', id)` falls
 * through to the session — correct, because an email context names the entity,
 * not its owner.
 */
function resolveClientId(scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();

  return computed(() =>
    scopeContext?.type === ClientEmailsContextTypes.CLIENT
      ? scopeContext.id
      : activeUser.value?.id
  );
}

/**
 * Resolves true only for an authenticated session with an addressable client.
 *
 * The module's ONE addressability predicate. Every request gate here calls it,
 * and `createClientEmailServices` exposes its reactive form as
 * `service.isAvailable` so the composable layers READ this function rather than
 * re-deriving the expression — a flag the consumer renders and the gate the
 * wire enforces cannot drift apart if there is only one of them.
 */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();

  return isAuthenticated.value && !!clientId;
}

/**
 * COLLECTION — the reactive list query, minted once per scope.
 *
 * Minted once, but the target client can resolve AFTER construction — an
 * authenticated cold boot carries no `activeUser` until `/self` lands — so
 * neither half of the request may snapshot the id at mint time.
 *
 * The KEY carries the REF, as `list()` already does for sort, filters and
 * locale: vue-query deep-unwraps refs inside a query key, so a late id
 * re-derives the options into a DIFFERENT cache entry. `enabled` and `guard`
 * hold the unaddressable entry shut, so it is never written to and a late
 * arrival cannot inherit a poisoned one.
 *
 * The URL is re-pointed in the `guard`, the last hook before `list()` builds
 * the request: `list()` closes over the URL object it is handed and never
 * re-reads it, so this is what targets the id resolved at FIRE time.
 *
 * The whole request state is the DECLARED query schema: `list()` constructs the
 * criteria from it, owns filters/sort/pagination, and publishes them back on the
 * handle. Spelling any of the three raw beside `criteria` is a compile error.
 */
function loadList(scopeContext?: ScopeContext): ClientEmailListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);
  const targetUrl = () => useUrl(`clients/${clientId.value}/emails`);
  const url = targetUrl();

  return list<IEmail[], Email[], QueryModel>({
    criteria: { schema: useQuerySchema() },
    queryKey: [...queryKey, { client: clientId }],
    url,
    // `enabled:` only stops the query starting; this rejects a forced
    // `refetch()` on a dead or unaddressable session with the typed error
    // instead of a raw 401. Must stay an `async` function — `list()` detects a
    // guard by `isPromise`, which tests for an AsyncFunction.
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
    select: mapEmails,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable(clientId.value)
  });
}

/**
 * MANAGER — per-entity read. A one-shot promise rather than a reactive query:
 * the manager holds a machine, and its `loading` state awaits this.
 */
async function loadOne(
  id?: IEmail["id"],
  scopeContext?: ScopeContext
): Promise<Email | undefined> {
  if (!id) return undefined;

  const { get: getOne, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return getOne<IEmail, Email>({
    queryKey: [...queryKey, { client: clientId.value }, id],
    url: useUrl(`clients/${clientId.value}/emails/${id}`),
    select: mapEmail,
    withAccessToken: true
  });
}

/** MANAGER — create, then invalidate the shared key so the list refetches. */
async function add(
  model: EmailModel,
  scopeContext?: ScopeContext
): Promise<IEmail | undefined> {
  const { post, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return post<IEmail>({
    mutationKey: [...queryKey, "add"],
    url: useUrl(`clients/${clientId.value}/emails`),
    data: mapIEmail(model),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** MANAGER — update, then invalidate the shared key so the list refetches. */
async function update(
  id: IEmail["id"],
  model: EmailModel,
  scopeContext?: ScopeContext
): Promise<IEmail | undefined> {
  const { put, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<IEmail>({
    mutationKey: [...queryKey, id],
    url: useUrl(`clients/${clientId.value}/emails/${id}`),
    data: mapIEmail(model, { isExisting: true }),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/**
 * Find-or-create. ONE body, two call sites: the collection's `ensure` action
 * and the machine's `add` service both resolve here, so a form save and a
 * programmatic add cannot drift.
 */
async function ensure(
  model: EmailModel,
  scopeContext: ScopeContext | undefined,
  captureError: ClientEmailErrorCapture
): Promise<Email> {
  const { t } = useI18n();
  const clientId = resolveClientId(scopeContext);

  // Checked here as well as by the list `guard`: an unaddressable session
  // leaves the query DISABLED, and a disabled query's `promise` never settles,
  // so the await below would hang rather than reject.
  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const query = loadList(scopeContext);
  await query.promise.value.finally();

  const { findOne } = useCollection<Email>(
    isArray(query.data.value) ? query.data.value : []
  );

  // Emails match on the id OR the address itself, so an empty member of the
  // model must not narrow the search.
  const found = findOne(omitBy(model, isEmpty) as Partial<Email>);
  if (found) return found;

  return add(model, scopeContext)
    .then(raw => {
      if (isEmpty(raw)) {
        throw new DetailedError(
          t("error.client_email_not_available"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          { model }
        );
      }
      return mapEmail(raw as IEmail);
    })
    .catch(error => {
      captureError(error);
      throw error;
    });
}

/**
 * COLLECTION — delete a deletable address.
 *
 * The auth precondition is checked here rather than passed as `guard:`, which
 * `useQuery().mutate()` accepts but never awaits (only `list()` honours it) —
 * a guard handed to a mutation issues the request anyway.
 */
async function remove(
  id: IEmail["id"],
  scopeContext: ScopeContext | undefined,
  captureError: ClientEmailErrorCapture
): Promise<void> {
  const { del, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return del<null>({
    mutationKey: [...queryKey, id, "remove"],
    url: useUrl(`clients/${clientId.value}/emails/${id}`),
    withAccessToken: true
  })
    .then(invalidateQueryByKey(queryKey, { exact: false }))
    .then(() => undefined)
    .catch(error => {
      captureError(error);
      throw error;
    });
}

/** COLLECTION — promote a verified address to the client's default. */
async function setDefault(
  id: IEmail["id"],
  scopeContext: ScopeContext | undefined,
  captureError: ClientEmailErrorCapture
): Promise<IEmail | undefined> {
  const { put, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<IEmail>({
    mutationKey: [...queryKey, id, "default"],
    url: useUrl(`clients/${clientId.value}/emails/${id}`),
    data: { default: true },
    withAccessToken: true
  })
    .then(invalidateQueryByKey(queryKey, { exact: false }))
    .catch(error => {
      captureError(error);
      throw error;
    });
}

/** COLLECTION — resend the verification email for an address. */
async function verify(
  id: IEmail["id"],
  scopeContext: ScopeContext | undefined,
  captureError: ClientEmailErrorCapture
): Promise<void> {
  const { patch, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return patch<null>({
    mutationKey: [...queryKey, id, "verify"],
    url: useUrl(`clients/${clientId.value}/emails/${id}/send_verify`),
    withAccessToken: true
  })
    .then(invalidateQueryByKey(queryKey, { exact: false }))
    .then(() => undefined)
    .catch(error => {
      captureError(error);
      throw error;
    });
}

/**
 * Schema validation. Rejects with a `DetailedError` carrying the AJV errors as
 * `data`; the shared machine's `setError` lands that in context, where the
 * manager exposes it as `validationErrors`. Nothing here raises feedback.
 */
async function validate(model?: EmailModel): Promise<EmailModel | undefined> {
  const { t } = useI18n();
  const schema = useSchema();
  const { validate: validateAgainstSchema } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validateAgainstSchema(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.client_email_validation_failed"),
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
 * Invalidates this module's cache key so the collection refetches. The manager
 * calls it after a settled save rather than reaching into the collection
 * composable's query instance, which belongs to a different scope key and may
 * not exist in this consumer at all.
 */
async function refresh(): Promise<void> {
  await invalidateQueryByKey(queryKey, { exact: false })(undefined);
}

// -----------------------------------------------------------------------------
// Service Factory

/**
 * Service matrix: maps scopeActor types to their service implementations. The
 * shape is the same armed or armless — an armless module has only the
 * `default:` case, so nothing here or downstream changes when an arm is earned.
 */
function scopedServices(
  scopeActor: ScopeActorTypes,
  _scopeContext?: ScopeContext
): Partial<ClientEmailServices> {
  switch (scopeActor) {
    default:
      return {};
  }
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * Services factory — the concrete actor and the context it acts upon arrive
 * first, at construction. `useClientEmails.ts` calls it once and so does
 * `useClientEmailManager.ts`, each with ITS OWN resolved scope, so the two
 * instances share no mutable state.
 */
export const createClientEmailServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ClientEmailServices => {
  const mutationError = ref<ResponseError | undefined>(undefined);
  const clientId = resolveClientId(scopeContext);

  const captureError: ClientEmailErrorCapture = error => {
    mutationError.value = mapToHeadlessError(error);
  };

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    error: computed(() => mutationError.value),
    loadList: () => loadList(scopeContext),
    loadOne: id => loadOne(id, scopeContext),
    add: model => add(model, scopeContext),
    update: (id, model) => update(id, model, scopeContext),
    ensure: model => ensure(model, scopeContext, captureError),
    remove: id => remove(id, scopeContext, captureError),
    setDefault: id => setDefault(id, scopeContext, captureError),
    verify: id => verify(id, scopeContext, captureError),
    validate,
    refresh,
    ...scopedServices(scopeActor, scopeContext)
  };
};

// -----------------------------------------------------------------------------
// Machine-Ready Services (manager half)

/**
 * Parses a form model and floors it at the base model.
 *
 * `useModelParser` compacts null members away, so an untouched form parses to
 * `{}` — which is NOT the base model. Left there, a fresh draft reports itself
 * dirty against `{ email: null }` before a key is pressed and `clear()` can
 * never get back to it. Re-applying the floor on both sides of the parse is
 * what makes "untouched" and "the base model" the same value.
 */
function parseModel(
  schema: EmailContext["schema"],
  values?: Partial<EmailModel>
): EmailModel {
  return {
    ...baseModel,
    ...useModelParser<EmailModel>(schema, { ...baseModel, ...values })
  };
}

/**
 * Adapts the ALREADY-SCOPED services object into the XState services map the
 * shared `dataManagerMachine` invokes.
 *
 * The adapter takes `service` as an argument rather than minting its own: the
 * scope, and therefore the target client, is resolved ONCE in
 * `useClientEmailManager.ts` and threaded in. An adapter that built its own
 * services instance would silently drop the scope's retarget.
 * @internal
 */
export const useClientEmailManagerServices = (
  service: ClientEmailServices
): ClientEmailManagerMachineServices => ({
  /**
   * `loading` — the context patch the form starts from, and the manager's only
   * read of the email it edits. Seeding `model` and `baseModel` to the same
   * parsed value is what makes `isDirty` read false on a freshly-opened form.
   * `schema` is still undefined here; `setSchemas` runs on this invoke's
   * `onDone`, and the model is re-parsed by `parse` on the first SET.
   */
  loadLookups: async ({ id, model, schema }: EmailContext) => {
    const seed = isEmpty(model) ? await service.loadOne(id) : model;
    const safeModel = parseModel(
      schema,
      seed ? { id: seed.id, email: seed.email ?? null } : undefined
    );

    return { model: safeModel, baseModel: safeModel };
  },

  /** `available.checking.parsing` — schema-parse whatever the SET event carried. */
  parse: async ({ schema }: EmailContext, { data }: AnyEventObject) => ({
    model: parseModel(schema, get(data, "model", data))
  }),

  /** `available.checking.validating` and `processing.validating`. */
  validate: ({ model }: EmailContext) => service.validate(model),

  /**
   * `processing.adding` — entered when the machine's `isNew` guard passes.
   * Wired to find-or-create, so saving an address the collection already holds
   * resolves the existing record instead of creating a duplicate.
   */
  add: ({ model }: EmailContext) =>
    model
      ? service.ensure(model)
      : Promise.reject(
          new DetailedError(
            useI18n().t("error.client_email_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { model }
          )
        ),

  /** `processing.updating` — entered when the context already carries an id. */
  update: ({ id, model }: EmailContext) =>
    id && model
      ? service.update(id, model)
      : Promise.reject(
          new DetailedError(
            useI18n().t("error.client_email_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { id, model }
          )
        )
});

export default createClientEmailServices;
