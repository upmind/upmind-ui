import { createScopedComposable } from "../scope";
import { createClientPhoneDryServices } from "./client-phone-dry.services";
import { createClientPhoneDryActions } from "./useClientPhonesDry.actions";
import { createClientPhoneDryContext } from "./useClientPhonesDry.context";
import { createClientPhoneDryInternals } from "./useClientPhonesDry.internals";
import { createClientPhoneDryMeta } from "./useClientPhonesDry.meta";
import type { ClientPhoneDryScopeMatrix } from "./client-phone-dry.types";
import type { ScopeConfig, ScopeKey, ScopeActorTypes } from "../scope";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @module client-phone-dry/useClientPhonesDry
 * @description Scoped, query-backed client-phone collection: one TanStack
 * query per concrete `(actor, context)` scope, minted once at construction.
 * Returns ONLY the four sub-composable factories (clause 1).
 *
 * @doctrine clause 4 — `config.actor` arriving here is already a concrete
 * actor; SELF resolution happened in the scope builder (ADR-001).
 */
function createClientPhoneDryForScope(
  config: ScopeConfig,
  _session: IToken | undefined,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  const service = createClientPhoneDryServices(actorScope, config.context);

  // Minted ONCE per scope — a `service.loadList()` inside a layer factory
  // would mint a second query with its own refs, key and effect scope.
  const query = service.loadList({ pagination: { limit: 0 } });

  return {
    /** Sub-composable for collection actions (mutations, refresh, lifecycle). */
    useActions: () =>
      createClientPhoneDryActions(actorScope, service, query, scopeKey),

    /** Sub-composable for collection context (reactive data + form seed). */
    useContext: () =>
      createClientPhoneDryContext(actorScope, query, config.brandId),

    /** Sub-composable for advanced access and debugging. */
    useInternals: () =>
      createClientPhoneDryInternals(actorScope, query, service),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createClientPhoneDryMeta(actorScope, query)
  };
}

/**
 * Scoped composable for client phone numbers — query variant, full legacy
 * parity (`docs/sdd/client-phone-dry-smoke/design.md`). Side-by-side with
 * `client-phone/`; does not replace it.
 *
 * @example
 * ```ts
 * const phones = useClientPhonesDry().as('self')
 * const staffPhones = useClientPhonesDry().as('staff').for('client', clientId)
 * ```
 */
export const useClientPhonesDry = createScopedComposable<
  ReturnType<typeof createClientPhoneDryForScope>,
  ClientPhoneDryScopeMatrix
>("client-phone-dry", createClientPhoneDryForScope);

// Type export for consumers
export type UseClientPhonesDry = ReturnType<typeof useClientPhonesDry>;
