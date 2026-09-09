// -----------------------------------------------------------------------------
/**
 * @module portal/modules/notifications/types
 * @description Prop contract for the `notifications` module — legacy's
 * topbar notifications-dropdown: a bell with an unread badge opening the
 * notification list, with mark-all-read and the link to the account page.
 */

import type { ListModuleItem } from "../list/types";

/** One choice on the dropdown's own rail — legacy's all / unread / read. */
export interface NotificationsModuleFilter {
  readonly value: string;
  readonly label: string;
}

export interface NotificationsModuleProps {
  readonly items: readonly ListModuleItem[];
  /** The unread badge's count — hidden at zero. */
  readonly count: number;
  /** The rail's choices, in render order. Absent renders no rail at all. */
  readonly filters?: readonly NotificationsModuleFilter[];
  /** Which rail choice is showing — the module renders the state it is GIVEN. */
  readonly filterValue?: string;
  /** The verb a rail choice emits, the chosen value appended (`<action>:<value>`). */
  readonly filterAction?: string;
  /** Accessible name for the rail. No English default (CC22). */
  readonly filterLabel?: string;
  /** Accessible name for a row's dismiss control. No English default (CC22). */
  readonly dismissLabel?: string;
  /** The one more-rows control; absent while the feed has nothing further. */
  readonly loadMore?: {
    readonly value: string;
    readonly label: string;
  };
  /** Accessible name for the bell trigger. No English default (CC22). */
  readonly label: string;
  /** The mark-all-read control's label. No English default (CC22). */
  readonly markReadLabel: string;
  /** The action verb the mark-all-read emit carries — the config names it, as the composer's does (mock/actions.ts protocol). */
  readonly markReadAction: string;
  readonly emptyTitle: string;
  /** The "view all" destination — legacy linked its dropdown to the account notifications page. */
  readonly viewAllTo: string;
  /** The "view all" link's label. No English default (CC22). */
  readonly viewAllLabel: string;
}

export type NotificationsModuleEmits = {
  select: [value: string];
};
