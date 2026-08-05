/** @internal */
// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-services.md` (service-authoring, actor-split
 * decision) + `code-composables.companion.md` "Variance law" clauses 2/3. A
 * disagreement between this skeleton, its worked example, and the doctrine is
 * a surfaced finding, never silently resolved toward either.
 *
 * HYBRID VARIANT — ONE services file feeds BOTH composables. The collection
 * (`useModules.ts`) consumes `loadList`; the manager (`useModuleManager.ts`)
 * consumes `loadOne` / `add` / `update` / `ensure` / `validate` / `refresh`
 * through the `useModuleManagerServices` adapter at the bottom of this file.
 * They share one factory on purpose: one identity seam (`resolveClientId`), one
 * cache key, one arm-resolution switch.
 */

import { computed } from "vue";
import { useQuery, invalidateQueryByKey } from "../query";
import { ScopeActorTypes } from "../scope";
import { useActiveSession } from "../session-store";
import {
  mapModuleItem,
  mapModuleItems,
  mapModuleRequestData
} from "./module.mappers";
import { useSchema } from "./module.schemas";
import { ModuleContextTypes } from "./module.types";
import {
  useTime,
  useCollection,
  useModelParser,
  useValidation,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  NotAuthenticatedError,
  DEBOUNCE_DELAY
} from "../../utils";
import { isEmpty, omitBy } from "lodash-es";
import type { QueryParams } from "../query";
import type { ScopeContext } from "../scope";
import type {
  ModuleContext,
  ModuleItem,
  ModuleManagerMachineServices,
  ModuleModel,
  ModuleServices,
  ModuleWireItem
} from "./module.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module module/module.services
 * @description Module TanStack Query services (list + per-entity read +
 * mutations) plus the shared machine's services adapter. Shared services are
 * defined here, actor-specific services in their respective files. Uses a
 * matrix lookup pattern for scalable service resolution.
 *
 * List data is mapped here via `select`, never in `useModules.context.ts`
 * (`code-composables.md` Part B "TanStack Query variant").
 *
 * WARNING: Do not import directly. Resolve via `useModules.ts` /
 * `useModuleManager.ts` only.
 */
// -----------------------------------------------------------------------------
// Shared Services
// These are identical for all scopeActor types

/**
 * Base cache key. Exported so an arm overriding `loadList` extends the SAME
 * key rather than inventing a parallel one — two arms must never collide in
 * the cache, and must never diverge from the shared base. The manager's
 * mutations invalidate this same key: that, and nothing else, is how a save in
 * the manager refreshes the collection.
 */
export const queryKey = ["module", "items"];

/**
 * Derives the target client id from the RESOLVED scope, not a raw session
 * reach-in — the ONE seam every request-issuing function in this file shares.
 *
 * A `.for('client', id)` context names the client being addressed; with none it
 * falls back to the active session's own client id (the self case, which
 * `activeUser` always supplies). This checks the CONTEXT the scope builder
 * resolved, never the actor, so it is not a branch on `ScopeActorTypes.SELF`
 * (clause 4 / `scope-based/no-self-branch`).
 *
 * BOTH matrices flow through here: `ModuleContextTypes.CLIENT` and
 * `ModuleManagerContextTypes.CLIENT` are the same enum VALUE
 * (`AccessRoleTypes.CLIENT`), so a manager scoped `.for('client', id)` is
 * retargeted by this comparison too, while a manager scoped
 * `.for('module-item', id)` falls through to the session — correct, because an
 * item context names the entity, not its owner.
 *
 * A services file that ignores `scopeContext` and hardwires `activeUser` for
 * every call IS the FE-2824 defect. Do not "simplify" this away.
 */
function resolveClientId(scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();

  return computed(() =>
    scopeContext?.type === ModuleContextTypes.CLIENT
      ? scopeContext.id
      : activeUser.value?.id
  );
}

/**
 * Shared list fetch — the canonical services-layer override candidate. The URL,
 * the auth scope and the cache key are all actor-dependent the moment a second
 * actor can read this collection, so an arm overriding `loadList` is the
 * expected shape, not an exception. See `module.services.{actor}.ts`.
 */
function loadList(
  params: Partial<QueryParams<ModuleWireItem[], ModuleItem[]>> = {
    pagination: { limit: 0 }
  },
  scopeContext?: ScopeContext
) {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return list<ModuleWireItem[], ModuleItem[]>({
    ...params,
    queryKey: [...queryKey, { client: clientId.value }],
    url: useUrl(`clients/${clientId.value}/module-items`),
    // `enabled:` below only stops the query starting; this rejects a `refetch()`
    // on a dead session with the typed error every collection surfaces, instead
    // of a raw 401 (`client-phone/client-phone.services.ts:42-50`).
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value && !!clientId.value) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    withAccessToken: true,
    select: mapModuleItems,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAuthenticated.value && !!clientId.value
  });
}

