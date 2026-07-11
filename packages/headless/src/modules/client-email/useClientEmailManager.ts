import { interpret } from "xstate";
import { createScopedComposable, ScopeActorTypes } from "../scope";
import { dataManagerMachine } from "../data-manager";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import { useClientEmailActions, useClientEmailGuards } from "./actions";
import { useClientEmailServices } from "./client-email.services";
import { useClientEmails } from "./useClientEmails";
import { createClientEmailManagerActions } from "./useClientEmailManager.actions";
import { createClientEmailManagerContext } from "./useClientEmailManager.context";
import { createClientEmailManagerInternals } from "./useClientEmailManager.internals";
import { createClientEmailManagerMeta } from "./useClientEmailManager.meta";
import {
  createActor,
  contextMatches,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import { ClientEmailContextTypes } from "./client-email.types";
import type { ClientEmailScopeMatrix } from "./client-email.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { IToken } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmailManager
 * @description Scoped client-email manager — a per-email form editor backed by
 * the shared `dataManagerMachine`. One interpreter per concrete `(actor, email)`
 * scope; the email being edited comes from the scope context (`.for('email', id)`)
 * and a new email is minted with `.fresh()` (no context). The active session's
 * client is seeded once at construction. Returns ONLY the four sub-composable
 * factories — no direct props (ADR 001 four-layer return).
 */
// -----------------------------------------------------------------------------
/**
 * Creates the client-email manager for a specific scope. Actor is already
 * resolved by the scope builder (SELF → concrete actor). The email id is read
 * from the scope context; the initial model is seeded from the collection.
 * @private
 */
function createClientEmailManagerForScope(
  config: ScopeConfig,
  _session: IToken | undefined,
  scopeKey: ScopeKey
) {
  const { t } = useI18n();

  const actorScope = config.actor as ScopeActorTypes;

  // The email being edited is carried by the scope context; absent → new email.
  const emailId =
    config.context?.type === ClientEmailContextTypes.EMAIL
      ? config.context.id
      : undefined;

  // Seed the initial model from the active client's collection (find-by-id).
  const { getOne } = useClientEmails().as(ScopeActorTypes.SELF).useContext();

  const service = interpret(
    dataManagerMachine
      .withConfig({
        actions: useClientEmailActions() as any,
        guards: useClientEmailGuards() as any,
        services: useClientEmailServices() as any
      })
      .withContext({
        id: emailId,
        model: getOne(emailId),
        // Scoped instances are persistent editors — stay editable after a save
        // (the machine returns to `available` instead of the `complete` final
        // state) so a remounting form re-uses the same instance.
        allowMultipleEdits: true
      }),
    {
      id: emailId ?? "new-email",
      devTools: false
    }
  );
  service.start();

  const actorRef = createActor(service);
  if (!actorRef) {
    throw new DetailedError(
      t("error.client_email_not_available"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  // The clientId is required to bring the machine into the available state.
  const { isReady: ensureAuth } = useActiveSession().useActions();
  const { activeUser } = useActiveSession().useContext();
  ensureAuth()
    .then(ok => {
      const client = ok ? activeUser.value : undefined;
      if (client?.id && !contextMatches(actorRef.state, "clientId")) {
        actorRef.send({ type: "REFRESH", data: { clientId: client.id } });
      }
    })
    .catch(() => {
      /* guest sessions won't be authenticated — silently skip */
    });

  return {
    // --- Sub-composables (no direct props)
    /** Sub-composable for manager actions (form input, save, lifecycle). */
    useActions: () =>
      createClientEmailManagerActions(actorScope, actorRef, scopeKey),

    /** Sub-composable for manager context (computed form values). */
    useContext: () => createClientEmailManagerContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientEmailManagerInternals(actorScope, actorRef),

    /** Sub-composable for manager meta (state flags). */
    useMeta: () => createClientEmailManagerMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for managing a single client email (a form editor).
 *
 * @example
 * ```ts
 * // Edit a specific email
 * const manager = useClientEmailManager().as('client').for('email', emailId)
 * await manager.useActions().isReady()
 * await manager.useActions().update({ email: 'new@example.com' })
 *
 * // Create a new email (isolated instance)
 * const draft = useClientEmailManager().as('client').fresh()
 * ```
 */
export const useClientEmailManager = createScopedComposable<
  ReturnType<typeof createClientEmailManagerForScope>,
  ClientEmailScopeMatrix
>("client-email", createClientEmailManagerForScope);

/**
 * The return type of the {@link useClientEmailManager} composable.
 */
export type UseClientEmail = ReturnType<typeof useClientEmailManager>;
