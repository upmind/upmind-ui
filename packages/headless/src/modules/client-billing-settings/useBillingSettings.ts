import { ref } from "vue";
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
 * preference: one reactive record query per concrete `(actor, id)` scope,
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
   * ONE services instance for this scope. `config.id` (the `.withId(clientId)`
   * value) goes in here and nowhere else, so every request the read half issues
   * resolves the same target client.
   */
  const service = createClientBillingSettingsServices(actorScope, config.id);

  /**
   * The reactive settings query, minted ONCE per scope — a
   * `service.loadSettings()` call inside a layer factory would mint a
   * second query with its own refs, key and effect scope.
   */
  const query = service.loadSettings();

  /**
   * Row O8's AND row B6's brand gates, resolved per scope in ONE call and
   * shared between `useActions().isReady()`/`refresh()` (which (re-)await
   * `loadVisibility()`) and `useMeta().isVisible`/`hasPaymentCurrencyChoice`/
   * `hasVisibilityError` (which read the settled refs synchronously) — the
   * SAME refs, never a second independent fetch that could still be in
   * flight when a consumer reads them right after `isReady()` resolves.
   *
   * Re-invocable, not a one-shot promise: a transient failure used to leave
   * both gates `undefined` forever, since nothing ever re-ran the fetch.
   * `refresh()` now calls this again, and a failure is recorded in
   * `visibilityError` rather than silently swallowed.
   */
  const restrictToStaff = ref<boolean | undefined>(undefined);
  const differentCurrencyPayment = ref<boolean | undefined>(undefined);
  const visibilityError = ref(false);

  function loadVisibility(): Promise<void> {
    return service
      .loadBrandGates()
      .then(gates => {
        restrictToStaff.value = gates.restrictToStaff;
        differentCurrencyPayment.value = gates.differentCurrencyPayment;
        visibilityError.value = false;
      })
      .catch(() => {
        visibilityError.value = true;
      });
  }

  const visibilitySettled = loadVisibility();

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for read actions (readiness, refresh). */
    useActions: () =>
      createBillingSettingsActions(
        actorScope,
        service,
        query,
        scopeKey,
        visibilitySettled,
        loadVisibility
      ),

    /** Sub-composable for read context (the consolidation preference and the account values). */
    useContext: () => createBillingSettingsContext(actorScope, service, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createBillingSettingsInternals(actorScope, query),

    /** Sub-composable for read meta (state flags). */
    useMeta: () =>
      createBillingSettingsMeta(
        actorScope,
        service,
        query,
        restrictToStaff,
        differentCurrencyPayment,
        visibilityError
      )
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
