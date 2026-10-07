// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockNotifications
 * @description The client's notifications, managed — the mock stand-in for
 * `useUserNotifications` (§3): mark-all-read, and the per-item dismiss the
 * dropdown's own rows carry. The read filter and the load-more accumulation
 * ride the collection (`collection-defs.ts` `notificationsCollection`), as
 * the contract puts them on the same instance.
 *
 * The preference MATRIX is its own composable in the contract
 * (`useNotificationPreferences`) and its write lands here, on one facade for
 * the module — the same merge the affiliate facade makes for its links.
 */

import { parsePreferenceKey } from "../contracts/user-notifications.schemas";
import { defineMockFacade, MOCK_RECEIPT_REASON } from "./facade";
import {
  assign,
  every,
  filter,
  find,
  forEach,
  isBoolean,
  keys,
  remove
} from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type {
  MockDataset,
  MockNotification,
  MockNotificationPreference
} from "../types";
import type { FormModel } from "@upmind/ui";
// -----------------------------------------------------------------------------

/**
 * One cell's submitted answer, written onto the row it names. A MANDATORY
 * topic is the brand's, not the client's: its controls render readonly and
 * its flags never move, whatever a submitted model says (plan F5 — a refusal
 * of a control nobody could operate would be a refusal of nothing).
 */
function applyPreference(data: MockDataset, key: string, value: unknown): void {
  if (!isBoolean(value)) return;
  const cell = parsePreferenceKey(key);
  if (cell === undefined) return;
  const row: MockNotificationPreference | undefined = find(
    data.notificationPreferences,
    { topic: cell.topicId }
  );
  if (row === undefined || row.mandatory) return;
  if (!(cell.channel in row.channels)) return;
  assign(row.channels, { [cell.channel]: value });
}

export const useMockNotifications = defineMockFacade(
  (data): readonly MockNotification[] => data.notifications,
  data => ({
    /** Flips every unread notification; an already-read inbox refuses. */
    markAllRead: (): MockActionReceipt<readonly MockNotification[]> => {
      if (every(data.notifications, "read")) {
        return { ok: false, reason: MOCK_RECEIPT_REASON.NOTHING_UNREAD };
      }
      const unread = filter(data.notifications, { read: false });
      for (const notification of unread) {
        assign(notification, { read: true });
      }
      return { ok: true, entity: unread };
    },

    /**
     * Drops one notification from the feed. Legacy said nothing back — the
     * row leaving IS the feedback — so the dispatcher toasts nothing on it.
     */
    dismiss: (
      notificationId: string
    ): MockActionReceipt<MockNotification> | undefined => {
      const notification = find(data.notifications, { id: notificationId });
      if (notification === undefined) return undefined;
      remove(data.notifications, { id: notificationId });
      return { ok: true, entity: notification };
    },

    /**
     * Sets every channel of ONE topic at once — legacy's per-row
     * select-all/clear-all link. A MANDATORY topic is the brand's, so it
     * refuses rather than moving nothing quietly.
     */
    setTopic: (
      topicId: string,
      receives: boolean
    ): MockActionReceipt<MockNotificationPreference> | undefined => {
      const row: MockNotificationPreference | undefined = find(
        data.notificationPreferences,
        { topic: topicId }
      );
      if (row === undefined) return undefined;
      if (row.mandatory) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.TOPIC_MANDATORY,
          entity: row
        };
      }
      forEach(keys(row.channels), channel => {
        assign(row.channels, { [channel]: receives });
      });
      return { ok: true, entity: row };
    },

    /** Saves the whole matrix — one cell per `<topicId>__<channel>` key. */
    savePreferences: (
      model: FormModel
    ): MockActionReceipt<readonly MockNotificationPreference[]> => {
      forEach(model, (value, key) => {
        applyPreference(data, key, value);
      });
      return { ok: true, entity: data.notificationPreferences };
    }
  })
);
