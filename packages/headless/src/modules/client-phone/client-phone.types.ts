/**
 * @graphify-citation `graphify query "client phone"` (2026-08-08, BFS depth 2,
 * 303 nodes) — `Phone` / `PhoneModel` / `PhoneContext` (community 8) and
 * `IPhoneData` (community 21) already live in this file, so the conversion
 * ADDS the two scope matrices and context enums here rather than minting a new
 * types module. `ClientPhonesContextTypes` / `ClientPhoneContextTypes` have no
 * existing graph node — confirmed absent from the traversal — so minting them
 * is warranted, not a duplicate. See `./docs/architecture.md`
 * §0 and `graphify-out/GRAPH_REPORT.md`.
 *
 * `graphify query "client-phone query model QueryModel FilterModel SortModel"`
 * (2026-08-22) — the only `QueryModel`/`FilterModel`/`SortModel` nodes in
 * `graphify-out/graph.json` belong to `client-email.types.ts:153,165`, a
 * different module; no node for this module exists, so minting the QUERY
 * MODEL section below is warranted, not a duplicate.
 */
// -----------------------------------------------------------------------------
/**
 * @module client-phone/client-phone.types
 * @description Types for a client's own phone numbers — the query-backed
 * collection (`useClientPhones`) and the `dataManagerMachine`-backed per-phone
 * form editor (`useClientPhoneManager`). Each composable owns its own context
 * enum and scope matrix; the phone model, the services contract and the
 * mappers are shared, which is what keeps ONE identity seam for both halves.
 */

