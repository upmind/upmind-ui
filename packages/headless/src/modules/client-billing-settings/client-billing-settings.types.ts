/**
 * @graphify-citation `graphify query "BillingSettingsModel BillingSettingsRecord
 * BillingSettingsContext ClientBillingSettingsContextTypes
 * CLIENT_BILLING_SETTINGS_SCOPE_MATRIX BillingSettingsUpdateBody
 * ClientBillingSettingsServices"` against `graphify-out/graph.json`
 * (2026-09-02, 14,886 nodes) — "No matching nodes found." Every type minted
 * below is net-new; none re-declares an existing node. `graphify-out/GRAPH_REPORT.md`
 * has no coverage of this module. `IClient`, `IClientBillingConsolidationForm`,
 * `InvoiceConsolidationTypes`, `InvoiceConsolidationRuleTypes`,
 * `DaysOfWeekTypes` and `BrandConfigKeys` are consumed unchanged from
 * `@upmind-automation/types`.
 */
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/client-billing-settings.types
 * @description Types for a client's own invoice-consolidation preference —
 * the query-backed read half (`useBillingSettings`) and the
 * `dataManagerMachine`-backed editor half (`useBillingSettingsManager`). Both
 * composables share the SAME scope matrix and context enum (design.md §4.2):
 * the entity being addressed is the settings, and a client has exactly one.
 */
import { ScopeActorTypes } from "../scope/scope.types";
import type { ResponseError } from "../../utils";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type {
  DefaultError,
  QueryKey,
  useQuery as vueUseQuery
} from "@tanstack/vue-query";
import type {
  DaysOfWeekTypes,
  IClient,
  IClientBillingConsolidationForm,
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes
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
 *         "client-billing-settings-manager" (editor). It mints its OWN model
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
 * read/edited. Single-member: a client has exactly one invoice-consolidation
 * preference. Named `SETTINGS`, not `CONSOLIDATION` — this module is the
 * future home of the CO-2/CO-3 billing slices the legacy
 * `clientBillingSettings.vue` page mounts alongside consolidation
 * (requirements.md §8.1).
 */
export enum ClientBillingSettingsContextTypes {
  /** A client's own billing settings. Single-member — a client has exactly one. */
  SETTINGS = "settings"
}

/**
 * Scope matrix shared by `useBillingSettings` and `useBillingSettingsManager`
 * — both composables scope on the same entity. `client` is the only actor
 * that resolves; `self`, `staff` and `guest` are `null as never`, which makes
 * `.as('staff')` / `.as('guest')` / `.as('self')` compile-time errors rather
 * than advertised-but-absent capabilities. Mirrors
 * `PERSONAL_DETAILS_SCOPE_MATRIX` (`client-personal-details.types.ts:57-62`).
 */
export const CLIENT_BILLING_SETTINGS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ClientBillingSettingsContextTypes.SETTINGS,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type, shared by both composables (derived from the runtime const). */
export type ClientBillingSettingsScopeMatrix =
  typeof CLIENT_BILLING_SETTINGS_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * The client's invoice-consolidation preference as read off the wire — the
 * five persisted fields plus the staged-import flag (row C14) that gates
 * editability.
 */
export type BillingSettingsRecord = {
  id: IClient["id"];
  enabled: InvoiceConsolidationTypes;
  baseRule: InvoiceConsolidationRuleTypes | null;
  dayOfWeek: DaysOfWeekTypes | null;
  dateOfMonthDay: number | null;
  dueDateDay: number | null;
  /** `true` while the client record is a staged, not-yet-processed import (row C14). */
  isStaged: boolean;
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
};

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
 * The reactive single-record read query, minted ONCE per scope in
 * `useBillingSettings.ts`. Mirrors `ClientPersonalDetailsRecordQuery` — no
 * platform-level alias exists for a REACTIVE single-object query (only
 * {@link ListQuery} does, for paginated collections), so this is a hand-typed
 * alias rather than `ReturnType<typeof loadSettings>`.
 */
export type ClientBillingSettingsRecordQuery = ReturnType<
  typeof vueUseQuery<IClient, DefaultError, BillingSettingsRecord>
> & {
  data: ComputedRef<BillingSettingsRecord>;
};

/**
 * The contract `createClientBillingSettingsServices` resolves to — consumed
 * by BOTH composables, so the read half and the editor half address the same
 * client through the same seam.
 */
export type ClientBillingSettingsServices = {
  /** The module's base cache key prefix (the resolved id + record segment are appended at request/invalidation time). */
  queryKey: QueryKey;
  /** The target client this scope resolved. */
  clientId: ComputedRef<string | undefined>;
  /** The reactive form of the ONE addressability predicate every request gate calls. */
  isAvailable: ComputedRef<boolean>;
  /** The last failed mutation, captured as state — never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** The reactive settings read, minted once per scope. */
  loadSettings: () => ClientBillingSettingsRecordQuery;
  /** One-shot settings read + the brand visibility gate, floored to the schema-parsed base model. */
  loadLookups: (
    context: BillingSettingsContext
  ) => Promise<Partial<BillingSettingsContext>>;
  /** Schema-parses a SET event's incoming data, restoring compacted falsy/null leaves (hazard H5). */
  parse: (
    context: BillingSettingsContext,
    data?: unknown
  ) => Promise<Partial<BillingSettingsContext>>;
  /** Schema validation against this scope's own lookups. */
  validate: (
    context: BillingSettingsContext
  ) => Promise<BillingSettingsModel | undefined>;
  /** Diff-only PUT of the model against its base. Refuses when the record is staged (row C14). */
  update: (
    model: BillingSettingsModel,
    baseModel?: BillingSettingsModel
  ) => Promise<IClient>;
  /** Invalidates the shared client-record cache prefix so every reader refetches. */
  refresh: () => Promise<void>;
};

/**
 * The XState services map handed to `dataManagerMachine.withConfig({ services })`.
 * One key per `invoke.src` the shared machine names — an omitted key crashes
 * on entering its state rather than failing to compile, so read
 * `data-manager/data-manager.machine.ts` before trimming this list.
 */
export type ClientBillingSettingsManagerMachineServices = {
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
