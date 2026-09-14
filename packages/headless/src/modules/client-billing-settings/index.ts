// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings
 * @description A client's own invoice-consolidation preference. This module
 * ships TWO scoped composables: the query-backed read half
 * (`useBillingSettings`) and the `dataManagerMachine`-backed editor half
 * (`useBillingSettingsManager`).
 *
 * This barrel is the module's ONLY public surface —
 * `client-billing-settings.services.ts`, `.mappers.ts`, `.schemas.ts` and
 * `useBillingSettingsManager.machine.ts` each carry a line-1 internal marker
 * and are never imported directly by another module. Curated named
 * re-exports only; no `export *`.
 */

// --- Composables (read + editor)
export {
  useBillingSettings,
  type UseBillingSettings
} from "./useBillingSettings";
export {
  useBillingSettingsManager,
  type UseBillingSettingsManager
} from "./useBillingSettingsManager";

// --- Scope matrix — shared by both composables, public
export {
  CLIENT_BILLING_SETTINGS_SCOPE_MATRIX,
  ClientBillingSettingsContextTypes
} from "./client-billing-settings.types";
export type { ClientBillingSettingsScopeMatrix } from "./client-billing-settings.types";

// --- Public model types
export type {
  AccountCurrencyUpdateBody,
  BillingSettingsContext,
  BillingSettingsModel,
  BillingSettingsRecord,
  BillingSettingsUpdateBody
} from "./client-billing-settings.types";

// --- Sub-composable type exports for consumers (read half)
export type { UseBillingSettingsActions } from "./useBillingSettings.actions";
export type { UseBillingSettingsContext } from "./useBillingSettings.context";
export type { UseBillingSettingsMeta } from "./useBillingSettings.meta";
export type { UseBillingSettingsInternals } from "./useBillingSettings.internals";

// --- Sub-composable type exports for consumers (editor half)
export type { UseBillingSettingsManagerActions } from "./useBillingSettingsManager.actions";
export type { UseBillingSettingsManagerContext } from "./useBillingSettingsManager.context";
export type { UseBillingSettingsManagerMeta } from "./useBillingSettingsManager.meta";
export type { UseBillingSettingsManagerInternals } from "./useBillingSettingsManager.internals";