/**
 * MANAGER SERVICE — per-entity read. The manager seeds its model from the
 * collection when one is already loaded, and from THIS when it is not (a
 * deep-linked edit form, or a manager mounted with no collection in the tree).
 *
 * Uses the async `get` rather than `list`: the manager holds a machine, not a
 * reactive query, so a one-shot promise is the right seam — the machine's
 * `loading` state awaits it.
 */
async function loadOne(
  id?: ModuleItem["id"],
  scopeContext?: ScopeContext
): Promise<ModuleItem | undefined> {
  if (!id) return undefined;

  const { isAuthenticated } = useActiveSession().useMeta();
  const { get, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAuthenticated.value || !clientId.value) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return get<ModuleWireItem, ModuleItem>({
    queryKey: [...queryKey, { client: clientId.value }, id],
    url: useUrl(`clients/${clientId.value}/module-items/${id}`),
    select: mapModuleItem,
    withAccessToken: true
  });
}

/** MANAGER SERVICE — create. Invalidates the shared key so the list refetches. */
async function add(
  model: ModuleModel,
  scopeContext?: ScopeContext
): Promise<ModuleWireItem | undefined> {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { post, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAuthenticated.value || !clientId.value) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return post<ModuleWireItem>({
    mutationKey: [...queryKey, "add"],
    url: useUrl(`clients/${clientId.value}/module-items`),
    data: mapModuleRequestData(model),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** MANAGER SERVICE — update. Invalidates the shared key so the list refetches. */
async function update(
  id: ModuleItem["id"],
  model: ModuleModel,
  scopeContext?: ScopeContext
): Promise<ModuleWireItem | undefined> {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { put, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAuthenticated.value || !clientId.value) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<ModuleWireItem>({
    mutationKey: [...queryKey, id],
    url: useUrl(`clients/${clientId.value}/module-items/${id}`),
    data: mapModuleRequestData(model),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/**
 * MANAGER SERVICE — find-or-create. Delete this member (with its contract in
 * `module.types.ts` and its `add:` wiring in the adapter below, which then
 * points at `service.add`) unless this module's parity table actually names an
 * idempotent create; a plain `add` is the default.
 */
async function ensure(
  model: ModuleModel,
  scopeContext?: ScopeContext
): Promise<ModuleItem> {
  const query = loadList(undefined, scopeContext);
  await query.promise.value.finally();

  const { findOne } = useCollection<ModuleItem>(query.data);
  const found = findOne(omitBy(model, isEmpty) as Partial<ModuleItem>);
  if (found) return found;

  return add(model, scopeContext).then(raw => {
    if (isEmpty(raw)) {
      throw new DetailedError(
        "Module item not available",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        { model }
      );
    }
    return mapModuleItem(raw as ModuleWireItem);
  });
}

/**
 * MANAGER SERVICE — schema validation. Rejects with a `DetailedError` carrying
 * the AJV errors as `data`; the shared machine's `setError` action lands that
 * in context, which `useModuleManager.context.ts` exposes as
 * `validationErrors`. NOTHING here raises feedback — the headless layer never
 * fires errors (no `useFeedback`, no toast, at any layer of this module).
 */
async function validate(model?: ModuleModel): Promise<ModuleModel | undefined> {
  const schema = useSchema();
  const { validate: validateAgainstSchema } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validateAgainstSchema(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          "Module item validation failed",
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
 * SHARED SERVICE — invalidate this module's cache key. The manager calls it
 * after a settled save so the collection refetches, without either composable
 * holding a reference to the other's scoped instance.
 */
async function refresh(): Promise<void> {
  await invalidateQueryByKey(queryKey, { exact: false })(undefined);
}

/**
 * Shared domain mutation — the wire call `useModules.actions.ts`'s `login`
 * awaits, and the one the actions arm's own `login` override also drives
 * (`useModules.actions.{actor}.ts`): that override diverges in the ACTION's
 * composition, not in this call.
 */
function login(model: Record<string, unknown>): Promise<unknown> {
  const { post, useUrl } = useQuery();
  // Replace with the request this module's parity table names.
  return post({
    url: useUrl("module-items/login"),
    data: model,
    withAccessToken: true
  });
}

// -----------------------------------------------------------------------------
// Service Factory

/**
 * Service matrix: maps scopeActor types to their service implementations.
 * Actor-specific services are created via factories, shared services are merged in.
 * The shape is the same armed or armless — an armless module has only the
 * `default:` case, so nothing here or downstream changes when an arm is earned.
 */
function scopedServices(
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): Partial<ModuleServices> {
  switch (scopeActor) {
    // case ScopeActorTypes.CLIENT:
    //   return createClientModuleServices(scopeContext) ;
    default:
      // Empty because this module is armless: no actor has earned an arm yet, so
      // there is nothing to merge over the shared members. Only arm-specific
      // members ever appear here — the shared ones are spread in below.
      return {};
  }
}

// -----------------------------------------------------------------------------
// Scope-Ready Services
// These wrappers delegate to the correct implementation

/**
 * Services factory — same shape as the other three layers: the concrete actor
 * and the context it acts upon arrive first, at construction, and `useModules.ts`
 * calls it once. `useModuleManager.ts` calls it once too, with ITS OWN resolved
 * scope — so a manager opened `.for('client', id)` issues its writes against
 * that client while a collection opened `.as('self')` reads the session's own,
 * with no shared mutable state between the two instances.
 */
export const createModuleServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ModuleServices => ({
  queryKey,
  clientId: resolveClientId(scopeContext),
  loadList: params => loadList(params, scopeContext),
  loadOne: id => loadOne(id, scopeContext),
  add: model => add(model, scopeContext),
  update: (id, model) => update(id, model, scopeContext),
  ensure: model => ensure(model, scopeContext),
  validate,
  refresh,
  login,
  ...scopedServices(scopeActor, scopeContext)
});

// -----------------------------------------------------------------------------
// Machine-Ready Services (manager half)

/**
 * Adapts the ALREADY-SCOPED services object into the XState services map the
 * shared `dataManagerMachine` invokes. Keys are the machine's own `invoke.src`
 * names — read `data-manager/data-manager.machine.ts` before adding or removing
 * one; a missing key is a runtime crash on entering that state, not a type
 * error.
 *
 * The adapter takes `service` as an argument rather than calling
 * `createModuleServices()` itself: the scope (and therefore the target client)
 * is resolved ONCE in `useModuleManager.ts` and threaded in. An adapter that
 * minted its own services instance would silently drop `.for('client', id)` —
 * the FE-2824 shape, one layer down.
 *
 * @precedent the recovered `client-email` tree's `useClientEmailManagerServices`
 * — same role, but it closed over module-level functions that read the session
 * directly instead of taking the scoped instance.
 * @internal
 */
export const useModuleManagerServices = (
  service: ModuleServices
): ModuleManagerMachineServices => ({
  /**
   * `loading` — the context patch the form starts from, and the manager's ONLY
   * read of the entity it edits: `loadOne` runs here, not at construction, so
   * an edit form deep-linked with no collection in the tree still populates.
   * A model already in context (a `.fresh()` draft, or a caller-supplied seed)
   * wins over the fetch.
   *
   * Add the module's real lookups to the returned patch
   * (`{ lookups: { ... } }`); a module with none still needs this member,
   * because the machine cannot leave `loading` without it. Seeding `model` and
   * `baseModel` to the same parsed value is what makes `isDirty` read false on
   * a freshly-opened form.
   *
   * `schema` is still undefined at this point — `setSchemas` runs on this
   * invoke's `onDone`. That is the shared machine's ordering, not a bug here:
   * `useModelParser` tolerates it, and the model is re-parsed by `parse` on the
   * first SET.
   */
  loadLookups: async ({ id, model, schema }: ModuleContext) => {
    const seed = isEmpty(model) ? await service.loadOne(id) : model;
    const safeModel = useModelParser<ModuleModel>(schema, { ...seed });
    return { model: safeModel, baseModel: safeModel };
  },

  /** `available.checking.parsing` — schema-parse whatever the SET event carried. */
  parse: async ({ schema }: ModuleContext, { data }: AnyEventObject) => ({
    model: useModelParser<ModuleModel>(schema, data?.model ?? data)
  }),

  /** `available.checking.validating` and `processing.validating`. */
  validate: ({ model }: ModuleContext) => service.validate(model),

  /**
   * `processing.adding` — entered when the machine's `isNew` guard passes.
   * The absent-model guard is what keeps the contract's parameters REQUIRED:
   * narrowing here beats widening the service signature or casting the
   * context's optional `model` back to a certainty.
   */
  add: ({ model }: ModuleContext) =>
    model
      ? service.ensure(model)
      : Promise.reject(
          new DetailedError(
            "Module item not available",
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { model }
          )
        ),

  /** `processing.updating` — entered when the context already carries an id. */
  update: ({ id, model }: ModuleContext) =>
    id && model
      ? service.update(id, model)
      : Promise.reject(
          new DetailedError(
            "Module item not available",
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { id, model }
          )
        )
});

export default createModuleServices;
