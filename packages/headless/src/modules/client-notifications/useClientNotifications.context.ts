// -----------------------------------------------------------------------------
/**
 * @module client-notifications/useClientNotifications.context
 * @description Collection context factory — the reactive topic/channel/opt-out
 * lists and the derived, read-only `isEnabled(topicId, channelId)`. Reads
 * SERVER state (§D6) — the manager's own `isEnabled` reads the DRAFT, which is
 * the split AC-5's revert read-back turns on.
 *
 * @doctrine clause 2 — shared-only (armless, §D10).
 */

import { computed } from "vue";
import { isOptedOut } from "./client-notifications.mappers";
import {
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "./client-notifications.schemas";
import { useCollection } from "../../utils";
import { map, some } from "lodash-es";
import type {
  NotificationChannel,
  NotificationsLookups,
  NotificationsServices,
  NotificationTopic,
  OptOut
} from "./client-notifications.types";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------

export function createClientNotificationsContext(
  _actorScope: ScopeActorTypes,
  service: NotificationsServices,
  topicsQuery: ReturnType<NotificationsServices["loadTopics"]>,
  channelsQuery: ReturnType<NotificationsServices["loadChannels"]>,
  optOutsQuery: ReturnType<NotificationsServices["loadOptOuts"]>
) {
  // Topics/channels share one query cache across cells; an unaddressable cell shows none.
  const topics = computed<NotificationTopic[]>(() =>
    service.isAvailable.value
      ? map(topicsQuery.data.value ?? [], topic => ({
          ...topic,
          meta: {
            ...topic.meta,
            hasOptOuts: some(optOutsQuery.data.value, { topicId: topic.id })
          }
        }))
      : []
  );
  const channels = computed<NotificationChannel[]>(() =>
    service.isAvailable.value ? (channelsQuery.data.value ?? []) : []
  );
  const optOuts = computed<OptOut[]>(() =>
    service.isAvailable.value ? (optOutsQuery.data.value ?? []) : []
  );

  /** Server-held state: enabled is the ABSENCE of an opt-out row. */
  function isEnabled(topicId: string, channelId: string): boolean {
    return !isOptedOut(optOuts.value, topicId, channelId);
  }

  /**
   * Keyed to TOPICS only (`design.md` §D15, `parity.yaml` row
   * `collection-query-contract`) — the one recorded collection with an `id`
   * and a `code` a consumer would look one row up by; channels and opt-outs
   * are read in full, never looked up singly.
   */
  const { findOne, getOne } = useCollection<NotificationTopic>(topics);

  /**
   * Reference data both reads resolve — the SAME shape
   * (`NotificationsLookups`) the manager half's `lookups` already carries
   * (`useClientNotificationsManager.context.ts`), so a consumer reading
   * either half's `lookups` gets one uniform contract.
   */
  const lookups = computed<NotificationsLookups>(() => ({
    topics: topics.value,
    channels: channels.value
  }));

  // --- actor-specific context: none earned (§D10 — context: none).

  return {
    /**
     * Alias for `topics` (one row per topic) — the shape the generic
     * scenario-playground harness reads its row source from
     * (`usePersonalDetails.context.ts`'s own `data` precedent). The module's
     * true public contract stays `topics` / `channels` / `optOuts`.
     */
    data: topics,

    /** The full notification-topic list (D16 — full set, ruling B). */
    topics,

    /** The full client-recipient channel list. */
    channels,

    /** The full opt-out set. */
    optOuts,

    /** Whether a topic x channel pair is enabled, read off SERVER state. */
    isEnabled,

    /** Finds a single TOPIC by a partial mapping (e.g. `{ code }`). */
    findOne,

    /** Finds a single TOPIC by id. */
    getOne,

    /** Reference data both reads resolve — `{ topics, channels }`. */
    lookups,

    // NO `default` (drift D7, `design.md` §D15, dispositioned NOT
    // implemented): no topic is a default, and the oracle has no such
    // concept — an always-`undefined` member would be shape with no
    // capability behind it.

    /**
     * The D16 pagination descriptor. All three reads share one criteria
     * schema (§D2), so any one is representative; `topics` is chosen
     * arbitrarily and consistently.
     */
    pagination: topicsQuery.pagination,

    /**
     * This scope's ACTIVE request state — the criteria model, not a copy.
     * All three reads share one criteria schema (§D2); `topics` is chosen
     * arbitrarily and consistently, matching `pagination` above.
     */
    query: topicsQuery.criteria,

    /**
     * The module's query-schema family, plain JSON. Ruling B declares no
     * `filters` branch and no `sort` member (`design.md` §D2) — the pair
     * below is the pagination-only schema and two honest EMPTY layouts, not
     * hollow structure standing in for a capability the oracle never had.
     */
    schemas: {
      query: {
        schema: useQuerySchema(),
        uischema: useQueryUischema(),
        sortUischema: useSortUischema()
      }
    },

    /** Any of the three reads' captured error, first one reporting. */
    error: computed(
      () =>
        topicsQuery.error.value ??
        channelsQuery.error.value ??
        optOutsQuery.error.value
    ),

    /** The resolved client id for an authenticated client; undefined when the client reads via a `?token=` link. */
    clientId: service.clientId

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseClientNotificationsContext = ReturnType<
  typeof createClientNotificationsContext
>;
