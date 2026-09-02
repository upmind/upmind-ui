import { createScopedComposable } from "../scope";
import { createClientBillingSettingsServices } from "./client-billing-settings.services";
import { createBillingSettingsActions } from "./useBillingSettings.actions";
import { createBillingSettingsContext } from "./useBillingSettings.context";
import { createBillingSettingsInternals } from "./useBillingSettings.internals";
import { createBillingSettingsMeta } from "./useBillingSettings.meta";
import type { ClientBillingSettingsScopeMatrix } from "./client-billing-settings.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/useBillingSettings
 * @description Scoped, query-backed read of a client's own invoice-consolidation
 * preference: one reactive record query per concrete `(actor, context)` scope,
 * minted once at construction so it survives component lifecycles. Its
 * sibling is `useBillingSettingsManager` — a second scoped composable in the
 * same module, sharing the SAME scope matrix (design.md §4.2) but registered
 * under its OWN registry name (`useBillingSettingsManager.ts`'s own
 * `@decision` explains why).
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createBillingSettingsForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` goes in here and
   * nowhere else, so every request the read half issues resolves the same
   * target client.
   */
  const service = createClientBillingSettingsServices(
    actorScope,
    config.context
  );

  /**
   * The reactive settings query, minted ONCE per scope — a
   * `service.loadSettings()` call inside a layer factory would mint a
   * second query with its own refs, key and effect scope.
   */
  const query = service.loadSettings();

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for read actions (readiness, refresh). */
    useActions: () =>
      createBillingSettingsActions(actorScope, service, query, scopeKey),

    /** Sub-composable for read context (the consolidation preference). */
    useContext: () => createBillingSettingsContext(actorScope, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createBillingSettingsInternals(actorScope, query),

    /** Sub-composable for read meta (state flags). */
    useMeta: () => createBillingSettingsMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for reading a client's own invoice-consolidation
 * preference.
 *
 * @example
 * ```ts
 * const settings = useBillingSettings().as('client')
 * const { data } = settings.useContext()
 * await settings.useActions().isReady()
 * ```
 */
export const useBillingSettings = createScopedComposable<
  ReturnType<typeof createBillingSettingsForScope>,
  ClientBillingSettingsScopeMatrix
>("client-billing-settings", createBillingSettingsForScope);

// Type export for consumers
export type UseBillingSettings = ReturnType<typeof useBillingSettings>;
