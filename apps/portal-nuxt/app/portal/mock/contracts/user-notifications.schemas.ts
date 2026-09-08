// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/user-notifications.schemas
 * @description Schema/uischema for the preference matrix the SCOPED
 * `user-notifications` module headless does not have yet carries (plan F4) —
 * legacy's `manageNotificationsOptOuts`. Written in the headless shape, so
 * `/scoped-composable-factory` consumes this file unchanged alongside
 * `user-notifications.ts`'s four-layer contract.
 *
 * A matrix has no fixed field set, so the schema is BUILT from the topics the
 * brand publishes — one boolean per topic × channel, keyed
 * `<topicId>__<channel>` — exactly as `client-custom-fields.schemas.ts` builds
 * one from the brand's own questions. The uischema groups the booleans by
 * topic, so the form reads as the table it replaces: a row per topic, a
 * control per channel.
 *
 * A MANDATORY topic is the brand's, not the client's: its controls render
 * `readonly` (JSON Forms' own `options.readonly`, which disables the control
 * rather than hiding the fact) and the facade never moves them.
 *
 * @module-oracle vue-app `manageNotificationsOptOuts.vue`.
 */

import { NotificationChannelCodes } from "@upmind-automation/types";
import { assign, filter, forEach, includes, map, values } from "lodash-es";
import type {
  EmailTopicOptInsContext,
  EmailTopicOptInsModel,
  NotificationPreferenceRow,
  NotificationPreferencesContext,
  NotificationPreferencesModel
} from "./user-notifications";
import type { GroupLayout, JsonSchema7, VerticalLayout } from "@jsonforms/core";

/** What separates a topic from its channel in one cell's key. */
const KEY_SEPARATOR = "__";

/** What each channel is called on the row that carries it. */
const CHANNEL_LABEL: Readonly<
  Partial<Record<NotificationChannelCodes, string>>
> = {
  [NotificationChannelCodes.EMAIL]: "Email",
  [NotificationChannelCodes.IN_APP]: "In-app"
};

/** One cell's key — the pair it belongs to, spelled the one way both layers read. */
export function preferenceKey(
  topicId: string,
  channel: NotificationChannelCodes
): string {
  return `${topicId}${KEY_SEPARATOR}${channel}`;
}

/** The pair a key names, or nothing where it names none — the facade's own reader. */
export function parsePreferenceKey(
  key: string
): { readonly topicId: string; readonly channel: string } | undefined {
  // The LAST separator, not the first: a channel code carries none, while a
  // topic id is the brand's own string and may carry one.
  const separator = key.lastIndexOf(KEY_SEPARATOR);
  if (separator <= 0) return undefined;
  return {
    topicId: key.slice(0, separator),
    channel: key.slice(separator + KEY_SEPARATOR.length)
  };
}

/** The channels one topic carries — the platform's own vocabulary, narrowed to this brand's. */
function channelsOf(
  row: NotificationPreferenceRow
): NotificationChannelCodes[] {
  return filter(
    values(NotificationChannelCodes),
    channel => channel in row.channels
  );
}

/** Schema for the preferences form — one boolean per cell of the matrix. */
export const useSchema = (
  context: NotificationPreferencesContext
): JsonSchema7 => {
  const properties: Record<string, JsonSchema7> = {};
  forEach(context.preferences, row => {
    forEach(channelsOf(row), channel => {
      properties[preferenceKey(row.topicId, channel)] = {
        type: "boolean",
        title: CHANNEL_LABEL[channel] ?? channel
      };
    });
  });

  return {
    type: "object",
    title: "Notification preferences",
    properties
  };
};

/** One topic's group — the row the table drew, as a heading over its channels. */
function topicGroup(row: NotificationPreferenceRow): GroupLayout {
  return {
    type: "Group",
    label: row.label,
    elements: map(channelsOf(row), channel => ({
      type: "Control",
      scope: `#/properties/${preferenceKey(row.topicId, channel)}`,
      options: { readonly: row.mandatory }
    }))
  };
}

/** UI schema for the preferences form — a group per topic, as legacy's rows read. */
export const useUischema = (
  context: NotificationPreferencesContext
): VerticalLayout => ({
  type: "VerticalLayout",
  elements: map(context.preferences, topicGroup)
});

// --- one address's own opt-ins (legacy `manageEmailTopicOptIns.vue`) ----------

/** Schema for the per-address opt-in form — one boolean per topic on offer. */
export const useEmailTopicOptInsSchema = (
  context: EmailTopicOptInsContext
): JsonSchema7 => {
  const properties: Record<string, JsonSchema7> = {};
  forEach(context.topics, topic => {
    properties[topic.id] = {
      type: "boolean",
      title: topic.label,
      readOnly: topic.disabledReason !== undefined
    };
  });
  return {
    type: "object",
    title: "Email preferences",
    properties
  };
};

/** UI schema for the opt-in form — the topic's own words under its switch. */
export const useEmailTopicOptInsUischema = (
  context: EmailTopicOptInsContext
): VerticalLayout => ({
  type: "VerticalLayout",
  elements: map(context.topics, topic => ({
    type: "Control",
    scope: `#/properties/${topic.id}`,
    // A topic the ACCOUNT has opted out of states that instead of its own
    // words: the reason is what the client needs, and the switch cannot move.
    options: {
      description: topic.disabledReason ?? topic.description,
      readonly: topic.disabledReason !== undefined
    }
  }))
});

/** What the opt-in form opens on — what this address receives today. */
export const emailTopicOptInsDefaults = (
  context: EmailTopicOptInsContext
): EmailTopicOptInsModel => {
  const model: EmailTopicOptInsModel = {};
  forEach(context.topics, topic => {
    // An account-level opt-out reads UNCHECKED whatever this address holds:
    // the address is not receiving it, whatever it was subscribed to before.
    const isOn =
      topic.disabledReason === undefined && includes(context.optIns, topic.id);
    assign(model, { [topic.id]: isOn });
  });
  return model;
};

/** What the form opens on — the matrix on file, never a blank one. */
export const preferencesDefaults = (
  context: NotificationPreferencesContext
): NotificationPreferencesModel => {
  const model: NotificationPreferencesModel = {};
  forEach(context.preferences, row => {
    forEach(channelsOf(row), channel => {
      assign(model, {
        [preferenceKey(row.topicId, channel)]: row.channels[channel] === true
      });
    });
  });
  return model;
};
