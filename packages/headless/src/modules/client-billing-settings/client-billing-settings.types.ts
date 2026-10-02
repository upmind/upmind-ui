/**
 * @graphify-citation `graphify query "BillingSettingsModel BillingSettingsRecord
 * BillingSettingsContext ClientBillingSettingsContextTypes
 * CLIENT_BILLING_SETTINGS_SCOPE_MATRIX BillingSettingsUpdateBody
 * ClientBillingSettingsServices"` against `graphify-out/graph.json`
 * (2026-09-02, 14,886 nodes) — "No matching nodes found." Every type minted
 * below is net-new; none re-declares an existing node. `graphify-out/GRAPH_REPORT.md`
 * has no coverage of this module. `IClient`, `IAccount`, `ICurrency`,
 * `IClientBillingConsolidationForm`, `InvoiceConsolidationTypes`,
 * `InvoiceConsolidationRuleTypes`, `DaysOfWeekTypes` and `BrandConfigKeys` are
 * consumed unchanged from `@upmind-automation/types`.
 *
 * @graphify-citation `graphify query "AccountCurrencyUpdateBody"` against
 * `graphify-out/graph.json` (2026-09-09) — "No matching nodes found."
 * `AccountCurrencyUpdateBody` (design.md §15.3) is net-new, added for the
 * account-currency slice folded in 2026-09-09.
 */
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/client-billing-settings.types
 * @description Types for a client's own invoice-consolidation preference —
 * the query-backed read half (`useBillingSettings`) and the
 * `dataManagerMachine`-backed editor half (`useBillingSettings`). Both
 * composables share the SAME scope matrix and `CLIENT` context enum
 * (design.md §4.2): the client whose settings are read/edited is named by a
 * matrix-gated `.for('client', id)` retarget, or falls back to the active
 * session — mirroring every sibling client module. (`graphify-out/graph.json`
 * — no new node; the context member is renamed, not minted.)
 */
