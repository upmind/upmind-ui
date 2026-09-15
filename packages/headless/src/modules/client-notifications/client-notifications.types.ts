// -----------------------------------------------------------------------------
/**
 * @graphify-citation `graphify-out/graph.json` carries no existing
 * `NotificationTopic`/`NotificationChannel`/`OptOut` node — these types are
 * new ground, not a duplicate.
 *
 * @module client-notifications/client-notifications.types
 * @description Notification preferences — topics, channels, and the opt-out
 * set governing which topic x channel pairs reach an account (no inbox, no
 * message list). Hybrid: one file for BOTH the query-backed collection and the
 * `dataManagerMachine`-backed manager; each owns its scope matrix, the
 * view-model and services contracts are shared.
 */

import { ScopeActorTypes } from "../scope/scope.types";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { ListQuery, PaginationInfo } from "../query";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type {
  INotificationChannel,
  INotificationTopic,
  IOptOut
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
// COLLECTION SCOPE (half one)
// -----------------------------------------------------------------------------

/**
 * @decision
 * what:     Mint no context enum; declare both scope matrices with every actor
 *           cell `null as never`, and no GUEST cell at all.
 * why:      Every endpoint is session-implicit — no `clients/{id}` segment and
 *           no acting-as parameter — so staff `.for('client', id)` retargeting
 *           has no basis, and the all-`never` matrix makes `.for()` unspellable.
 *           The module is client-only: a signed-in client reads via bearer, and
 *           an unauthenticated client reads via the emailed `?token=` link,
 *           carried on `.as('client').withId(token)`. There is no guest case —
 *           an anonymous guest token is rejected by every endpoint.
 * rejected: A context enum, or a GUEST cell, "for later" — a claimed capability
 *           with nothing behind it: right shape, green gates, no capability.
 */
export const CLIENT_NOTIFICATIONS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never
} as const;

/** Collection scope matrix type (derived from the runtime const above). */
export type ClientNotificationsScopeMatrix =
  typeof CLIENT_NOTIFICATIONS_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// MANAGER SCOPE (half two)
// -----------------------------------------------------------------------------

/**
 * Separate from the collection's matrix: the two composables scope
 * independently, so they cannot share one. Same all-`never` shape and basis.
 */
export const CLIENT_NOTIFICATIONS_MANAGER_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never
} as const;

/** Manager scope matrix type (derived from the runtime const above). */
export type ClientNotificationsManagerScopeMatrix =
  typeof CLIENT_NOTIFICATIONS_MANAGER_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SHARED VIEW MODEL
// -----------------------------------------------------------------------------

export type NotificationTopic = {
  id: string;
  name: string;
  description: string;
  code: string;
  /**
   * Optional, not a typed lie: the wire field is genuinely absent, so a
   * consumer must handle the missing case. `canOptOut`, not this, is the
   * single source for the locked-topic guard and its label.
   */
  mandatory?: boolean;
  /** `false` means the topic is locked: no actor may opt out of it (AC-6). */
  canOptOut: boolean;
  /**
   * Presentation-only status flags derived from `canOptOut` — the same source
   * `isTopicLocked` reads. `TableCellBadges` reads a boolean-flag object, so a
   * flag cannot scope directly to a primitive field.
   */
  meta: {
    /** `true` when the topic is locked (`!canOptOut`). */
    isMandatory: boolean;
    /** `true` when at least one channel is opted out. */
    hasOptOuts?: boolean;
  };
};

export type NotificationChannel = {
  id: string;
  name: string;
  code: string;
};

/** One opted-out topic x channel pair. Absence from this set means ENABLED. */
export type OptOut = {
  topicId: string;
  channelId: string;
};

/**
 * The write body's OWN type — the PUT body has no `id`/`created_at`/
 * `updated_at`, so no cast is needed anywhere this type is produced or consumed.
 */
export type OptOutRequestRow = {
  topic_id: string;
  channel_id: string;
};

/**
 * The manager's draft — a flat boolean record keyed `"<topicId>::<channelId>"`
 * (`preferenceKey`), one entry per topic x channel pair, `true` meaning
 * enabled. `optOuts` is not a model field: no JSON Pointer can address "is
 * pair present" against an array of rows. The wire array is a projection
 * computed at the write boundary (`writeOptOuts`), never stored here.
 */
export type NotificationsModel = {
  preferences: Record<string, boolean>;
};

/** Reference data both the collection and the manager read (`lookups`). */
export type NotificationsLookups = {
  topics: NotificationTopic[];
  channels: NotificationChannel[];
};

/**
 * Aliased from the query platform's own `ListQuery` — never derived with
 * `ReturnType<typeof localServiceFn>` (`query.types.ts`'s own ban).
 */
export type NotificationsListQuery<TWire, TView> = ListQuery<TWire[], TView[]>;

