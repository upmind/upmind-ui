// -----------------------------------------------------------------------------
/**
 * @module client-notifications
 * @description Notification PREFERENCES — topics, channels, and the opt-out
 * set that governs which topic x channel pairs reach an account. Preferences
 * only: no inbox, no message list, no mark-as-read (the run's JTBD).
 *
 * HYBRID module — this barrel exports TWO scoped composables: the read-only
 * COLLECTION (`useClientNotifications`) and the editable draft MANAGER
 * (`useClientNotificationsManager`).
 *
 * This barrel is the module's ONLY public surface — `client-notifications.services.ts`
 * / `.mappers.ts` / `.schemas.ts` / `useClientNotificationsManager.machine.ts`
 * each carry their own `@internal` head marker and are never imported directly
 * by another module (`@internal/no-cross-module-imports`); never re-exported
 * wholesale (`@internal/no-barrel-imports`) — curated named re-exports only.
 *
 * NO SCHEMA EXPORTS HERE. The manager's `useSchema`/`useUischema` are adopted
 * by its machine (`setSchemas`) and reach consumers through
 * `useClientNotificationsManager().useContext().schema` / `.uischema`.
 *
 * @doctrine `code-composables.md` Part B "File Structure" ("Module
 * visibility: `index.ts` is the module's ONLY public surface") +
 * `code-quality.md`/`code-quality.companion.md` Module Visibility Law.
 */

// --- Composables (collection + manager)
export {
  useClientNotifications,
  type UseClientNotifications
} from "./useClientNotifications";
export {
  useClientNotificationsManager,
  type UseClientNotificationsManager
} from "./useClientNotificationsManager";

// --- Sub-composable type exports for consumers (collection)
export type { UseClientNotificationsActions } from "./useClientNotifications.actions";
export type { UseClientNotificationsContext } from "./useClientNotifications.context";
export type { UseClientNotificationsMeta } from "./useClientNotifications.meta";
export type { UseClientNotificationsInternals } from "./useClientNotifications.internals";

// --- Sub-composable type exports for consumers (manager)
export type { UseClientNotificationsManagerActions } from "./useClientNotificationsManager.actions";
export type { UseClientNotificationsManagerContext } from "./useClientNotificationsManager.context";
export type { UseClientNotificationsManagerMeta } from "./useClientNotificationsManager.meta";
export type { UseClientNotificationsManagerInternals } from "./useClientNotificationsManager.internals";

// --- Public item/model types (shared by both composables). NO context
// enum, NO matrix export (ruling A) — a module with no `.for()` publishes
// nothing a consumer could spell against it.
export type {
  NotificationChannel,
  NotificationsLookups,
  NotificationsModel,
  NotificationTopic,
  OptOut,
  OptOutRequestRow
} from "./client-notifications.types";
