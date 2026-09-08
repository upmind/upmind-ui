// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/user-notifications
 * @description Four-layer contract for the `user-notifications` module
 * headless does not have yet (plan §3): the notification collection behind
 * the header dropdown and the notifications page (`useUserNotifications`), and
 * the preference matrix (`useNotificationPreferences`). Rows are the wire
 * `IUserNotification`; topics are `INotificationTopic`.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area — the header
 * notification dropdown (all/read/unread, dismiss, load more) and the
 * notification preferences page (topics × channels, mandatory locked);
 * gap-doc rows "4. Account → Notifications".
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { NO_ACTOR_CONTEXT, SCOPE_ACTOR } from "./scope";
import type { ContractInternals } from "./scope";
import type {
  ActorContextMatrix,
  PaginationInfo,
  RequestSortDirection,
  ResponseError,
  useCollection
} from "@upmind-automation/headless";
import type {
  INotificationTopic,
  IUserNotification,
  NotificationChannelCodes
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * One cell of the preference matrix — a topic's setting on one channel.
 *
 * @decision Portal-local. The wire carries opt-OUT rows (`IOptOut`) rather
 * than a matrix; searched `packages/types` for `INotificationPreference` and
 * found none, so the rendered cell is named here.
 */
export type NotificationPreference = {
  /** The topic this cell belongs to. */
  topicId: INotificationTopic["id"];
  /** The channel this cell belongs to. */
  channel: NotificationChannelCodes;
  /** True while the client receives this topic on this channel. */
  enabled: boolean;
  /** True while the client cannot opt out — the locked rows. */
  mandatory: INotificationTopic["mandatory"];
};

/**
 * What the preferences form writes — one boolean per topic × channel, keyed
 * `<topicCode>__<channel>`. A matrix has no fixed field set, so the model is
 * a flat map the schema builds from the topics the brand publishes
 * (`user-notifications.schemas.ts`), exactly as the custom-fields form does.
 */
export type NotificationPreferencesModel = Record<string, boolean>;

/**
 * What the per-address opt-in form writes — one boolean per topic, keyed by
 * the topic's own id. Legacy derives `receive_emails` from these server-side,
 * so the topics ARE the control and there is no master switch beside them.
 */
export type EmailTopicOptInsModel = Record<string, boolean>;

/** What the opt-in schema is handed — the topics on offer, and the address they are for. */
export type EmailTopicOptInsContext = {
  /** The topics this brand lets one address subscribe to. */
  readonly topics: readonly EmailTopicRow[];
  /** The address the form is about — the intro line names it. */
  readonly email: string;
  /** Which of `topics` the address is subscribed to today. */
  readonly optIns: readonly string[];
};

/** One topic as the opt-in form reads it. */
export type EmailTopicRow = {
  readonly id: INotificationTopic["id"];
  readonly label: string;
  readonly description?: string;
  /**
   * The ACCOUNT has opted out of this topic on the email channel, so no single
   * address can opt back in — legacy locked the switch and said why
   * (`manageEmailTopicOptIns.vue:110-125`). The reason IS the disabled state,
   * so there is no second flag to keep in step with it.
   */
  readonly disabledReason?: string;
};

/** What the preferences schema is handed — the matrix on file. */
export type NotificationPreferencesContext = {
  readonly preferences: readonly NotificationPreferenceRow[];
};

/** One topic's row of the matrix, as the schema reads it. */
export type NotificationPreferenceRow = {
  readonly topicId: INotificationTopic["id"];
  /** What the topic is called to a client. */
  readonly label: string;
  /** True while the client cannot opt out — the locked rows. */
  readonly mandatory: INotificationTopic["mandatory"];
  /** One flag per channel the brand notifies on; a channel it does not use carries none. */
  readonly channels: Readonly<
    Partial<Record<NotificationChannelCodes, boolean>>
  >;
};

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/** Context types for the notification COLLECTION — whose feed is read. */
export const UserNotificationsContextTypes = {
  /** Reading a client's own notification feed. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type UserNotificationsContextTypes =
  (typeof UserNotificationsContextTypes)[keyof typeof UserNotificationsContextTypes];

/**
 * Scope matrix for `useUserNotifications`. `client` is the only actor that
 * resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const USER_NOTIFICATIONS_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: UserNotificationsContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useUserNotifications`. */
export type UserNotificationsScopeMatrix =
  typeof USER_NOTIFICATIONS_SCOPE_MATRIX;

/** Context types for the preference matrix — whose preferences are read. */
export const NotificationPreferencesContextTypes = {
  /** Reading a client's own notification preferences. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type NotificationPreferencesContextTypes =
  (typeof NotificationPreferencesContextTypes)[keyof typeof NotificationPreferencesContextTypes];

/** Scope matrix for `useNotificationPreferences`. Separate from the feed's. */
export const NOTIFICATION_PREFERENCES_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: NotificationPreferencesContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useNotificationPreferences`. */
export type NotificationPreferencesScopeMatrix =
  typeof NOTIFICATION_PREFERENCES_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** Wire columns the notification feed can be sorted by. */
export const UserNotificationsSortableProperties = {
  DEFAULT: "created_at",
  DATE_CREATED: "created_at"
} as const;

export type UserNotificationsSortableProperties =
  (typeof UserNotificationsSortableProperties)[keyof typeof UserNotificationsSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/** The feed's named filters — the dropdown's all / read / unread control. */
export type UserNotificationsFilters = {
  /** Narrows to read or unread; absent is "all". */
  read: (value?: boolean) => void;
};

// -----------------------------------------------------------------------------
// LAYERS — useUserNotifications (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of notifications and its lookups. */
export type UseUserNotificationsContext = {
  /** The reactive current page of this scope's notifications. */
  data: ComputedRef<IUserNotification[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one notification on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<IUserNotification>>["findOne"];
  /** Finds one notification on the page by id. */
  getOne: ReturnType<typeof useCollection<IUserNotification>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseUserNotificationsMeta = {
  /** True if the list query or a mutation failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this scope has no notifications. */
  isEmpty: ComputedRef<boolean>;
  /** True while the list is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while there is a further page beyond the current one. */
  hasNextPage: ComputedRef<boolean>;
  /** True while there is a page before the current one. */
  hasPrevPage: ComputedRef<boolean>;
  /** True while the list spans more than one page. */
  hasPages: ComputedRef<boolean>;
};

/** Collection actions — list controls, the feed's verbs, and lifecycle. */
export type UseUserNotificationsActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: UserNotificationsFilters;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the collection is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Fetches the next page — the dropdown's load-more accumulates on this. */
  nextPage: () => void;
  /** Fetches the previous page. */
  prevPage: () => void;
  /** Refetches the list from the server. */
  refresh: () => Promise<void>;
  /** Sorts the list by the given property and direction. */
  sort: (
    property?: UserNotificationsSortableProperties,
    direction?: RequestSortDirection
  ) => void;
  /** Dismisses one notification. */
  dismiss: (id: IUserNotification["id"]) => Promise<void>;
  /** Marks every notification in the feed as read. */
  markAllRead: () => Promise<void>;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseUserNotificationsInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useNotificationPreferences (read)
// -----------------------------------------------------------------------------

/** Preferences context — the matrix the page renders as a form. */
export type UseNotificationPreferencesContext = {
  /** The topics the brand notifies this client about. */
  topics: ComputedRef<INotificationTopic[]>;
  /** The channels those topics can arrive on. */
  channels: ComputedRef<NotificationChannelCodes[]>;
  /** One cell per topic × channel. */
  preferences: ComputedRef<NotificationPreference[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
};

/** Preferences meta — one computed per state flag. */
export type UseNotificationPreferencesMeta = {
  /** True if the read failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True once the first read has completed, regardless of outcome. */
  isComplete: ComputedRef<boolean>;
  /** True if the brand publishes no topics. */
  isEmpty: ComputedRef<boolean>;
  /** True while the read is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
};

/** Preferences actions — the matrix's own write, plus lifecycle. */
export type UseNotificationPreferencesActions = {
  /** Saves the whole matrix; mandatory topics are the brand's and never move. */
  save: (model: NotificationPreferencesModel) => Promise<void>;
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the matrix is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the matrix from the server. */
  refresh: () => Promise<void>;
};

/** Preferences internals (debugging) — exempt from conformance. */
export type UseNotificationPreferencesInternals = ContractInternals;