/**
 * The services contract both composables consume. One factory serves both
 * halves — one identity seam, one cache key, one arm-resolution switch.
 */
export type NotificationsServices = {
  /** COLLECTION + MANAGER — the full topic list, `limit: 0`. */
  loadTopics: () => NotificationsListQuery<
    INotificationTopic,
    NotificationTopic
  >;
  /** COLLECTION + MANAGER — the full client-recipient channel list, `limit: 0`. */
  loadChannels: () => NotificationsListQuery<
    INotificationChannel,
    NotificationChannel
  >;
  /** COLLECTION + MANAGER — the full opt-out set, `limit: 0`. */
  loadOptOuts: () => NotificationsListQuery<IOptOut, OptOut>;
  /**
   * MANAGER — full-set PUT; carries every currently-opted-out row, never a
   * diff. Takes the wire body's own row type directly: the boolean-record ->
   * wire-row projection (`writeOptOuts`) has already run.
   */
  update: (rows: OptOutRequestRow[]) => Promise<void>;
  /** Invalidates the opt-outs cache key so the collection refetches after a save. */
  refresh: () => Promise<void>;
  /** The resolved client id for an authenticated client; undefined when the client reads via a `?token=` link instead. */
  clientId: ComputedRef<string | undefined>;
  /**
   * The one actor-blind addressability predicate:
   * `!!token || (isAuthenticated && !!clientId)`. Every read's `guard`/`enabled`
   * resolves off this, computed once here and also published as meta
   * read-state — never recomputed per layer.
   */
  isAvailable: ComputedRef<boolean>;
};

/** The manager's derived-from-lookups schema/uischema pair. */
export type NotificationsSchemas = {
  useSchema: (lookups: NotificationsLookups) => JsonSchema7;
  useUischema: (lookups: NotificationsLookups) => UISchemaElement;
};

/**
 * The debugging-only, read-side projection published per query, never the raw
 * `ListQuery`: every criteria write verb is absent at runtime and unspellable
 * at build time, and `queryKey` is the stable prefix only, never the identity
 * salt. `pagination` is the query's read-only `PaginationInfo` echo.
 */
export type NotificationsInternalsQuery<TView> = {
  data: { readonly value: TView[] };
  error: { readonly value: unknown };
  isFetched: { readonly value: boolean };
  queryKey: readonly unknown[];
  pagination: ComputedRef<PaginationInfo>;
  refetch: () => Promise<unknown>;
};

// -----------------------------------------------------------------------------
// MANAGER (hybrid half two — the `dataManagerMachine`-backed form editor)
// -----------------------------------------------------------------------------

/**
 * Machine-local identity for the always-PUT aggregate. Never reaches the wire —
 * `update()` builds `notifications/opt-outs` with no id segment. Any stable
 * non-empty string works identically.
 */
export const OPT_OUTS_AGGREGATE_ID = "opt-outs";

/**
 * The manager's machine context — the shared, PROTECTED `DataManagerContext`,
 * unextended: this module needs no extra field.
 *
 * @decision
 * what:     No `token` field — it stays in the composable's closure, threaded
 *           into `hasSubscription` and `addressableOutcome()` directly.
 * why:      `useInternals().state` publishes context, so a closure-only token
 *           closes the last reachable path to the raw secret.
 * rejected: Redacting `token` from `useInternals()` — changes the shape every
 *           hybrid `.internals.ts` carries.
 */
export type NotificationsContext = DataManagerContext<NotificationsModel>;

/**
 * The XState services map `useClientNotificationsManager.machine.ts` hands to
 * `dataManagerMachine.withConfig({ services })`. Read
 * `data-manager/data-manager.machine.ts` before adding or removing a key — a
 * missing one is a runtime crash on entering that state, not a type error.
 */
export type NotificationsManagerMachineServices = {
  /** `loading` — awaits all three reads settled; seeds `model`/`baseModel`/`lookups`. */
  loadLookups: (
    context: NotificationsContext
  ) => Promise<Partial<NotificationsContext>>;
  /** `available.checking.parsing` — schema-parses the incoming SET payload. */
  parse: (
    context: NotificationsContext,
    event: AnyEventObject
  ) => Promise<Partial<NotificationsContext>>;
  /** `available.checking.validating` + `processing.validating`. */
  validate: (
    context: NotificationsContext
  ) => Promise<NotificationsModel | undefined>;
  /**
   * Unreachable in normal operation — the seeded `id` keeps `isNew` always
   * false, so every save routes to `update`. Kept only because the shared
   * machine's services map requires it; delegates to the same PUT as `update`.
   */
  add: (context: NotificationsContext) => Promise<unknown>;
  /** `processing.updating` — always reached. The full-set PUT. */
  update: (context: NotificationsContext) => Promise<unknown>;
};
