import { watch } from "vue";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import type {
  ClientPersonalDetailsRecordQuery,
  ClientPersonalDetailsServices
} from "./client-personal-details.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/usePersonalDetails.actions
 * @description Read actions — bounded, error-settling readiness (mirrors
 * `useClientCustomFields.actions.ts`'s AC-6 pattern; no unmanaged async
 * executor, no swallowed rejection — AC-42), refresh and lifecycle.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `usePersonalDetails.actions.{actor}.ts` exists.
 */
export function createPersonalDetailsActions(
  _actorScope: ScopeActorTypes,
  service: ClientPersonalDetailsServices,
  query: ClientPersonalDetailsRecordQuery,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * This scope's settled ADDRESSABILITY outcome, or `undefined` while the
   * session is still settling — the same three-branch shape
   * `useClientCustomFields.actions.ts`'s `addressableOutcome` uses.
   */
  function addressableOutcome(): boolean | undefined {
    if (service.isAvailable.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  /** Resolves the addressability outcome; self-stopping. */
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

  /** Resolves once the read query has completed its first fetch. */
  function whenFetched(): Promise<boolean> {
    if (query.isFetched.value) {
      return Promise.resolve(!query.error.value);
    }

    return new Promise<boolean>(resolve => {
      const stop = watch(query.isFetched, fetched => {
        if (!fetched) return;
        stop();
        resolve(!query.error.value);
      });
    });
  }

  /**
   * Resolves once the profile is ready to read.
   * @returns true once the first fetch has settled without error, false if
   * the session settles unaddressable OR the fetch errors. Never hangs.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    return whenFetched();
  }

  /** Forces a re-read of the profile. @throws {NotAuthenticatedError} */
  async function refresh(): Promise<void> {
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /** Destroys this scoped instance — removes it from the registry. */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2).

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Resolves true when the profile is ready to read. */
    isReady,

    /** Refetches the profile from the server; rejects if it cannot address one. */
    refresh

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UsePersonalDetailsActions = ReturnType<
  typeof createPersonalDetailsActions
>;
