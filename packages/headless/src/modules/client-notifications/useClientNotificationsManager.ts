// -----------------------------------------------------------------------------
/**
 * @module client-notifications/useClientNotificationsManager
 * @description Scoped manager composable — the editable opt-out draft, backed
 * by the shared `dataManagerMachine`. The aggregate has no per-record id:
 * `notifications/opt-outs` is always a full-set PUT, so the machine is seeded
 * with a fixed identity (`OPT_OUTS_AGGREGATE_ID`) rather than a context id.
 * Returns only the four sub-composable factories — no direct props.
 */

import { watch } from "vue";
import { interpret } from "xstate";
import { dataManagerMachine } from "../data-manager";
import { createScopedComposable } from "../scope";
import { useI18n } from "../system-localisation";
import createClientNotificationsServices from "./client-notifications.services";
import {
  CLIENT_NOTIFICATIONS_MANAGER_SCOPE_MATRIX,
  OPT_OUTS_AGGREGATE_ID
} from "./client-notifications.types";
import { createClientNotificationsManagerActions } from "./useClientNotificationsManager.actions";
import { createClientNotificationsManagerContext } from "./useClientNotificationsManager.context";
import { createClientNotificationsManagerInternals } from "./useClientNotificationsManager.internals";
import { createClientNotificationsManagerMachineConfig } from "./useClientNotificationsManager.machine";
import { createClientNotificationsManagerMeta } from "./useClientNotificationsManager.meta";
import {
  createActor,
  contextMatches,
  contextValue,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stateMatches
} from "../../utils";
import { isEqual } from "lodash-es";
import type {
  ClientNotificationsManagerScopeMatrix,
  NotificationsContext,
  NotificationsModel
} from "./client-notifications.types";
import type { ScopeActorTypes, ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------

function createClientNotificationsManagerForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const { t } = useI18n();
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope, threaded into the machine config.
   * `config.id` — the emailed link token, or undefined for a signed-in client
   * — is resolved here and nowhere else (§D4).
   */
  const service = createClientNotificationsServices(actorScope, config);

  /**
   * The emailed link token — kept in this closure only, never seeded into the
   * machine context. `useInternals().state` publishes the raw machine state,
   * so a value never assigned into context cannot be read off `state.context`.
   * Threaded into the `hasSubscription` guard and `addressableOutcome()`.
   */
  const token = config.id;

  /**
   * The three reads, minted once per scope and threaded into the machine
   * config, so `loadLookups` awaits/refetches instead of minting a fresh query
   * observer on every `loading` re-entry (an uncapped-observer stall).
   */
  const topicsQuery = service.loadTopics();
  const channelsQuery = service.loadChannels();
  const optOutsQuery = service.loadOptOuts();

  /**
   * @decision
   * what:     Seed `id: OPT_OUTS_AGGREGATE_ID`; do not override the shared
   *           machine's `isNew` guard.
   * why:      `notifications/opt-outs` is an aggregate with no record id,
   *           written full-set PUT. With no id, `isNew` would route saves to
   *           POST instead of PUT; seeding the id states the fact rather than
   *           rewriting the shared guard.
   * rejected: Overriding `isNew` to `false` — the shared, protected machine's
   *           own contract; an override would hide the reason.
   */
  const seed: Partial<NotificationsContext> = {
    id: OPT_OUTS_AGGREGATE_ID,

    /**
     * Identity, seeded from the ONE seam: `service.clientId`. Never a second
     * `useActiveSession().useContext()` read here (the FE-2824 shape) — a
     * token-only scope resolves `undefined`, which is exactly right: its
     * identity is the token, not a client id.
     */
    clientId: service.clientId.value,

    /** A persistent editor — stays editable after a save. */
    allowMultipleEdits: true
  };

  const machineService = interpret(
    dataManagerMachine
      .withConfig(
        createClientNotificationsManagerMachineConfig(
          actorScope,
          service,
          token,
          topicsQuery,
          channelsQuery,
          optOutsQuery
        )
      )
      .withContext(seed),
    {
      id: scopeKey,
      devTools: false
    }
  );
  machineService.start();

  const actorRef = createActor(machineService);
  if (!actorRef) {
    // The scope KEY only (drift D28, `design.md` §D19) — never `{ scope: config }`.
    // `config.id` carries the link token, and thrown error `data` is the
    // value most likely to be logged, serialised to monitoring, and rendered.
    throw new DetailedError(
      t("error.client_notifications_manager_not_available"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: scopeKey }
    );
  }

  /**
   * Late top-up for the CLIENT case only — at construction the session may not
   * have resolved a client id yet. Watched off `service.clientId` (the ONE
   * identity seam) so a session that authenticates AFTER boot still reaches the
   * machine (AC-16); a one-shot `isReady().then()` resolves once at boot and
   * never re-fires when the client tops up later. A token-only scope keeps
   * `clientId` undefined and never fires it; `contextMatches` keeps an
   * already-resolved value, so this never clobbers a retarget.
   *
   * @decision
   * what:     Gate the send on `stateMatches(actorRef.state, "subscribing")`.
   * why:      `REFRESH` past `subscribing` re-enters `loading`, whose
   *           `loadLookups` reseeds `model`/`baseModel` and discards a dirty
   *           draft; past it, `token` alone already satisfies addressability.
   * rejected: Giving `available` its own `REFRESH` override — edits the shared
   *           machine.
   */
  const stopClientIdTopUp = watch(service.clientId, clientId => {
    if (
      !clientId ||
      contextMatches(actorRef.state, "clientId") ||
      !stateMatches(actorRef.state, "subscribing")
    )
      return;
    stopClientIdTopUp();
    actorRef.send({ type: "REFRESH", data: { clientId } });
  });

  /**
   * Clean-draft re-seed: a clean draft follows the server, a dirty draft is
   * left alone. `optOutsQuery` is the same salted cache entry the collection
   * reads, so an external change reaches this watch through the query cache,
   * never a poll. Skips while the machine has not reached `available` — the
   * first data transition coincides with `loadLookups`'s own seed.
   */
  watch(optOutsQuery.data, () => {
    if (!stateMatches(actorRef.state, "available")) return;

    const isDirty = !isEqual(
      contextValue<NotificationsModel>(actorRef.state, "model"),
      contextValue<NotificationsModel>(actorRef.state, "baseModel")
    );
    if (isDirty) return;

    actorRef.send({ type: "REFRESH" });
  });

  /**
   * ONE actions instance per scope, not one per `useActions()` call: `input`
   * is debounced, so a debouncer minted per call gives two keystrokes two
   * independent timers — two parses — and leaves `update`'s pre-save flush
   * with nothing to flush (`useClientPhoneManager.ts`'s same precedent).
   */
  const actions = createClientNotificationsManagerActions(
    actorScope,
    actorRef,
    scopeKey,
    token
  );

  return {
    // --- Sub-composables (no direct props)
    /** Sub-composable for manager actions (draft mutation, save, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for manager context (draft model, lookups, schema, errors). */
    useContext: () =>
      createClientNotificationsManagerContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () =>
      createClientNotificationsManagerInternals(actorScope, actorRef),

    /** Sub-composable for manager meta (state flags). */
    useMeta: () => createClientNotificationsManagerMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * The editable preference draft.
 *
 * @example
 * ```ts
 * const editor = useClientNotificationsManager().as('client')
 * // or, for an unauthenticated client holding an emailed link token:
 * const editor = useClientNotificationsManager().as('client').withId(token)
 *
 * await editor.useActions().isReady()
 * editor.useActions().toggle(topicId, channelId)
 * await editor.useActions().update()
 * ```
 */
export const useClientNotificationsManager = createScopedComposable<
  ReturnType<typeof createClientNotificationsManagerForScope>,
  ClientNotificationsManagerScopeMatrix
>(
  "client-notifications-manager",
  createClientNotificationsManagerForScope,
  CLIENT_NOTIFICATIONS_MANAGER_SCOPE_MATRIX
);

// Type export for consumers
export type UseClientNotificationsManager = ReturnType<
  typeof useClientNotificationsManager
>;
