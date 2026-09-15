/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module client-notifications/client-notifications.mappers
 * @description Wire <-> view-model shaping only. No side effects, no HTTP.
 */

import { castArray, each, every, filter, keys, map, some } from "lodash-es";
import type {
  NotificationChannel,
  NotificationsModel,
  NotificationTopic,
  OptOut,
  OptOutRequestRow
} from "./client-notifications.types";
import type {
  INotificationChannel,
  INotificationTopic,
  IOptOut
} from "@upmind-automation/types";

export const mapTopics = (
  raw: INotificationTopic | INotificationTopic[]
): NotificationTopic[] => map(castArray(raw), mapTopic);

export const mapTopic = (raw: INotificationTopic): NotificationTopic => ({
  id: raw.id,
  name: raw.name,
  description: raw.description,
  code: raw.code,
  mandatory: raw.mandatory,
  canOptOut: raw.can_opt_out,
  /** Presentation-only status flag, derived from `can_opt_out` (`parity.yaml` row `topic-mandatory-label`). */
  meta: { isMandatory: !raw.can_opt_out }
});

export const mapChannels = (
  raw: INotificationChannel | INotificationChannel[]
): NotificationChannel[] => map(castArray(raw), mapChannel);

export const mapChannel = (raw: INotificationChannel): NotificationChannel => ({
  id: raw.id,
  name: raw.name,
  code: raw.code
});

export const mapOptOuts = (raw: IOptOut | IOptOut[]): OptOut[] =>
  map(castArray(raw), mapOptOut);

export const mapOptOut = (raw: IOptOut): OptOut => ({
  topicId: raw.topic_id,
  channelId: raw.channel_id
});

/**
 * The OUTBOUND half of the pair — defect F2 fix. The oracle's `unmapOptOut`
 * returns a non-`IOptOut` and casts (the PUT body has no `id`/`created_at`/
 * `updated_at`, which `IOptOut` mandates); this returns the write body's OWN
 * type instead, with no cast anywhere.
 */
export const mapOptOutsRequestData = (optOut: OptOut): OptOutRequestRow => ({
  topic_id: optOut.topicId,
  channel_id: optOut.channelId
});

/**
 * The locked-topic set (§D7, §D8) — `canOptOut === false` — computed ONCE from
 * the resolved topics lookup and passed to every reader (the manager's
 * `toggle`/`clearAll`/`update` guard, and the `useMeta()` flag the UI disables
 * a control from), never recomputed per layer (`ARMS.md`'s drift warning).
 * `mandatory` is read nowhere here — one rule, not two (§D8).
 */
export const getLockedTopicIds = (
  topics: NotificationTopic[] | undefined
): Set<string> =>
  new Set(
    map(
      filter(topics, topic => !topic.canOptOut),
      "id"
    )
  );

/** Whether a topic x channel pair is currently OPTED OUT in a given set. */
export const isOptedOut = (
  optOuts: OptOut[] | undefined,
  topicId: string,
  channelId: string
): boolean =>
  some(optOuts, row => row.topicId === topicId && row.channelId === channelId);

/**
 * The manager model's flat-record key for one topic x channel pair
 * (`design.md` §D13). `::` needs no JSON-Pointer escaping (only `~` and `/`
 * do) and both ids are UUIDs, so the key is pointer-safe by construction.
 */
export const preferenceKey = (topicId: string, channelId: string): string =>
  `${topicId}::${channelId}`;

/**
 * The per-topic bulk-toggle sentinel's channel slot — never a real channel id.
 * Expanded to every real channel and deleted before it reaches the machine
 * model, and excluded from the wire projection as a second guard.
 */
export const SELECT_ALL_CHANNEL_ID = "__all";

/**
 * True when every real channel is enabled for the given topic — the read the
 * bulk sentinel's own checked state reflects (AC-4's `isAllSelected`
 * readout). Shared by the manager's published `isAllSelected` action and the
 * machine's `parse` recomputation so both read the identical definition.
 */
export const isTopicFullySelected = (
  preferences: Record<string, boolean>,
  channels: NotificationChannel[],
  topicId: string
): boolean =>
  every(
    channels,
    channel => preferences[preferenceKey(topicId, channel.id)] ?? true
  );

/**
 * Expands a per-topic bulk sentinel in `incoming` to every real channel key,
 * then removes it — the sentinel must never reach the machine model.
 *
 * @decision
 * what:     A changed sentinel expands only channels whose incoming value
 *           still equals `previous`.
 * why:      Trailing-only debounce folds a bulk toggle and a following
 *           per-channel toggle into one payload; a per-key check against
 *           `previous` separates the bulk instruction from the exception.
 * rejected: Lengthening or removing the debounce — the typing path needs it.
 */
export const expandSelectAllSentinels = (
  incoming: Record<string, boolean>,
  previous: Record<string, boolean> | undefined,
  topics: NotificationTopic[],
  channels: NotificationChannel[]
): Record<string, boolean> => {
  const expanded = { ...incoming };
  each(topics, topic => {
    const sentinelKey = preferenceKey(topic.id, SELECT_ALL_CHANNEL_ID);
    if (!(sentinelKey in expanded)) return;

    const next = expanded[sentinelKey];
    if (next !== (previous?.[sentinelKey] ?? true)) {
      each(channels, channel => {
        const key = preferenceKey(topic.id, channel.id);
        if (expanded[key] === (previous?.[key] ?? true)) {
          expanded[key] = next;
        }
      });
    }
    delete expanded[sentinelKey];
  });
  return expanded;
};

/** The inverse of `preferenceKey` — recovers the pair a flat key addresses. */
export const splitPreferenceKey = (key: string): OptOut => {
  const [topicId, channelId] = key.split("::");
  return { topicId, channelId };
};

/**
 * Builds the manager's initial flat boolean record from the reference lists
 * and the opt-out set. Every topic x channel pair gets an entry; absence from
 * `optOuts` means enabled. Seeds each topic's bulk-toggle sentinel via
 * `isTopicFullySelected` after every real channel key is set, so `isDirty`
 * reads false the moment the editor opens.
 */
export const toPreferencesModel = (
  topics: NotificationTopic[],
  channels: NotificationChannel[],
  optOuts: OptOut[]
): NotificationsModel => {
  const preferences: Record<string, boolean> = {};
  each(topics, topic => {
    each(channels, channel => {
      preferences[preferenceKey(topic.id, channel.id)] = !isOptedOut(
        optOuts,
        topic.id,
        channel.id
      );
    });
  });
  each(topics, topic => {
    preferences[preferenceKey(topic.id, SELECT_ALL_CHANNEL_ID)] =
      isTopicFullySelected(preferences, channels, topic.id);
  });
  return { preferences };
};

/**
 * The wire projection — every `preferences[key] === false` becomes one
 * `{ topic_id, channel_id }` row, two-sided against `basePreferences`: a
 * locked-topic row already `false` in the baseline is carried through; one
 * flipping `true -> false` on a locked topic is never emitted. Skips any
 * bulk-toggle sentinel key unconditionally.
 */
export const toOptOutRequestRows = (
  preferences: Record<string, boolean>,
  lockedTopicIds: Set<string>,
  basePreferences: Record<string, boolean> = {}
): OptOutRequestRow[] =>
  map(
    filter(keys(preferences), key => {
      const { topicId, channelId } = splitPreferenceKey(key);
      if (channelId === SELECT_ALL_CHANNEL_ID) return false;
      if (preferences[key]) return false;
      if (!lockedTopicIds.has(topicId)) return true;
      return basePreferences[key] === false;
    }),
    key => mapOptOutsRequestData(splitPreferenceKey(key))
  );
