import { nextTick, watch } from "vue";
import { invalidateQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import type {
  ClientCustomPagesServices,
  CustomPage,
  CustomPageQuery
} from "./client-custom-pages.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages/useClientCustomPage.actions
 * @description Single-read actions — lifecycle only. Query-backed:
 * `destroy()` removes the registry entry, because there is no service to
 * stop.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useClientCustomPage.actions.{actor}.ts` file
 * exists.
 */
export function createClientCustomPageActions(
  _actorScope: ScopeActorTypes,
  service: ClientCustomPagesServices,
  query: CustomPageQuery,
  scopeKey: string,
  listRow?: ComputedRef<CustomPage | undefined>
) {
  /**
   * Resolves once the item query has completed its first fetch, deferred one
   * reactive flush (`nextTick()`) — the same reason the collection's
   * `whenFetched()` defers.
   *
   * @decision
   * what:     Also settles the moment `listRow` resolves a row — not only
   *           on `query.isFetched`.
   * why:      O9's guard disables the query entirely when the slug is
   *           already on the mounted list
   *           (`client-custom-pages.services.ts`'s `loadOne` `enabled`), so
   *           a guarded scope's `query.isFetched` NEVER becomes true —
   *           waiting on it alone would hang `isReady()` forever, which is
   *           exactly the `setInterval`-poll hang this composable's own
   *           docblock says it replaces.
   * rejected: Force-enable the item query once a list row exists, "so
   *           `isFetched` still becomes true". Rejected — that discards O9
   *           itself ("no request at all"), trading it for "a request that
   *           then gets a fast cache hit".
   */
  async function whenFetched(): Promise<boolean> {
    await nextTick();

    if (query.isFetched.value || !!listRow?.value) return true;

    return new Promise<boolean>(resolve => {
      const stop = watch(
        [query.isFetched, () => listRow?.value],
        ([fetched, row]) => {
          if (!fetched && !row) return;
          stop();
          resolve(true);
        }
      );
    });
  }

  /** Resolves once the page is ready to read. Always settles. */
  async function isReady(): Promise<boolean> {
    return whenFetched();
  }

  /** Forces a re-read of the page from the server (AC8/O12). */
  async function refresh(): Promise<void> {
    await query.refetch();
  }

  /**
   * Destroys this scoped instance — removes it from the registry so the next
   * `.withId(slug)` mints a fresh read.
   */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules
  // start armless). When a scope earns one, add
  // `useClientCustomPage.actions.{actor}.ts` and spread it LAST so it wins.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Marks the shared cache key stale so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the page is ready to read. Always settles. */
    isReady,

    /** Refetches the page from the server. */
    refresh

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientCustomPageActions = ReturnType<
  typeof createClientCustomPageActions
>;
