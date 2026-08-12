import { createScopedComposable } from "../scope";
import { createClientPersonalDetailsServices } from "./client-personal-details.services";
import { createPersonalDetailsActions } from "./usePersonalDetails.actions";
import { createPersonalDetailsContext } from "./usePersonalDetails.context";
import { createPersonalDetailsInternals } from "./usePersonalDetails.internals";
import { createPersonalDetailsMeta } from "./usePersonalDetails.meta";
import type { PersonalDetailsScopeMatrix } from "./client-personal-details.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/usePersonalDetails
 * @description Scoped, query-backed read of a client's own profile: one
 * reactive record query per concrete `(actor, context)` scope, minted once
 * at construction so it survives component lifecycles. Its sibling is
 * `usePersonalDetailsManager` — a second scoped composable in the same
 * module, sharing the SAME scope matrix (design.md §3.2) but registered
 * under its OWN registry name (`usePersonalDetailsManager.ts`'s own
 * `@decision` explains why a shared name would collide here, unlike
 * `client-email`'s).
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createPersonalDetailsForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` goes in here and
   * nowhere else, so every request the read half issues resolves the same
   * target client.
   */
  const service = createClientPersonalDetailsServices(
    actorScope,
    config.context
  );

  /**
   * The reactive profile query, minted ONCE per scope — a `service.loadProfile()`
   * call inside a layer factory would mint a second query with its own refs,
   * key and effect scope. Mirrors `useClientCustomFields`.
   */
  const query = service.loadProfile();

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for read actions (readiness, refresh). */
    useActions: () =>
      createPersonalDetailsActions(actorScope, service, query, scopeKey),

    /** Sub-composable for read context (the profile, its custom fields, lookups). */
    useContext: () => createPersonalDetailsContext(actorScope, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createPersonalDetailsInternals(actorScope, query),

    /** Sub-composable for read meta (state flags). */
    useMeta: () => createPersonalDetailsMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for reading a client's own profile.
 *
 * @example
 * ```ts
 * const profile = usePersonalDetails().as('client')
 * const { data } = profile.useContext()
 * await profile.useActions().isReady()
 * ```
 */
export const usePersonalDetails = createScopedComposable<
  ReturnType<typeof createPersonalDetailsForScope>,
  PersonalDetailsScopeMatrix
>("client-personal-details", createPersonalDetailsForScope);

// Type export for consumers
export type UsePersonalDetails = ReturnType<typeof usePersonalDetails>;
