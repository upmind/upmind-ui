import { watch } from "vue";
import { interpret } from "xstate";
import { dataManagerMachine } from "../data-manager";
import { createScopedComposable } from "../scope/scope.builder";
import { useI18n } from "../system-localisation";
import createClientAddressServices from "./client-address.services";
import { ClientAddressContextTypes } from "./client-address.types";
import { createClientAddressManagerActions } from "./useClientAddressManager.actions";
import { createClientAddressManagerContext } from "./useClientAddressManager.context";
import { createClientAddressManagerInternals } from "./useClientAddressManager.internals";
import { createClientAddressManagerMachineConfig } from "./useClientAddressManager.machine";
import { createClientAddressManagerMeta } from "./useClientAddressManager.meta";
import {
  createActor,
  contextMatches,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type { ClientAddressScopeMatrix } from "./client-address.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-address/useClientAddressManager
 * @description Scoped per-address form editor, backed by the shared
 * `dataManagerMachine`. One interpreter per concrete `(actor, address)` scope:
 * the address being edited comes from `.for('address', id)`, and a new one is
 * minted with `.fresh()`. Registered under the same module name as
 * `useClientAddresses`; the scope key carries the differentiation.
 *
 * The `clientId` constructor option the pre-conversion manager advertised
 * (`useClientAddressManager(id, { clientId })`) is REMOVED outright (prior
 * ruling PR-2, `design.md` D-3): it was threaded into machine context and
 * NEVER REACHED A URL, because every request-issuing function re-read the
 * session independently — a parameter that claims retargeting and does not
 * retarget is cosplay. The target client now resolves EXCLUSIVELY through
 * `resolveClientId(scopeContext)`, seeded into machine context below.
 *
 * @doctrine clause 1 (uniform four-layer default) — identical return shape to
 * the collection half.
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; never branch on SELF in this file.
 */
function createClientAddressManagerForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const { t } = useI18n();

  const actorScope = config.actor as ScopeActorTypes;

  /**
   * The address being edited is carried by the scope context; absent
   * (`.fresh()`) → a new address. Reading the id from the scope rather than an
   * argument is what makes two concurrently-open editors two distinct registry
   * entries instead of one shared machine (AC-29).
   */
  const addressId =
    config.context?.type === ClientAddressContextTypes.ADDRESS
      ? config.context.id
      : undefined;

  /**
   * ONE services instance for this scope, threaded into the machine config.
   * `config.context` goes in here and nowhere else — every request the manager
   * issues, directly or through the machine, inherits the same resolved
   * client.
   *
   * `pinClient` is what makes "the account this editor was opened for" survive
   * a session that moves underneath it: the READ and the WRITE address the same
   * client, and neither re-reads `activeUser` at request time (AC-30).
   */
  const service = createClientAddressServices(actorScope, config.context, {
    pinClient: true
  });

  const machineService = interpret(
    dataManagerMachine
      .withConfig(createClientAddressManagerMachineConfig(service))
      .withContext({
        id: addressId,
        // Identity, seeded from the ONE seam (D-3). Never read `activeUser`
        // directly in this file.
        clientId: service.clientId.value,
        // Scoped instances are persistent editors — stay editable after a save
        // (the machine returns to `available` instead of the `complete` final
        // state) so a remounting form re-uses the same instance.
        allowMultipleEdits: true
      }),
    {
      // The scope key, not the address id: `.fresh()` mints a unique key per
      // call, so two concurrent drafts get two distinct interpreters instead of
      // colliding on a shared "new-address" id (AC-29).
      id: scopeKey,
      devTools: false
    }
  );
  machineService.start();

  const actorRef = createActor(machineService);
  if (!actorRef) {
    throw new DetailedError(
      t("error.client_address_not_available"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  /**
   * Late top-up ONLY. The machine's `hasSubscription` guard holds it in
   * `subscribing` until a client id exists, and at construction the session may
   * not have resolved yet. The id is watched off `service.clientId` — the ONE
   * identity seam, never a second session read — and `refreshContext` keeps an
   * already-present value, so this can never clobber a resolved retarget
   * (AC-30).
   */
  const stopClientIdTopUp = watch(service.clientId, resolvedClientId => {
    if (!resolvedClientId || contextMatches(actorRef.state, "clientId")) return;
    stopClientIdTopUp();
    actorRef.send({ type: "REFRESH", data: { clientId: resolvedClientId } });
  });

  /**
   * ONE actions instance per scope, not one per `useActions()` call: `input` is
   * debounced, so a debouncer minted per call gives two keystrokes two
   * independent timers. The stateless layers below stay lazy.
   */
  const actions = createClientAddressManagerActions(
    actorScope,
    actorRef,
    service,
    scopeKey
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for manager actions (form input, save, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for manager context (model, schema, errors). */
    useContext: () => createClientAddressManagerContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () =>
      createClientAddressManagerInternals(actorScope, actorRef),

    /** Sub-composable for manager meta (state flags). */
    useMeta: () => createClientAddressManagerMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for editing ONE client address.
 *
 * @example
 * ```ts
 * // Edit an existing address
 * const manager = useClientAddressManager().as('client').for('address', addressId)
 * const { model, schema, uischema } = manager.useContext()
 * await manager.useActions().isReady()
 * await manager.useActions().update({ address: { city: 'London' } })
 *
 * // Create a new address (isolated instance, distinct scope key)
 * const draft = useClientAddressManager().as('client').fresh()
 * ```
 */
export const useClientAddressManager = createScopedComposable<
  ReturnType<typeof createClientAddressManagerForScope>,
  ClientAddressScopeMatrix
>("client-address", createClientAddressManagerForScope);

// Type export for consumers
export type UseClientAddressManager = ReturnType<
  typeof useClientAddressManager
>;