// `SortDirection` is read at MODULE scope below (DEFAULT_SORT), so it comes
// from its declaring file — see the QUERY MODEL section's graphify-out/
// citation for why this section mints rather than re-derives.
import { AccessRoleTypes } from "@upmind-automation/types";
import { SortDirection } from "../query/query.types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ResponseError } from "../../utils";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { ListQuery } from "../query";
import type { JsonSchema7 } from "@jsonforms/core";
import type { QueryKey } from "@tanstack/vue-query";
import type { ICountry, IPhone } from "@upmind-automation/types";
import type { ComputedRef } from "vue";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/** Context types for the phone COLLECTION — whose list is being addressed. */
export enum ClientPhonesContextTypes {
  /** Acting on a client's phone collection. */
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * Scope matrix for `useClientPhones`. `client` is the only actor that resolves;
 * `staff` and `guest` are `null as never`, which makes `.as('staff')` a
 * compile-time error rather than an advertised-but-absent capability (operator
 * ruling 1, 2026-08-08 — every staff capability the oracle demonstrates is
 * recorded as a signed drop in this bundle's `parity.yaml`, cells B and C —
 * see also `graphify-out/GRAPH_REPORT.md`).
 */
export const CLIENT_PHONES_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ClientPhonesContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientPhones` (derived from the runtime const). */
export type ClientPhonesScopeMatrix = typeof CLIENT_PHONES_SCOPE_MATRIX;

/**
 * Context types for the per-phone MANAGER — which record is being edited. The
 * context names the ENTITY, not its owner: the owning client falls through the
 * same `resolveClientId` seam as every other call.
 */
export enum ClientPhoneContextTypes {
  /** Editing one existing phone by id. */
  PHONE = "phone"
}

/**
 * Scope matrix for `useClientPhoneManager`. Separate from the collection's —
 * the two composables scope on different things and cannot share one.
 */
export const CLIENT_PHONE_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ClientPhoneContextTypes.PHONE,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientPhoneManager` (derived from the runtime const). */
export type ClientPhoneScopeMatrix = typeof CLIENT_PHONE_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * Interface representing parsed phone number data, typically from a phone number parsing utility.
 */
export interface IPhoneData {
  /**
   * The national format of the phone number.
   */
  nationalNumber: string;
  /**
   * The country calling code.
   */
  countryCallingCode: string;
  /**
   * The two-letter ISO country code.
   */
  country: string;
}

/**
 * Interface representing the data model for a phone number, suitable for forms
 * or API payloads.
 */
export interface PhoneModel {
  /**
   * Optional unique identifier for the phone number. Present if editing an existing phone number.
   */
  id?: IPhone["id"];
  /**
   * An object containing the various components of the phone number.
   */
  phone: {
    /**
     * The full international phone number string, or `null`.
     */
    number: string | null;
    /**
     * The national number part of the phone number, or `null`.
     */
    nationalNumber: string | null;
    /**
     * The country calling code, or `null`.
     */
    countryCallingCode: string | null;
    /**
     * The two-letter ISO country code, or `null`.
     */
    country: string | null;
  };
  /**
   * The type of the phone number.
   * @deprecated The `type` property is deprecated in `PhoneModel` and should not be used directly here — see `Phone.type` (read-only; row W4 / decision D-1).
   */
  // type?: number; // deprecated
}

/**
 * Interface representing a comprehensive phone object, extending {@link PhoneModel}
 * with additional identifiers, computed display fields, and meta-data about its status.
 * This is typically used for phone numbers retrieved from the API or displayed in the UI.
 */
export interface Phone {
  /**
   * The unique identifier for the phone number.
   */
  id: IPhone["id"];
  /**
   * An optional display title for the phone number.
   */
  title?: string;
  /**
   * An optional detailed description of the phone number.
   */
  description?: string;
  /**
   * The {@link PhoneModel} object containing the parsed phone number details.
   */
  phone: PhoneModel["phone"];
  /**
   * The type of phone number (e.g. 1 for "Mobile", 2 for "Home"). READ-ONLY —
   * `mapIPhone` never emits it on write (decision D-1, row W4).
   */
  type: IPhone["type"];
  /**
   * Meta-information about the phone number's status and capabilities.
   */
  meta: {
    /**
     * `true` if the client can delete the phone number.
     */
    canDelete: boolean;
    /**
     * `true` if the phone number has been verified.
     */
    isVerified: boolean;
    /**
     * `true` if this is the client's default phone number.
     */
    isDefault: boolean;
  };
}

/**
 * Interface representing the context for phone number management within a client item context.
 * It extends `DataManagerContext` with specific data relevant to phone operations,
 * such as geographical country context for phone number formatting and validation.
 *
 * @template TModel - The type of the phone model, typically {@link PhoneModel}.
 */
export interface PhoneContext extends DataManagerContext<PhoneModel> {
  /**
   * The currently selected {@link ICountry} object in the context, used for
   * phone number formatting and validation rules.
   */
  country?: ICountry;
}

// -----------------------------------------------------------------------------
// QUERY MODEL — see the graphify-out/ citation at the head of this file
// -----------------------------------------------------------------------------

/**
 * The whole request state as one model — `filters` (nested column → operator
 * → value), `sort` (ordered, precedence = position) and `pagination`. This is
 * the instance validated against `useQuerySchema()`; the translator maps it
 * to the `QueryProps` the query layer already accepts.
 */
export type QueryModel = {
  filters?: {
    number?: { like?: string };
  };
  sort?: SortEntry[];
  pagination?: { limit?: number; offset?: number };
};

/** The nested filter model — the `filters` branch of {@link QueryModel}. */
export type FilterModel = NonNullable<QueryModel["filters"]>;

/**
 * One sort entry. Declared here rather than imported from the harness's
 * `TableModel["sort"]` — `packages/headless` has no
 * `@upmind-automation/scenario-harness` dependency and adding that edge would
 * invert the dependency direction.
 *
 * `field` is a literal union of the query schema's own declared `sort.items`
 * enum (`client-phone.schemas.ts`'s `useQuerySchema()` — currently
 * `created_at` only), mirroring `client-address.types.ts:288`'s narrowing: an
 * undeclared field is a compile error here rather than a silently
 * ajv-discarded write.
 *
 * @graphify-citation `graphify query "SortEntry literal union field
 * created_at client-address client-phone"` (2026-08-22, BFS depth 2, 34
 * nodes) — the only `SortEntry` node in `graphify-out/graph.json` is
 * `client-address.types.ts:L288`'s distinct literal union; this module's own
 * `SortEntry` (this file) is narrowed IN PLACE from a bare `string`, not
 * newly minted. See `graphify-out/GRAPH_REPORT.md`.
 */
export type SortEntry = { field: "created_at"; dir: SortDirection };

/** The ordered sort model — the `sort` branch of {@link QueryModel}. */
export type SortModel = NonNullable<QueryModel["sort"]>;

/**
 * The order the list starts in — `created_at` ascending, the boot order
 * `clientPhonesList.vue:68-71` demonstrates. Declared as the query schema's
 * `sort` default, so an emptied sort refills itself on the next parse.
 */
export const DEFAULT_SORT: SortModel = [
  { field: "created_at", dir: SortDirection.ASC }
];

/**
 * The collection's query schema. A `JsonSchema7`: a query schema IS a real
 * Draft-07 schema, and the translator/validators walk it at runtime, so the
 * type stays general rather than a module-specific literal.
 */
export type QuerySchema = JsonSchema7;

// -----------------------------------------------------------------------------
// SERVICES CONTRACT
// -----------------------------------------------------------------------------

/**
 * The reactive list query, minted ONCE per scope in `useClientPhones.ts`.
 * Aliased from the query platform's own `ListQuery` — never derived with
 * `ReturnType<typeof localServiceFn>`. The handle publishes `criteria` /
 * `schema` / `isFiltered` / `criteriaError` / `setCriteria` and no write-only
 * setters, so every layer below reads THAT one source and never a shadow copy
 * (see `graphify-out/` citation at the head of this file).
 */
export type ClientPhoneListQuery = ListQuery<IPhone[], Phone[], QueryModel>;

/** Lands a failed collection mutation (`remove` / `setDefault`) in the services instance's error state. */
export type ClientPhoneErrorCapture = (error: unknown) => void;

/**
 * The contract `createClientPhoneServices` resolves to — consumed by BOTH
 * halves, so the collection and the manager address the same client through
 * the same seam. Unlike the reference, `loadLookups` / `parse` / `validate`
 * live directly on this contract rather than a separate manager-only type:
 * their signatures already match what the shared `dataManagerMachine` invokes,
 * so no re-shaping adapter is needed for them (only `add` / `update` need one —
 * see {@link ClientPhoneManagerMachineServices}).
 */
export type ClientPhoneServices = {
  /** The module's base cache key; a save invalidates it and the list refetches. */
  queryKey: QueryKey;
  /**
   * The target client this scope resolved. The manager seeds its machine
   * context from here rather than re-reading the session.
   */
  clientId: ComputedRef<string | undefined>;
  /**
   * The reactive form of the ONE addressability predicate every request gate in
   * `client-phone.services` calls. The composable layers read THIS rather than
   * re-deriving the expression — a flag the consumer renders and the gate the
   * wire enforces cannot drift apart.
   */
  isAvailable: ComputedRef<boolean>;
  /** The last failed row mutation (`remove` / `setDefault`), captured as state — never raised itself. */
  error: ComputedRef<ResponseError | undefined>;
  /**
   * The collection's list query. Takes NOTHING: the request state is the
   * declared query schema, handed to `list({ criteria })`, so there is no
   * params back door a caller could contradict it through (see
   * `graphify-out/` citation at the head of this file).
   */
  loadList: () => ClientPhoneListQuery;
  /** Per-phone read; seeds the manager when no collection is loaded. */
  loadOne: (id?: IPhone["id"]) => Promise<Phone | undefined>;
  add: (model: PhoneModel) => Promise<IPhone | undefined>;
  update: (id: IPhone["id"], model: PhoneModel) => Promise<IPhone | undefined>;
  /** Find-or-create; backs both the collection action and the machine's `add`. */
  ensure: (model: PhoneModel) => Promise<Phone>;
  /** Also raises the oracle's own feedback (row W6 — a deliberate divergence from the reference). */
  remove: (id: IPhone["id"]) => Promise<void>;
  /** Also raises the oracle's own feedback (row W6 — a deliberate divergence from the reference). */
  setDefault: (id: IPhone["id"]) => Promise<IPhone | undefined>;
  /** `loading` — resolves the country and seeds the form's base model. */
  loadLookups: (context: PhoneContext) => Promise<Partial<PhoneContext>>;
  /** `available.checking.parsing` — libphonenumber-js parse, with fallbacks. */
  parse: (
    context: PhoneContext,
    event: AnyEventObject
  ) => Promise<Partial<PhoneContext>>;
  /** `available.checking.validating` and `processing.validating`. */
  validate: (context: Partial<PhoneContext>) => Promise<PhoneModel | undefined>;
  /** Invalidates {@link ClientPhoneServices.queryKey} so the collection refetches. */
  refresh: () => Promise<void>;
};

/**
 * The XState services map handed to `dataManagerMachine.withConfig({ services })`.
 * One key per `invoke.src` the shared machine names — an omitted key crashes on
 * entering its state rather than failing to compile, so read
 * `data-manager/data-manager.machine.ts` before trimming this list.
 */
export type ClientPhoneManagerMachineServices = {
  /** `loading` — the context patch the form starts from. */
  loadLookups: (context: PhoneContext) => Promise<Partial<PhoneContext>>;
  /** `available.checking.parsing` — schema-parses the incoming model. */
  parse: (
    context: PhoneContext,
    event: AnyEventObject
  ) => Promise<Partial<PhoneContext>>;
  /** `available.checking.validating` and `processing.validating`. */
  validate: (context: PhoneContext) => Promise<PhoneModel | undefined>;
  /** `processing.adding` — reached when the machine's `isNew` guard passes. */
  add: (context: PhoneContext) => Promise<Phone>;
  /** `processing.updating` — reached when context already carries an id. */
  update: (context: PhoneContext) => Promise<IPhone | undefined>;
};
