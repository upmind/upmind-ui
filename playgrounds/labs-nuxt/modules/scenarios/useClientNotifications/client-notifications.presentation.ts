// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientNotifications/client-notifications.presentation
 * @description How the notification-preferences grid draws — one row per
 * topic, driveable through the `manage`/`editRow` handoff.
 *
 * @decision
 * what:     No `selectAll`/`clearAll`/`revert`/`update` declared here.
 * why:      The list's port carries only the collection's actions; all four
 *           are editor verbs reachable through the `manage` handoff instead.
 * rejected: Publishing the manager's actions on the collection — would blur
 *           the two composables' boundary for every consumer.
 */

import {
  ActionPlacementTypes,
  CardSlotTypes,
  TableColumnWidthTypes
} from "../runtime/scenario.types";
import type {
  ActionsUischema,
  CardUischema,
  DetailUischema,
  TableUischema
} from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/**
 * The locked-topic status badges. Read `topic.meta`, derived from `canOptOut`
 * — the same source `isTopicLocked` guards on, never a second one.
 */
const STATUS_BADGES = [
  { flag: "isMandatory", i18n: "text.mandatory", color: "warning" as const },
  {
    flag: "hasOptOuts",
    i18n: "text.notification_partially_off",
    color: "neutral" as const
  }
];

/**
 * @decision
 * what:     `TableCellIcon` on `#/properties/canOptOut` is excluded from all
 *           three row declarations below.
 * why:      It draws the same datum the `meta` badges column renders, and its
 *           only candidate glyph (`unlock-01`) has no `ICON_MAP` equivalent.
 * rejected: Adding `unlock-01` to `ICON_MAP` just to keep a duplicate column.
 */
export const tableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/name",
      i18n: "text.notification_topic_name",
      options: { width: TableColumnWidthTypes.SIXTH }
    },
    {
      type: "TableCellText",
      scope: "#/properties/description",
      i18n: "text.notification_topic_description",
      options: { width: TableColumnWidthTypes.SEVEN_TWELFTHS }
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: STATUS_BADGES, width: TableColumnWidthTypes.SIXTH }
    }
  ]
};

/**
 * The same row drawn as a card — a second declaration, never a second
 * component. Every element carries `options.slot`, or `cardSlot()` filters it
 * out and the card view draws empty.
 */
export const cardUischema: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/name",
      i18n: "text.notification_topic_name",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: STATUS_BADGES, slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/description",
      i18n: "text.notification_topic_description",
      options: { slot: CardSlotTypes.SUBTITLE }
    }
  ]
};

/** The SAME row drawn READ-ONLY in the detail overlay — no `useDetail`, so no fetch. */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/name",
      i18n: "text.notification_topic_name"
    },
    {
      type: "TableCellText",
      scope: "#/properties/description",
      i18n: "text.notification_topic_description"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: STATUS_BADGES }
    }
  ]
};

/**
 * `manage` and `refresh` — the collection's own controls, fired with no row,
 * placed in the page header.
 *
 * @decision
 * what:     `manage` is placed `HEADER` (not per-row); `refresh` is `HEADER`.
 * why:      `manage` opens the same account-wide editor from every row, so it
 *           is a collection control, not a row action; `refresh` is a live
 *           member of the collection's actions.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      // Per-row edit: opens the manager's draft narrowed to this topic's own
      // channels, through the same handoff path `manage` uses.
      type: "Action",
      name: "editRow",
      handoff: "editRow",
      i18n: "action.edit",
      icon: "edit-01",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
      name: "manage",
      handoff: "manage",
      i18n: "action.notification_manage_preferences",
      icon: "settings-01",
      variant: "primary",
      placement: ActionPlacementTypes.HEADER
    },
    {
      type: "Action",
      name: "refresh",
      i18n: "action.refresh",
      icon: "refresh-cw-01",
      variant: "outline",
      placement: ActionPlacementTypes.HEADER,
      feedback: {
        success: "confirm.notifications_refreshed",
        failure: "error.client_notifications_refresh_failed"
      }
    }
  ]
};
