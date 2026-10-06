// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import { resetQueryByKey } from "../query";
import { remove } from "../scope";
import { useActiveSession } from "../session-store";
import { useDataLayer } from "../system-analytics";
import type { ScopeActorTypes } from "../scope";
import type {
  FilterModel,
  ModuleListQuery,
  ModuleModel,
  ModuleServices,
  SortModel
} from "./module.types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.actions
 * @description Module collection actions factory.
 */

export function createModuleActions(
  actorScope: ScopeActorTypes,
  service: ModuleServices,
  query: ModuleListQuery,
  scopeKey: string,
  clientId: ComputedRef<string | undefined>
) {
  const { isAuthenticated } = useActiveSession().useMeta();

  function destroy(): void {
    remove(scopeKey);
  }

  function filterBy(intent: FilterModel): void {
    query.setCriteria({ filters: intent });
  }

  // The query stays disabled until the session settles on a client, so wait
  // for the session before waiting for the first fetch.
  async function isReady(): Promise<boolean> {
    await useActiveSession().useActions().isReady();
    if (!isAuthenticated.value || !clientId.value) return false;
    await query.suspense();
    return query.isSuccess.value;
  }

  function login(credentials: ModuleModel): Promise<unknown> {
    return service.login(credentials).then(result => {
      useDataLayer().dataLayer({ event: "login" }).withUser().push();
      return result;
    });
  }

  function sortBy(intent: SortModel): void {
    query.setCriteria({ sort: intent });
  }

  return {
    /** Removes this scoped instance from the registry. */
    destroy,

    /** Merges a filter model into the request state. */
    filterBy,

    /** Resolves true once the collection has fetched for an available scope. */
    isReady,

    /** Logs in with the given credentials. */
    login,

    /** Fetches the next page. */
    nextPage: query.fetchNextPage,

    /** Fetches the previous page. */
    prevPage: query.fetchPreviousPage,

    /** Refetches the list, keeping the current rows on screen. */
    refresh: query.refetch,

    /** Drops the module's cached rows so the next read starts from loading. */
    reset: resetQueryByKey(service.queryKey),

    /** Merges filters, sort or pagination into the request state. */
    setCriteria: query.setCriteria,

    /** Merges a sort model into the request state. */
    sortBy
  };
}

export type UseModuleActions = ReturnType<typeof createModuleActions>;
