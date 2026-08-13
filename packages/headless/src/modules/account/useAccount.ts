import { interpret } from "xstate";
import { createScopedComposable } from "../scope";
import { useSessionStore } from "../session-store";
import { useI18n } from "../system-localisation";
import machine from "./account.machine";
import { ACCOUNT_SCOPE_MATRIX } from "./account.types";
import { createAccountActions } from "./useAccount.actions";
import { createAccountContext } from "./useAccount.context";
import { createAccountInternals } from "./useAccount.internals";
import { createAccountMeta } from "./useAccount.meta";
import {
  createActor,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type { AccountScopeMatrix, ClientContext } from "./account.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ScopeConfig, ScopeKey } from "../scope/scope.types";
import type { IToken } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module account/useAccount
 * @description Scoped account composable — the post-auth standing arc
 * (unregistered → unverified → verified) supporting client (and later staff)
 * flows. Mirrors the `useAuth` scoped pattern: one interpreter per concrete
 * `(actor, sessionId)`, the concrete client seeded from the store at
 * construction (no store read inside the machine).
 */
// -----------------------------------------------------------------------------
/**
 * Creates the account composable for a specific scope (actor + optional context).
 * Actor is already resolved by the scope builder (SELF → concrete actor). The
 * concrete client is read from the store ONCE here, at mint, and seeded into
 * `context.client`; the machine reads only its own context thereafter.
 * @private
 */
function createAccountForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const { t } = useI18n();

  // Actor is already resolved by the scope builder (SELF → concrete actor)
  const actorScope = config.actor as ScopeActorTypes;

  // Seed the concrete client from the store at construction (re-read per mint).
  const { activeUser } = useSessionStore().useContext();

  const service = interpret(
    machine.withContext({
      scopeActor: actorScope,
      scopeContext: config.context,
      brandId: config.brandId,
      client: activeUser.value ?? undefined,
      error: undefined
    } as ClientContext),
    { devTools: true }
  );
  service.start();

  const actorRef = createActor(service);
  if (!actorRef) {
    throw new DetailedError(
      t("errors.auth.unavailable"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  return {
    // --- Sub-composables (no direct props)
    /** Sub-composable for account actions (machine events). */
    useActions: () => createAccountActions(actorScope, actorRef, scopeKey),

    /** Sub-composable for account context (computed form values). */
    useContext: () => createAccountContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createAccountInternals(actorScope, actorRef),

    /** Sub-composable for account meta (state flags). */
    useMeta: () => createAccountMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for the account standing arc.
 *
 * @example
 * ```ts
 * // Active session's account (resolves SELF → active actor)
 * const account = useAccount().as('self')
 *
 * // Client account (as self)
 * const clientAccount = useAccount().as('client')
 * ```
 */
export const useAccount = createScopedComposable<
  ReturnType<typeof createAccountForScope>,
  AccountScopeMatrix
>("account", createAccountForScope, ACCOUNT_SCOPE_MATRIX);

// Type export for consumers
export type UseAccount = ReturnType<typeof useAccount>;
