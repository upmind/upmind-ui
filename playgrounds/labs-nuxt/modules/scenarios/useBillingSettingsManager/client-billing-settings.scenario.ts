// -----------------------------------------------------------------------------
/**
 * @module scenarios/useBillingSettingsManager/client-billing-settings.scenario
 * @description The client-billing-settings scenario — ONE module, ONE
 * declaration (`R6-27`): a client's own invoice-consolidation preference,
 * edited through its `dataManagerMachine`-backed editor half. The module
 * ships no collection — `useBillingSettings().useContext().data` is one
 * record, not an array (`client-billing-settings.types.ts`) — so this
 * declares no `useList`, and the archetype resolves FORM_FLOW
 * (`docs/sdd/FE-3033/scenario-derivation.md`, `archetype.ts:43-60`).
 *
 * The DIRECTORY is the url segment and route name
 * (`/useBillingSettingsManager`), so nothing here declares a route. Nor a
 * scope: the page boots as self with no context, and only the url's
 * `/as/:actor` segment moves it — and since the manager serves only `client`
 * (`CLIENT_BILLING_SETTINGS_SCOPE_MATRIX`), the page is driven at
 * `/as/client`. `/as/staff` draws the unserved notice
 * (`useModulePort.ts:113-119`) — STAFF is the signed drop FE-3137.
 */

import { useBillingSettingsManager } from "@upmind-automation/headless";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/**
 * This scenario's key — the identity a `.feature` and the BDD world name it
 * by. HARD-PINNED: `client-billing-settings.steps.ts:33` declares this exact
 * value and boots with it at `:65`. Any other value breaks every track.
 */
export const CLIENT_BILLING_SETTINGS_SCENARIO = "client_billing_settings";

export default {
  key: CLIENT_BILLING_SETTINGS_SCENARIO,
  useMutate: useBillingSettingsManager,
  // `useList` is OMITTED — the module ships no collection.
  // `identifier` is OMITTED — identity is `id` (`DEFAULT_ROW_IDENTIFIER`,
  // `scenario.types.ts:48`).
  // `handoff` is OMITTED — the page IS the editor; `FormFlowSurface.vue:2-6`
  // is handed only `snapshot` + `actions` off the live port, never a
  // declared editor spec.
  // `persistCriteria` is OMITTED — `ownsQueryState()` is false
  // (`useModulePort.ts:42-45`); the url sync would no-op.
  tracks: "client-billing-settings",
  presentation: {
    // `table` / `card` / `actions` are OMITTED — FORM_FLOW mounts no
    // consumer for any of them (`FormFlowSurface.types.ts:22-25`, R6-29,
    // forbids restating the action pair the live port already exposes).
    icon: "icon-name"
  }
} satisfies ScenarioDeclaration;
