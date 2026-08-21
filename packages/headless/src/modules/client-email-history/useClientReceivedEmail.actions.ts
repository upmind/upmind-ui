import { nextTick, watch } from "vue";
import { invalidateQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import type {
  ClientEmailHistoryServices,
  ReceivedEmailItemQuery
} from "./client-email-history.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-email-history/useClientReceivedEmail.actions
 * @description Single-read actions — lifecycle only. Query-backed:
 * `destroy()` removes the registry entry, because there is no service to
 * stop.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useClientReceivedEmail.actions.{actor}.ts` file
 * exists.
 */
export function createClientReceivedEmailActions(
  _actorScope: ScopeActorTypes,
  service: ClientEmailHistoryServices,
  query: ReceivedEmailItemQuery,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * This scope's settled ADDRESSABILITY outcome, or `undefined` while the
   * session is still settling. Reads `service.isAvailable` — the same
   * predicate `loadOne`'s `enabled` and `guard` call — so readiness cannot
   * wait on a fetch that is not coming (a gated query may never fetch).
   */
  function addressableOutcome(): boolean | undefined {
    if (service.isAvailable.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  /**
   * Resolves the addressability outcome, waiting only while the session is
   * still settling.
   */
  function whenSessionSettles(): Promise<boolean> {
    const settled = addressableOutcome();
    if (settled !== undefined) return Promise.resolve(settled);

    return new Promise<boolean>(resolve => {
      const stop = watch(
        [service.isAvailable, isSessionInitialised, isSessionSettling],
        () => {
          const outcome = addressableOutcome();
          if (outcome === undefined) return;
          stop();
          resolve(outcome);
        }
      );
    });
  }

  /**
   * Resolves once the item query has completed its first fetch — deferred
   * one reactive flush (`nextTick()`) before the read, matching the
   * collection composable's `whenFetched()`: a key-driving ref that changed
   * synchronously just before this call has not necessarily flushed through
   * the TanStack observer yet, so an unguarded read risks the PREVIOUS key's
   * already-settled state.
   */
  async function whenFetched(): Promise<boolean> {
    await nextTick();

    if (query.isFetched.value) return true;

    return new Promise<boolean>(resolve => {
      const stop = watch(query.isFetched, fetched => {
        if (!fetched) return;
        stop();
        resolve(true);
      });
    });
  }

  /**
   * Resolves once the email is ready to read.
   * @returns true once the first fetch has settled, false if the session
   * settles without an addressable client. Always SETTLES — replaces the
   * oracle's `setInterval` poll, which hangs the `<script setup>` top-level
   * `await` under Suspense once the read is gated.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    return whenFetched();
  }

  /**
   * Forces a re-read of the email from the server.
   * @throws {NotAuthenticatedError} when the session cannot address a client.
   */
  async function refresh(): Promise<void> {
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /**
   * Destroys this scoped instance — removes it from the registry so the next
   * `.withId(id)` mints a fresh read.
   */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules
  // start armless). When a scope earns one, add
  // `useClientReceivedEmail.actions.{actor}.ts` and spread it LAST so it
  // wins.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Marks the shared cache key stale so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the email is ready to read. Always settles. */
    isReady,

    /** Refetches the email from the server; rejects if it cannot address one. */
    refresh

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientReceivedEmailActions = ReturnType<
  typeof createClientReceivedEmailActions
>;
