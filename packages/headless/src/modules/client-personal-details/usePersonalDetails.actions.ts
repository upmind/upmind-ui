import { watch } from "vue";
// A's own collection (AC-63) — this scope's readiness must fold in A's, or
// `isReady()` resolves before the joined custom-field rows have settled
// (`usePersonalDetails.context.ts`'s own `@decision` for WHY a bare vs
// `.for('profile', id)` scope is chosen — mirrored here verbatim, never
// re-derived).
import {
  ClientCustomFieldsContextTypes,
  useClientCustomFields
} from "../client-custom-fields";
import { remove as removeFromRegistry } from "../scope";
import { ScopeActorTypes } from "../scope/scope.types";
import { useActiveSession } from "../session-store";
import { ClientPersonalDetailsContextTypes } from "./client-personal-details.types";
import { NotAuthenticatedError } from "../../utils";
import type {
  ClientPersonalDetailsRecordQuery,
  ClientPersonalDetailsServices
} from "./client-personal-details.types";
import type { ScopeContext } from "../scope";
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
  scopeKey: string,
  scopeContext?: ScopeContext
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * A's own collection scope for THIS profile — identical resolution to
   * `usePersonalDetails.context.ts`'s own `customFieldsScope` (see that
   * file's `@decision`): `.for('profile', id)` only when THIS module's own
   * scope was explicitly retargeted, otherwise a bare `.as(CLIENT)` that
   * falls through to A's own session-client fallback.
   */
  const customFieldsScope =
    scopeContext?.type === ClientPersonalDetailsContextTypes.PROFILE
      ? useClientCustomFields()
          .as(ScopeActorTypes.CLIENT)
          .for(ClientCustomFieldsContextTypes.VALUES, scopeContext.id)
      : useClientCustomFields().as(ScopeActorTypes.CLIENT);
  const { isReady: isCustomFieldsReady } = customFieldsScope.useActions();

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
   * Resolves once the profile is ready to read — AC-63's contract, not only
   * B's own fetch: the joined display list also needs A's own definitions
   * collection SETTLED (loaded or errored), or a consumer that renders on
   * this readiness sees natives first and custom-field rows pop in ~0.5-1s
   * later (the flicker AC-63 makes part of the read surface's contract).
   * Legacy's own `customFields.vue` emits `@loaded` for the SAME reason
   * (`clientCustomFieldsForm.vue`'s `customFieldsCount`/`@loaded` gate).
   *
   * @decision fold A's readiness into B's OWN `isReady()`, awaited alongside
   * (never gating) B's own fetch outcome.
   * what:    `Promise.all([whenFetched(), isCustomFieldsReady()])` — both
   *          must SETTLE before this resolves, but the returned boolean is
   *          `whenFetched()`'s own outcome only; A's outcome is discarded
   *          here (it is separately reachable via `useContext().error`,
   *          which already folds `definitionsError` in).
   * why:     it is safe to await A's readiness NOW because A's own
   *          `isReady()` is bounded and error-settling (self-stopping
   *          watches, `enabled` gates on `brand.isSettled` rather than
   *          `!!brand.brandId.value`, and a brand-read failure still flips
   *          `isSettled` so `guard` converts it into the query's own
   *          rejection instead of a permanently-disabled entry —
   *          `client-custom-fields.services.ts`'s own `loadList`/`enabled`
   *          comment and `useClientCustomFields.actions.ts`'s own AC-6
   *          comment). Gating the RETURNED boolean on A's outcome too would
   *          regress AC-40/AC-41/AC-42 (a definitions failure must degrade —
   *          natives still render — never flip B's own readiness to
   *          false/never-resolve).
   * rejected: leaving `isReady()` as B's fetch alone (the pre-fix shape) —
   *          rejected, that is the flicker this decision closes: AC-63 makes
   *          "renders a row per definition" part of the read contract, so a
   *          readiness that claims ready before the join has settled is
   *          `isReady()` lying.
   * @returns true once the first fetch has settled without error, false if
   * the session settles unaddressable OR the fetch errors. Never hangs — A's
   * own readiness is bounded (see why, above), so awaiting it cannot
   * reintroduce the unbounded wait AC-6 already closed on A's side.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    const [fetched] = await Promise.all([whenFetched(), isCustomFieldsReady()]);
    return fetched;
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
