import { createScopedComposable, ScopeActorTypes } from "../scope";
import { createClientAddressDryServices } from "./client-address-dry.services";
import { getClientAddressDryStaffCapabilities } from "./client-address-dry.utils";
import { createClientAddressDryActions } from "./useClientAddressesDry.actions";
import { createClientAddressDryContext } from "./useClientAddressesDry.context";
import { createClientAddressDryInternals } from "./useClientAddressesDry.internals";
import { createClientAddressDryMeta } from "./useClientAddressesDry.meta";
import type { ClientAddressDryScopeMatrix } from "./client-address-dry.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @module client-address-dry/useClientAddressesDry
 * @description Scoped, query-backed client-address collection: one TanStack
 * query per concrete `(actor, context)` scope, minted once at construction.
 * Returns ONLY the four sub-composable factories (clause 1).
 *
 * @doctrine clause 4 — `config.actor` arriving here is already a concrete
 * actor; SELF resolution happened in the scope builder (ADR-001). Cell 3
 * (staff acting-as-client) resolves to `.as('self')` UPSTREAM via
 * impersonation (D-ADDR-2) — this factory never branches on it.
 */
function createClientAddressDryForScope(
  config: ScopeConfig,
  _session: IToken | undefined,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  const service = createClientAddressDryServices(actorScope, config.context);

  // Minted ONCE per scope — a `service.loadList()` inside a layer factory
  // would mint a second query with its own refs, key and effect scope.
  const query = service.loadList({ pagination: { limit: 0 } });

  /**
   * Single source of truth (D-ADDR-5, operator ruling 2026-07-31): the four
   * staff capability booleans are computed ONCE per scope instance here and
   * passed to BOTH the `actions` sub-composable (gates action exposure,
   * AC-B3/AC-B4) and the `meta` sub-composable (exposes as readable UI state,
   * AC-B5) — neither runs its own independent `hasStaffCapability` lookup.
   */
  const staffCapabilities =
    actorScope === ScopeActorTypes.STAFF
      ? getClientAddressDryStaffCapabilities()
      : undefined;

  return {
    /** Sub-composable for collection actions (mutations, refresh, lifecycle). */
    useActions: () =>
      createClientAddressDryActions(
        actorScope,
        service,
        query,
        scopeKey,
        staffCapabilities
      ),

    /** Sub-composable for collection context (reactive data + form seed). */
    useContext: () =>
      createClientAddressDryContext(actorScope, service, query, config.brandId),

    /** Sub-composable for advanced access and debugging. */
    useInternals: () =>
      createClientAddressDryInternals(actorScope, query, service),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () =>
      createClientAddressDryMeta(actorScope, query, staffCapabilities)
  };
}

/**
 * Scoped composable for client postal addresses — query variant, full legacy
 * parity (`docs/sdd/client-address-dry-smoke/design.md`). Side-by-side with
 * `client-address/`; does not replace it.
 *
 * @example
 * ```ts
 * const addresses = useClientAddressesDry().as('self')
 * const staffAddresses = useClientAddressesDry().as('staff').for('client', clientId)
 * ```
 */
export const useClientAddressesDry = createScopedComposable<
  ReturnType<typeof createClientAddressDryForScope>,
  ClientAddressDryScopeMatrix
>("client-address-dry", createClientAddressDryForScope);

// Type export for consumers
export type UseClientAddressesDry = ReturnType<typeof useClientAddressesDry>;
