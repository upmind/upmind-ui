import { watch } from "vue";
import { interpret } from "xstate";
import { dataManagerMachine } from "../data-manager";
// Deep path, never the `../scope` barrel — see useClientPhones.ts for the
// aggregator-barrel `export *` hazard this sidesteps.
import { createScopedComposable } from "../scope/scope.builder";
import { useI18n } from "../system-localisation";
import createClientPhoneServices from "./client-phone.services";
import { ClientPhoneContextTypes } from "./client-phone.types";
import { createClientPhoneManagerActions } from "./useClientPhoneManager.actions";
import { createClientPhoneManagerContext } from "./useClientPhoneManager.context";
import { createClientPhoneManagerInternals } from "./useClientPhoneManager.internals";
import { createClientPhoneManagerMachineConfig } from "./useClientPhoneManager.machine";
import { createClientPhoneManagerMeta } from "./useClientPhoneManager.meta";
import {
  createActor,
  contextMatches,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type { ClientPhoneScopeMatrix } from "./client-phone.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-phone/useClientPhoneManager
 * @description Scoped per-phone form editor, backed by the shared
 * `dataManagerMachine`. One interpreter per concrete `(actor, phone)` scope:
 * the record being edited comes from `.for('phone', id)`, and a new one is
 * minted with `.fresh()`. Registered under the same module name as
 * `useClientPhones`; the scope key carries the differentiation.
 *
 * THE AMPUTATION GUARD (row M1): the 2026-08-05 client-email run shipped a
 * `variant=query` conversion against an oracle that shipped a manager, and
 * deleted this whole half with every gate green. `client-phone` ships BOTH
 * halves and both are consumed as a pair by five live call sites.
 *
 * @doctrine clause 1 (uniform four-layer default) — identical return shape to
 * the collection half.
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; never branch on SELF in this file.
 */
function createClientPhoneManagerForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const { t } = useI18n();

  const actorScope = config.actor as ScopeActorTypes;

  /**
   * The phone being edited is carried by the scope context; absent
   * (`.fresh()`) → a new phone. Reading the id from the scope rather than an
   * argument is what makes two concurrently-open editors two distinct
   * registry entries instead of one shared machine (row M15 — the
   * pre-conversion `allowMultipleEdits` option and its shared "new-phone"
   * interpreter id are gone; the scope key IS the isolation).
   */
  const phoneId =
    config.context?.type === ClientPhoneContextTypes.PHONE
      ? config.context.id
      : undefined;

  /**
   * ONE services instance for this scope, threaded into the machine config.
   * `config.context` goes in here and nowhere else — every request the
   * manager issues, directly or through the machine, inherits the same
   * resolved client.
   */
  const service = createClientPhoneServices(actorScope, config.context);

  const machineService = interpret(
    dataManagerMachine
      .withConfig(createClientPhoneManagerMachineConfig(service))
      .withContext({
        id: phoneId,
        // Identity, seeded from the ONE seam. Never read `activeUser` directly
        // in this file.
        clientId: service.clientId.value,
        // Scoped instances are persistent editors — stay editable after a save
        // (the machine returns to `available` instead of the `complete` final
        // state) so a remounting form re-uses the same instance.
        allowMultipleEdits: true
      }),
    {
      // The scope key, not the phone id: `.fresh()` mints a unique key per
      // call, so two concurrent drafts get two distinct interpreters instead
      // of colliding on a shared "new-phone" id (row M15).
      id: scopeKey,
      devTools: false
    }
  );
  machineService.start();

  const actorRef = createActor(machineService);
  if (!actorRef) {
    throw new DetailedError(
      t("error.client_phone_not_available"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  /**
   * Late top-up ONLY. The machine's `hasSubscription` guard holds it in
   * `subscribing` until a client id exists, and at construction the session
   * may not have resolved yet. The id is watched off `service.clientId` — the
   * ONE identity seam, never a second session read — and `refreshContext`
   * keeps an already-present value, so this can never clobber a resolved
   * retarget (row M14). A session that never authenticates simply never fires
   * it, leaving the machine in `subscribing` with no unaddressed request.
   */
  const stopClientIdTopUp = watch(service.clientId, clientId => {
    if (!clientId || contextMatches(actorRef.state, "clientId")) return;
    stopClientIdTopUp();
    actorRef.send({ type: "REFRESH", data: { clientId } });
  });

  /**
   * ONE actions instance per scope, not one per `useActions()` call: `input`
   * is debounced, so a debouncer minted per call gives two keystrokes two
   * independent timers — two parses — and leaves `update`'s pre-save flush
   * with nothing to flush. The stateless layers below stay lazy.
   */
  const actions = createClientPhoneManagerActions(
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
    useContext: () => createClientPhoneManagerContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientPhoneManagerInternals(actorScope, actorRef),

    /** Sub-composable for manager meta (state flags). */
    useMeta: () => createClientPhoneManagerMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for editing ONE client phone number.
 *
 * Ruling 2 (2026-08-08): the pre-conversion `clientId` construction option is
 * REMOVED, not carried forward unwired — it never worked (no service read it,
 * no URL retargeted on it). See row R1.
 *
 * @example
 * ```ts
 * // Edit an existing phone
 * const manager = useClientPhoneManager().as('self').for('phone', phoneId)
 * const { model, schema, uischema } = manager.useContext()
 * await manager.useActions().isReady()
 * await manager.useActions().update({ phone: { number: '+447911123456', ... } })
 *
 * // Create a new phone (isolated instance, distinct scope key)
 * const draft = useClientPhoneManager().as('self').fresh()
 * ```
 */
export const useClientPhoneManager = createScopedComposable<
  ReturnType<typeof createClientPhoneManagerForScope>,
  ClientPhoneScopeMatrix
>("client-phone", createClientPhoneManagerForScope);

// Type export for consumers
export type UseClientPhoneManager = ReturnType<typeof useClientPhoneManager>;
