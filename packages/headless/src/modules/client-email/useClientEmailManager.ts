import { watch } from "vue";
import { interpret } from "xstate";
import { dataManagerMachine } from "../data-manager";
import { createScopedComposable } from "../scope/scope.builder";
import { useI18n } from "../system-localisation";
import createClientEmailServices from "./client-email.services";
import {
  CLIENT_EMAIL_SCOPE_MATRIX,
  ClientEmailContextTypes
} from "./client-email.types";
import { createClientEmailManagerActions } from "./useClientEmailManager.actions";
import { createClientEmailManagerContext } from "./useClientEmailManager.context";
import { createClientEmailManagerInternals } from "./useClientEmailManager.internals";
import { createClientEmailManagerMachineConfig } from "./useClientEmailManager.machine";
import { createClientEmailManagerMeta } from "./useClientEmailManager.meta";
import {
  createActor,
  contextMatches,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type { ClientEmailScopeMatrix } from "./client-email.types";
import type { ScopeActorTypes, ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmailManager
 * @description Scoped per-email form editor, backed by the shared
 * `dataManagerMachine`. One interpreter per concrete `(actor, email)` scope:
 * the address being edited comes from `.for('email', id)`, and a new one is
 * minted with `.fresh()`. Registered under the same module name as
 * `useClientEmails`; the scope key carries the differentiation.
 */
function createClientEmailManagerForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const { t } = useI18n();

  const actorScope = config.actor as ScopeActorTypes;

  /**
   * The email being edited is carried by the scope context; absent
   * (`.fresh()`) → a new address. Reading the id from the scope rather than an
   * argument is what makes two concurrently-open editors two distinct registry
   * entries instead of one shared machine.
   */
  const emailId =
    config.context?.type === ClientEmailContextTypes.EMAIL
      ? config.context.id
      : undefined;

  /**
   * ONE services instance for this scope, threaded into the machine config.
   * `config.context` goes in here and nowhere else — every request the manager
   * issues, directly or through the machine, inherits the same resolved client.
   */
  const service = createClientEmailServices(actorScope, config.context);

  const machineService = interpret(
    dataManagerMachine
      .withConfig(createClientEmailManagerMachineConfig(service))
      .withContext({
        id: emailId,
        // Identity, seeded from the ONE seam. Never read `activeUser` directly
        // in this file.
        clientId: service.clientId.value,
        // Scoped instances are persistent editors — stay editable after a save
        // (the machine returns to `available` instead of the `complete` final
        // state) so a remounting form re-uses the same instance.
        allowMultipleEdits: true
      }),
    {
      // The scope key, not the email id: `.fresh()` mints a unique key per
      // call, so two concurrent drafts get two distinct interpreters instead of
      // colliding on a shared "new-email" id.
      id: scopeKey,
      devTools: false
    }
  );
  machineService.start();

  const actorRef = createActor(machineService);
  if (!actorRef) {
    throw new DetailedError(
      t("error.client_email_not_available"),
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
   * already-present value, so this can never clobber a resolved retarget. A
   * session that never authenticates simply never fires it, leaving the machine
   * in `subscribing` with no unaddressed request.
   */
  const stopClientIdTopUp = watch(service.clientId, clientId => {
    if (!clientId || contextMatches(actorRef.state, "clientId")) return;
    stopClientIdTopUp();
    actorRef.send({ type: "REFRESH", data: { clientId } });
  });

  /**
   * ONE actions instance per scope, not one per `useActions()` call: `input` is
   * debounced, so a debouncer minted per call gives two keystrokes two
   * independent timers — two parses — and leaves `update`'s pre-save flush with
   * nothing to flush. The stateless layers below stay lazy.
   */
  const actions = createClientEmailManagerActions(
    actorScope,
    actorRef,
    service,
    scopeKey
  );

  return {
    /** Sub-composable for manager actions (form input, save, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for manager context (model, schema, errors). */
    useContext: () => createClientEmailManagerContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientEmailManagerInternals(actorScope, actorRef),

    /** Sub-composable for manager meta (state flags). */
    useMeta: () => createClientEmailManagerMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for editing ONE client email address.
 *
 * @example
 * ```ts
 * // Edit an existing address
 * const manager = useClientEmailManager().as('self').for('email', emailId)
 * const { model, schema, uischema } = manager.useContext()
 * await manager.useActions().isReady()
 * await manager.useActions().update({ email: 'new@example.com' })
 *
 * // Create a new address (isolated instance, distinct scope key)
 * const draft = useClientEmailManager().as('self').fresh()
 * ```
 */
export const useClientEmailManager = createScopedComposable<
  ReturnType<typeof createClientEmailManagerForScope>,
  ClientEmailScopeMatrix
>("client-email", createClientEmailManagerForScope, CLIENT_EMAIL_SCOPE_MATRIX);

export type UseClientEmailManager = ReturnType<typeof useClientEmailManager>;
