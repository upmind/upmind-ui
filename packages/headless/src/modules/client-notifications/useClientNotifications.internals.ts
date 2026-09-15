// -----------------------------------------------------------------------------
/**
 * @module client-notifications/useClientNotifications.internals
 * @description Collection internals sub-composable (debugging) — a NARROWED
 * diagnostic projection per query (`data`, `error`, `isFetched`, `queryKey`,
 * `pagination`, `refetch`), never the raw TanStack query object.
 *
 * The Stage-0 top finding (`design.md` §D14): the raw `ListQuery` publishes
 * `setCriteria`, so `useInternals().query.optOuts.setCriteria({ pagination: {
 * limit: 25 } })` truncated the opt-out set through the module's OWN public
 * surface — re-opening defect F5 on a channel operator ruling B exists to
 * close, because ENABLED is the ABSENCE of a row. `setCriteria` and every
 * other criteria write verb are absent at runtime AND unspellable at build
 * time on this projection (AC-15).
 *
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */

import { translateQuery } from "../query";
import {
  CHANNELS_QUERY_KEY,
  OPT_OUTS_QUERY_KEY,
  TOPICS_QUERY_KEY
} from "./client-notifications.services";
import type {
  NotificationChannel,
  NotificationsInternalsQuery,
  NotificationsServices,
  NotificationTopic,
  OptOut
} from "./client-notifications.types";
import type { QueryProps } from "../query";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------

/**
 * @decision
 * what:     `queryKey` on this projection is the STABLE PREFIX
 *           (`TOPICS_QUERY_KEY` / `CHANNELS_QUERY_KEY` / `OPT_OUTS_QUERY_KEY`),
 *           never the live, identity-SALTED key `client-notifications.services.ts`
 *           actually queries the opt-outs read on (`[...OPT_OUTS_QUERY_KEY, {
 *           client, token }]`).
 * why:      `design.md` §D14 (T16) names `queryKey` as one member of the
 *           diagnostic projection, with no discussion of what it should
 *           CONTAIN; `design.md` §D19 (T19) mandates that no credential reach
 *           ANY published door, `useInternals()` named explicitly in AC-18's
 *           own read-back. The real salted key embeds the link token
 *           verbatim (a bearer credential). Publishing it on a diagnostic
 *           surface would open a FOURTH leak path beside D27/D28, defeating
 *           the very containment T19 lands. The stable prefix still answers
 *           the diagnostic question a caller asks of `queryKey` — "which
 *           resource does this handle address" — without the identity salt.
 * rejected: Publishing the live salted key verbatim (contradicts T19/AC-18).
 *           Omitting `queryKey` entirely (contradicts T16/design.md §D14's
 *           named member list — the shape of the diagnostic capability, not
 *           the credential, is what T16 asks for).
 */
function toInternalsQuery<TView>(
  query:
    | ReturnType<NotificationsServices["loadTopics"]>
    | ReturnType<NotificationsServices["loadChannels"]>
    | ReturnType<NotificationsServices["loadOptOuts"]>,
  queryKey: readonly unknown[]
): NotificationsInternalsQuery<TView> {
  return {
    data: query.data as unknown as { readonly value: TView[] },
    error: query.error,
    isFetched: query.isFetched,
    queryKey,
    pagination: query.pagination,
    refetch: query.refetch
  };
}

export function createClientNotificationsInternals(
  actorScope: ScopeActorTypes,
  topicsQuery: ReturnType<NotificationsServices["loadTopics"]>,
  channelsQuery: ReturnType<NotificationsServices["loadChannels"]>,
  optOutsQuery: ReturnType<NotificationsServices["loadOptOuts"]>
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Narrowed diagnostic projection — the raw queries are NOT reachable here. */
    query: {
      topics: toInternalsQuery<NotificationTopic>(
        topicsQuery,
        TOPICS_QUERY_KEY
      ),
      channels: toInternalsQuery<NotificationChannel>(
        channelsQuery,
        CHANNELS_QUERY_KEY
      ),
      optOuts: toInternalsQuery<OptOut>(optOutsQuery, OPT_OUTS_QUERY_KEY)
    },
    /**
     * Diagnostics: the wire the live criteria BUILDS — nothing is requested
     * (`design.md` §D16, `parity.yaml` row `request-state-containment`).
     * All three reads share ONE criteria schema (ruling B); `topics` is
     * chosen arbitrarily and consistently, matching `pagination`'s own
     * precedent on `useClientNotifications.context.ts`.
     * @precedent `useClientEmails.internals.ts`'s `translateQuery`.
     */
    translateQuery: (): QueryProps =>
      translateQuery(topicsQuery.schema, topicsQuery.criteria.value)
  };
}

// Type export for consumers
export type UseClientNotificationsInternals = ReturnType<
  typeof createClientNotificationsInternals
>;