import {
  AccessRoleTypes,
  DaysOfWeekTypes,
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { EnumOption, JsonSchema7 } from "@jsonforms/core";
import type { QueryKey } from "@tanstack/vue-query";
import type {
  IAccount,
  IClient,
  IClientBillingConsolidationForm
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------

/**
 * @decision Land the invoice-consolidation preference in a NEW SIBLING
 * module, `packages/headless/src/modules/client-billing-settings/`, rather
 * than extending either existing client module.
 *
 * what:   A net-new module at packages/headless/src/modules/client-billing-settings/,
 *         hybrid variant, registry names "client-billing-settings" (read) and
 *         "client-billing-settings" (editor). It mints its OWN model
 *         (BillingSettingsRecord / BillingSettingsModel / BillingSettingsUpdateBody).
 *         Neither packages/headless/src/modules/client/ nor .../client-personal-details/
 *         is modified.
 *
 * why:    The oracle already groups these fields under a page literally named
 *         clientBillingSettings — vue-app components/app/admin/clients/clientBillingSettings.vue,
 *         reached from views/client/billing/settings/index.vue and
 *         views/admin/upmind/billing/settings/index.vue — and that page mounts three
 *         FURTHER billing slices alongside consolidation. Those slices are CO-2 (FE-3039)
 *         and CO-3. This module is their shared home, not a one-off wrapper around five
 *         fields. Naming and locating it now is what stops CO-2 needing a second home
 *         decision.
 *
 * rejected: extending `client/` (see the `graphify-out/graph.json` citation atop this file):
 *         client/ is types + mappers only: client/index.ts exports no services and no
 *         composable. Its Client VM (client/client.types.ts:26-78) is the SHARED
 *         session-user view model consumed by session-store, auth, invoices and account;
 *         widening it pushes billing concerns into every session consumer. client/docs/
 *         foundation.md:54 explicitly places invoice_consolidation_* OUTSIDE that module's
 *         documented scope. And there is no precedent in this repo for a types+mappers leaf
 *         acquiring services — git-verified across all 12 such modules.
 *
 * rejected: extending `client-personal-details/` (graphify-out/graph.json, same citation):
 *         Its glossary definition, its ProfileModel (client-personal-details.types.ts:90-106)
 *         and its ProfileUpdateBody (:120-135) are all scoped to profile-IDENTITY fields; its
 *         schema (:81-91) and uischema (:121-135) enumerate four native controls plus custom
 *         fields. Adding five billing fields breaks that stated boundary and its filterFields
 *         grammar (types.ts:148-163), and puts a second, unrelated PUT clients/{id} diff into
 *         one mapper that is currently pinned by 12 must-fail patches and 4 recorded PUT
 *         fixtures. The blast radius of the edit exceeds the cost of the sibling.
 */

// -----------------------------------------------------------------------------
// SCOPE — ONE matrix, shared by both composables
// -----------------------------------------------------------------------------

/**
 * Context type for BOTH halves — WHICH client's settings are being
 * read/edited. `.for('client', id)` names the client being addressed; with
 * none, the seam falls back to the active session's own client. The member and
 * wire value match every sibling client module (`ClientPhonesContextTypes.CLIENT`
 * = `AccessRoleTypes.CLIENT`). (`graphify-out/graph.json` — no new node; the
 * member is renamed, not minted.)
 */
export enum ClientBillingSettingsContextTypes {
  /** Acting on a client's own billing settings. */
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * Scope matrix shared by `useBillingSettings` and `useBillingSettings`
 * — both composables scope on the same entity. `client` is the only actor
 * that resolves; `self`, `staff` and `guest` are `null as never`, which makes
 * `.as('staff')` / `.as('guest')` / `.as('self')` compile-time errors rather
 * than advertised-but-absent capabilities. Mirrors
 * `PERSONAL_DETAILS_SCOPE_MATRIX`.
 */
export const CLIENT_BILLING_SETTINGS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ClientBillingSettingsContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type, shared by both composables (derived from the runtime const). */
export type ClientBillingSettingsScopeMatrix =
  typeof CLIENT_BILLING_SETTINGS_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * Display copy for the three fixed pick-lists, keyed by the CONSUMED enum
 * members (AC3): a member added in `@upmind-automation/types` is a compile
 * error here, never a silently unlabelled choice. Module-level labelled
 * lookups live in the module's types file (`AddressTypes`,
 * `client-address.types.ts:112`); these are keyed maps rather than
 * `{ key, value }` arrays because the enum already exists upstream. The
 * strings are LEGACY's own English (`vue-app/public/languages/en/`:
 * `_sentence.json` → `invoice.enable_consolidation_label` /
 * `invoice.disable_consolidation_label`, `_.json` → the rule keys). Legacy
 * renders no third radio — INHERIT is its "Default" tag plus an un-press
 * (`URadioSelectorWithDefault.vue`); here it is a segment of its own, named
 * for what it does.
 * (graphify-out/graph.json — no existing label map for these enums; net-new.)
 */
export const CONSOLIDATION_LABEL: Readonly<
  Record<InvoiceConsolidationTypes, string>
> = {
  [InvoiceConsolidationTypes.DISABLED]: "Do NOT consolidate invoices",
  [InvoiceConsolidationTypes.ENABLED]: "Consolidate invoices",
  [InvoiceConsolidationTypes.INHERIT]: "Inherit from brand"
};

/** When the one consolidated invoice is raised — legacy's `_.json` strings. */
export const RULE_LABEL: Readonly<
  Record<InvoiceConsolidationRuleTypes, string>
> = {
  [InvoiceConsolidationRuleTypes.DAILY]: "Daily",
  [InvoiceConsolidationRuleTypes.DAY_OF_WEEK]: "Specific day of the week",
  [InvoiceConsolidationRuleTypes.DAY_OF_MONTH]: "Specific day of the month",
  [InvoiceConsolidationRuleTypes.FIRST_DAY_OF_MONTH]: "First day of the month",
  [InvoiceConsolidationRuleTypes.LAST_DAY_OF_MONTH]: "Last day of the month"
};

/** The days a weekly consolidation may fall on. */
export const WEEKDAY_LABEL: Readonly<Record<DaysOfWeekTypes, string>> = {
  [DaysOfWeekTypes.MONDAY]: "Monday",
  [DaysOfWeekTypes.TUESDAY]: "Tuesday",
  [DaysOfWeekTypes.WEDNESDAY]: "Wednesday",
  [DaysOfWeekTypes.THURSDAY]: "Thursday",
  [DaysOfWeekTypes.FRIDAY]: "Friday",
  [DaysOfWeekTypes.SATURDAY]: "Saturday",
  [DaysOfWeekTypes.SUNDAY]: "Sunday"
};

/**
 * The form/request model for the editor. Every field optional (`Partial`
 * shaped, mirroring `ProfileModel`), because the model parser compacts and
 * the diff mapper reads absence as "untouched".
 *
 * `enabled` is deliberately NOT `| null` — hazard X3/H5. "Follow the brand"
 * is the third enum member `InvoiceConsolidationTypes.INHERIT`, not absence,
 * so this field is never modelled nullable. The other four fields ARE
 * nullable: `null` means "follow the brand's value for this field"
 * (`packages/types/src/models/clients.ts:58-62`).
 */
export type BillingSettingsModel = {
  enabled?: InvoiceConsolidationTypes;
  baseRule?: InvoiceConsolidationRuleTypes | null;
  dayOfWeek?: DaysOfWeekTypes | null;
  dateOfMonthDay?: number | null;
  dueDateDay?: number | null;
  /**
   * The account's own billing currency (row B5) — never modelled nullable:
   * the oracle marks it `rules="required"` (`basicForm:15`), so it only ever
   * carries a real currency id.
   */
  currencyId?: IAccount["currency_id"];
  /**
   * The account's preferred payment currency, or `null` to clear it (row B4).
   * Absent from the model entirely when row B6's brand gate is closed — see
   * `client-billing-settings.services.ts:loadLookups`. Hazard H5b (row X5):
   * the `null` clear must survive `useModelParser`'s compaction — see
   * `restoreCompactedFields`.
   */
  preferredPaymentCurrencyId?: IAccount["preferred_payment_currency_id"];
  /**
   * READ-ONLY, rules-only: the brand's consolidation defaults and the client's
   * `never_suspend` flag ride in the form data so the uischema rules can see
   * them (legacy gates its schedule fields on both). Never written — the diff
   * mappers key on the five consolidation fields and the two currencies only.
   * (graphify-out/graph.json — net-new; see `BrandConsolidationDefaults`.)
   */
  brand?: BrandConsolidationDefaults;
  neverSuspend?: boolean;
};

/**
 * The `PUT accounts/{accountId}` body `mapIAccountCurrencyFields` produces —
 * the account's own two writable keys, never the client's (design.md §15.3).
 * A SEPARATE type from `BillingSettingsUpdateBody`: `preferred_payment_currency_id`
 * is an `IAccount` key, and `BillingSettingsUpdateBody` is a `Pick` over five
 * `IClient` keys — widening it to carry an `IAccount` key is a compile error
 * by that type's own design. Net-new (see the @graphify-citation, top of
 * file, graphify-out/graph.json — "No matching nodes found").
 */
export type AccountCurrencyUpdateBody = Partial<
  Pick<IAccount, "currency_id" | "preferred_payment_currency_id">
>;

/**
 * The `PUT clients/{id}` body `mapIBillingSettingsFields` produces —
 * `Partial<IClientBillingConsolidationForm>` rather than five restated keys,
 * so a future field addition to that `Pick` in `packages/types` is a compile
 * error here rather than a silent gap (AC3).
 */
export type BillingSettingsUpdateBody =
  Partial<IClientBillingConsolidationForm>;

/**
 * The manager's machine context — the shared machine's, over this form
 * model. `lookups.restrictToStaff` (row O8) is read via the generic
 * `lookups?: Record<string, any[]>` `DataManagerContext` already declares —
 * never widened here, matching `ProfileContext`'s own precedent.
 */
export type BillingSettingsContext = DataManagerContext<BillingSettingsModel>;

/**
 * A schema property that also carries the pick-list the enum renderers read
 * (`EnumRenderer.vue`: `schema.options || control.options`) — `options` is
 * not a core schema keyword; `text` is the secondary label the tile/toggle
 * renderers draw beside an option (legacy's "Default" tag).
 * (graphify-out/graph.json: no headless or types node declares this shape;
 * the option entry itself is `@jsonforms/core`'s.)
 */
export type OptionedSchema = JsonSchema7 & {
  options?: (EnumOption & { text?: string })[];
};

/**
 * The brand's own consolidation defaults, READ-ONLY in the form data so the
 * uischema rules can read them — legacy gates its schedule fields on the
 * brand (`showBasicRuleFields`, `effectiveBaseRule`). `enabled` is the
 * brand's boolean flag as the wire carries it (legacy `enabledBV`: truthy =
 * ENABLED). (graphify-out/graph.json — net-new; consumed from
 * `config/brand/values`, never written back.)
 */
export type BrandConsolidationDefaults = {
  enabled?: boolean;
  baseRule?: InvoiceConsolidationRuleTypes | null;
  dayOfWeek?: DaysOfWeekTypes | null;
  dateOfMonthDay?: number | null;
};

/**
 * The contract `createClientBillingSettingsServices` resolves to — the editor
 * addresses its client through this one seam.
 */
export type ClientBillingSettingsServices = {
  /** The module's base cache key prefix. */
  queryKey: QueryKey;
  /** The target client this scope resolved. */
  clientId: ComputedRef<string | undefined>;
  /** The reactive form of the ONE addressability predicate every request gate calls. */
  isAvailable: ComputedRef<boolean>;
  /** One-shot record + account read + both brand gates, floored to the schema-parsed base model. */
  loadLookups: (
    context: BillingSettingsContext
  ) => Promise<Partial<BillingSettingsContext>>;
  /**
   * Row O8's AND row B6's brand gates, resolved via ONE
   * `useBrand().ensureConfig()` call and returned as two separately-named,
   * separately-polarised values (design.md §15.6) — never conflated. Consumes
   * `ensureConfig()`'s own settled return value — never re-read afterward
   * through `useBrand().getConfigValue()`'s reactive computed, which is fed
   * by a module-singleton query `useBrand()` never re-fetches once mounted
   * elsewhere in the app (`useBrand.ts:69`, `brandConfigQuery ??= ...`).
   * (`graphify query "loadVisibility restrictToStaff" graphify-out/graph.json`
   * — no matching node; net-new member of this module's own service
   * contract, no cross-module surface.)
   */
  loadBrandGates: () => Promise<{
    restrictToStaff: boolean | undefined;
    differentCurrencyPayment: boolean | undefined;
    /** The brand's own consolidation defaults, from the SAME call (graphify-out/graph.json — `BrandConsolidationDefaults`). */
    defaults: BrandConsolidationDefaults;
  }>;
  /** Schema-parses a SET event's incoming data, restoring compacted falsy/null leaves (hazard H5/H5b). */
  parse: (
    context: BillingSettingsContext,
    data?: unknown
  ) => Promise<Partial<BillingSettingsContext>>;
  /** Schema validation against this scope's own lookups. */
  validate: (
    context: BillingSettingsContext
  ) => Promise<BillingSettingsModel | undefined>;
  /** Diff-only PUT of the model against its base. */
  update: (
    model: BillingSettingsModel,
    baseModel?: BillingSettingsModel
  ) => Promise<IClient>;
  /**
   * Diff-only PUT of the account currencies against their base (rows
   * B4/B5/B9). Refuses when the addressed client is not the session's own
   * (row X7) or the payment-currency choice is not offered (row B6) — before
   * issuing any request.
   */
  updateAccountCurrencies: (
    model: BillingSettingsModel,
    baseModel?: BillingSettingsModel
  ) => Promise<IAccount>;
  /** Invalidates the shared client-record cache prefix so every reader refetches. */
  refresh: () => Promise<void>;
  /** Marks this scope's own account read stale so the next read refetches, keeping the rows. */
  invalidate: () => Promise<unknown>;
  /** Drops this scope's own account read so the next read starts from loading. */
  reset: () => Promise<unknown>;
};

/**
 * The XState services map handed to `dataManagerMachine.withConfig({ services })`.
 * One key per `invoke.src` the shared machine names — an omitted key crashes
 * on entering its state rather than failing to compile, so read
 * `data-manager/data-manager.machine.ts` before trimming this list.
 */
export type ClientBillingSettingsMachineServices = {
  /** `loading` — the context patch the form starts from. */
  loadLookups: (
    context: BillingSettingsContext
  ) => Promise<Partial<BillingSettingsContext>>;
  /** `available.checking.parsing` — schema-parses whatever the SET event carried. */
  parse: (
    context: BillingSettingsContext,
    event: AnyEventObject
  ) => Promise<Partial<BillingSettingsContext>>;
  /** `available.checking.validating` and `processing.validating`. */
  validate: (
    context: BillingSettingsContext
  ) => Promise<BillingSettingsModel | undefined>;
  /**
   * `processing.adding` — never reached: a client's settings always exist
   * once its id resolves, so the shared machine's `isNew` guard (`!id`)
   * never passes here. Present because the machine names this key on
   * `invoke.src`; an omitted key crashes rather than failing to compile.
   */
  add: (context: BillingSettingsContext) => Promise<BillingSettingsModel>;
  /**
   * `processing.updating` — reached once the context carries the resolved
   * client id. Resolves with a `BillingSettingsModel` (never the raw
   * `IClient`) — the machine's `setModel` re-parses this against
   * `schema`/`baseModel` by SCHEMA PROPERTY KEY (camelCase), so a raw wire
   * response would parse to all-null and blank the form immediately after a
   * successful save.
   */
  update: (context: BillingSettingsContext) => Promise<BillingSettingsModel>;
};
