// -----------------------------------------------------------------------------
/**
 * @module client-notifications/useClientNotifications
 * @description Scoped, query-backed COLLECTION composable — the read-only
 * preference grid: every notification topic, every client-recipient channel,
 * and the server-held opt-out state of each pair. Its sibling is
 * `useClientNotificationsManager` — a second scoped composable in this same
 * module, the editable draft that saves the whole opt-out set in one PUT.
 *
 * Returns ONLY the four sub-composable factories — no direct props.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 (`.as('self')` builder-owned) — `config.actor` arriving
 * here is ALREADY a concrete actor.
 * @doctrine §D10 — armless at every layer.
 */

import { createScopedComposable } from "../scope";
import createClientNotificationsServices from "./client-notifications.services";
import { CLIENT_NOTIFICATIONS_SCOPE_MATRIX } from "./client-notifications.types";
import { createClientNotificationsActions } from "./useClientNotifications.actions";
import { createClientNotificationsContext } from "./useClientNotifications.context";
import { createClientNotificationsInternals } from "./useClientNotifications.internals";
import { createClientNotificationsMeta } from "./useClientNotifications.meta";
import type { ClientNotificationsScopeMatrix } from "./client-notifications.types";
import type { ScopeActorTypes, ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------

function createClientNotificationsForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  const service = createClientNotificationsServices(actorScope, config);

  // Minted ONCE per scope, so each read survives component lifecycles. Every
  // read carries `limit: 0` through the shared criteria schema (ruling B) and
  // is gated by the shared addressability predicate (`config.id`, never
  // `actorScope` — §D10).
  const topicsQuery = service.loadTopics();
  const channelsQuery = service.loadChannels();
  const optOutsQuery = service.loadOptOuts();

  return {
    // --- Sub-composables (no direct props)
    /** Sub-composable for collection actions (refresh, readiness, lifecycle). */
    useActions: () =>
      createClientNotificationsActions(
        actorScope,
        service,
        topicsQuery,
        channelsQuery,
        optOutsQuery,
        scopeKey
      ),

    /** Sub-composable for collection context (the three reads + isEnabled). */
    useContext: () =>
      createClientNotificationsContext(
        actorScope,
        service,
        topicsQuery,
        channelsQuery,
        optOutsQuery
      ),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () =>
      createClientNotificationsInternals(
        actorScope,
        topicsQuery,
        channelsQuery,
        optOutsQuery
      ),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () =>
      createClientNotificationsMeta(
        actorScope,
        service,
        topicsQuery,
        channelsQuery,
        optOutsQuery
      )
  };
}
// -----------------------------------------------------------------------------
/**
 * The read-only preference grid.
 *
 * @example
 * ```ts
 * const list = useClientNotifications().as('client')
 * // or, for an unauthenticated client holding an emailed link token:
 * const list = useClientNotifications().as('client').withId(token)
 * ```
 */
export const useClientNotifications = createScopedComposable<
  ReturnType<typeof createClientNotificationsForScope>,
  ClientNotificationsScopeMatrix
>(
  "client-notifications",
  createClientNotificationsForScope,
  CLIENT_NOTIFICATIONS_SCOPE_MATRIX
);

// Type export for consumers
export type UseClientNotifications = ReturnType<typeof useClientNotifications>;
