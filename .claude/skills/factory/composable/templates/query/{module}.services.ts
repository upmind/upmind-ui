/** @internal */
// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-services.md` (service-authoring, actor-split
 * decision) + `code-composables.companion.md` "Variance law" clauses 2/3. A
 * disagreement between this skeleton, its worked example, and the doctrine is
 * a surfaced finding, never silently resolved toward either.
 */

import { computed } from "vue";
import { useQuery } from "../query";
import { ScopeActorTypes } from "../scope";
import { useActiveSession } from "../session-store";
import { mapModuleItems } from "./module.mappers";
import { ModuleContextTypes } from "./module.types";
import { useTime, NotAuthenticatedError, DEBOUNCE_DELAY } from "../../utils";
import type { QueryParams } from "../query";
import type { ScopeContext } from "../scope";
import type {
  ModuleItem,
  ModuleWireItem,
  ModuleServices
} from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module module/module.services
 * @description Module TanStack Query services (list + mutations).
 * Shared services are defined here, actor-specific services in their respective
 * files. Uses a matrix lookup pattern for scalable service resolution.
 *
 * Data is mapped here via `select`, never in `useModule.context.ts`
 * (`code-composables.md` Part B "TanStack Query variant").
 *
 * WARNING: Do not import directly. Resolve via `useModule.ts` only.
 */
// -----------------------------------------------------------------------------
// Shared Services
// These are identical for all scopeActor types

/**
 * Base cache key. Exported so an arm overriding `loadList` extends the SAME
 * key rather than inventing a parallel one — two arms must never collide in
 * the cache, and must never diverge from the shared base.
 */
export const queryKey = ["module", "items"];

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
  const { activeUser } = useActiveSession().useContext();
  const { list, useUrl } = useQuery();

  // `.for('client', id)` names the client being read — a STAFF scope has no
  // other route to it, and reading `activeUser` there fetches the staff user's
  // own collection instead (the FE-2824 drop).
  const clientId = computed(() =>
    scopeContext?.type === ModuleContextTypes.CLIENT
      ? scopeContext.id
      : activeUser.value?.id
  );

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
 * Shared domain mutation — the wire call `useModule.actions.ts`'s `login`
 * awaits, and the one the actions arm's own `login` override also drives
 * (`useModule.actions.{actor}.ts`): that override diverges in the ACTION's
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
 * and the context it acts upon arrive first, at construction, and `useModule.ts`
 * calls it once. The machine variant reads the same two values off
 * `context.scopeActor` / `context.scopeContext` per call instead, because a
 * machine has no construction-time seam to close over.
 */
export const createModuleServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ModuleServices => ({
  queryKey,
  loadList: params => loadList(params, scopeContext),
  login,
  ...scopedServices(scopeActor, scopeContext)
});

export default createModuleServices;
