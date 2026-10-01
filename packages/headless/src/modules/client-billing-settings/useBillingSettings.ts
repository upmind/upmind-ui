import { watch } from "vue";
import { interpret } from "xstate";
import { dataManagerMachine } from "../data-manager";
import { createScopedComposable } from "../scope";
import { useI18n } from "../system-localisation";
import createClientBillingSettingsServices from "./client-billing-settings.services";
import { createBillingSettingsActions } from "./useBillingSettings.actions";
import { createBillingSettingsContext } from "./useBillingSettings.context";
import { createBillingSettingsInternals } from "./useBillingSettings.internals";
import { createBillingSettingsMachineConfig } from "./useBillingSettings.machine";
import { createBillingSettingsMeta } from "./useBillingSettings.meta";
import {
  createActor,
  contextMatches,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type { ClientBillingSettingsScopeMatrix } from "./client-billing-settings.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/useBillingSettings
 * @description Scoped `dataManagerMachine`-backed editor for a client's own
 * invoice-consolidation preference. One interpreter per concrete
 * `(actor, context)` scope.
 *
 * @decision registered under its OWN registry name, not the read half's.
 * what:    this composable's `createScopedComposable` call names
 *          "client-billing-settings", not "client-billing-settings".
 * why:     `generateScopeKey(name, config)` is `name:actor[:context.type:
 *          context.id][:brand][:fresh]` (`scope.utils.ts`) — NOTHING else
 *          differentiates two composables sharing one name. This module's
 *          shared `CLIENT` context has no `.for()`/`.withId()` segment to
 *          differentiate on in the normal self case — `.as('client')` with no
 *          `.for()` is the NORMAL call for BOTH halves (a client has exactly
 *          one consolidation preference), which would make the read half's and
 *          the manager's scope keys IDENTICAL under a shared name — the
 *          registry would hand one consumer the other's instance. Two
 *          DISTINCT registry names is the fix; the SHARED scope MATRIX
 *          (design.md §4.2) still holds — both use the same
 *          `ClientBillingSettingsContextTypes.CLIENT` context and the same
 *          identity seam, only the registry key's `name:` segment differs.
 *          Mirrors `usePersonalDetailsManager.ts`'s own `@decision`.
 * rejected: keeping one shared name and requiring every manager call site to
 *          add `.for('client', clientId)` — rejected: it forces every
 *          caller to know and re-supply the client's own id just to avoid a
 *          collision, for an entity that already has exactly one preference;
 *          brittle and easy to forget.
 *
 * @doctrine clause 1 (uniform four-layer default) — identical return shape
 * to the read half.
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; never branch on SELF in this file.
 */
function createBillingSettingsForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const { t } = useI18n();

  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope, threaded into the machine config.
   * `config.context` goes in here and nowhere else — every request the
   * manager issues, directly or through the machine, inherits the same
   * resolved client.
   */
  const service = createClientBillingSettingsServices(
    actorScope,
    config.context
  );

  const machineService = interpret(
    dataManagerMachine
      .withConfig(createBillingSettingsMachineConfig(service))
      .withContext({
        // The settings record IS the client (`clients/{id}`), so the record id
        // and the client id are one — both fields seed from the ONE resolved
        // client seam.
        id: service.clientId.value,
        clientId: service.clientId.value,
        lookups: {},
        // Scoped instances are persistent editors — stay editable after a
        // save (the machine returns to `available` instead of the
        // `complete` final state) so a remounting form re-uses the same
        // instance.
        allowMultipleEdits: true
      }),
    {
      id: scopeKey,
      devTools: false
    }
  );
  machineService.start();

  const actorRef = createActor(machineService);
  if (!actorRef) {
    throw new DetailedError(
      t("error.client_billing_settings_not_available"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  /**
   * Late top-up ONLY. The machine's `hasSubscription` guard holds it in
   * `subscribing` until a client id exists, and at construction the session
   * may not have resolved yet. The id is watched off `service.clientId` —
   * the ONE identity seam, never a second session read — and
   * `refreshContext` keeps an already-present value, so this can never
   * clobber a resolved retarget.
   */
  const stopClientIdTopUp = watch(service.clientId, clientId => {
    if (!clientId || contextMatches(actorRef.state, "clientId")) return;
    stopClientIdTopUp();
    actorRef.send({ type: "REFRESH", data: { clientId, id: clientId } });
  });

  /**
   * ONE actions instance per scope, not one per `useActions()` call: `input`
   * is debounced, so a debouncer minted per call gives two keystrokes two
   * independent timers.
   */
  const actions = createBillingSettingsActions(
    actorScope,
    actorRef,
    service,
    scopeKey
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for manager actions (form input, save, revert, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for manager context (model, schema, errors, account values). */
    useContext: () => createBillingSettingsContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createBillingSettingsInternals(actorScope, actorRef),

    /** Sub-composable for manager meta (state flags). */
    useMeta: () => createBillingSettingsMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for editing a client's own invoice-consolidation
 * preference. Callable bare — `useBillingSettings().as('client')`
 * constructs and settles without a caller-supplied option.
 *
 * @example
 * ```ts
 * const manager = useBillingSettings().as('client')
 * const { model, schema, uischema } = manager.useContext()
 * await manager.useActions().isReady()
 * await manager.useActions().update({ enabled: InvoiceConsolidationTypes.DISABLED })
 * ```
 */
export const useBillingSettings = createScopedComposable<
  ReturnType<typeof createBillingSettingsForScope>,
  ClientBillingSettingsScopeMatrix
>("client-billing-settings", createBillingSettingsForScope);

// Type export for consumers
export type UseBillingSettings = ReturnType<typeof useBillingSettings>;
