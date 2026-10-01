// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings
 * @description A client's own invoice-consolidation preference — one scoped,
 * `dataManagerMachine`-backed editor (`useBillingSettings`).
 *
 * This barrel is the module's ONLY public surface —
 * `client-billing-settings.services.ts`, `.mappers.ts`, `.schemas.ts` and
 * `useBillingSettings.machine.ts` each carry a line-1 internal marker
 * and are never imported directly by another module. Curated named
 * re-exports only; no `export *`.
 */

// --- Composable (editor)
export {
  useBillingSettings,
  type UseBillingSettings
} from "./useBillingSettings";

// --- Scope matrix — public
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
  BillingSettingsUpdateBody
} from "./client-billing-settings.types";

// --- Sub-composable type exports for consumers
export type { UseBillingSettingsActions } from "./useBillingSettings.actions";
export type { UseBillingSettingsContext } from "./useBillingSettings.context";
export type { UseBillingSettingsMeta } from "./useBillingSettings.meta";
export type { UseBillingSettingsInternals } from "./useBillingSettings.internals";
