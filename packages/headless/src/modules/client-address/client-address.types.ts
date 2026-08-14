/**
 * @graphify-citation `graphify query "ClientAddressContextTypes
 * ClientAddressesContextTypes CLIENT_ADDRESS_SCOPE_MATRIX verifiedLevel"`
 * (2026-08-14) → "No matching nodes found." The four scope symbols minted
 * below and `Address.verifiedLevel` have no pre-existing graph node, so
 * minting them is warranted rather than a duplicate. `Address` /
 * `AddressModel` / `AddressContext` already exist (community `useModelParser`)
 * and are KEPT, not re-minted. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module client-address/client-address.types
 * @description Types for a client's own postal addresses — the query-backed
 * collection (`useClientAddresses`) and the `dataManagerMachine`-backed
 * per-address form editor (`useClientAddressManager`). Each composable owns
 * its own context enum and scope matrix; the address model, the services
 * contract and the mappers are shared, which is what keeps ONE identity seam
 * for both halves.
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ResponseError } from "../../utils";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { ListQuery, QueryParams } from "../query";
import type { QueryKey } from "@tanstack/vue-query";
import type { ICountry, IRegion, IAddress } from "@upmind-automation/types";
import type { ComputedRef } from "vue";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/**
 * Context types for the address COLLECTION — whose list is being addressed.
 */
export enum ClientAddressesContextTypes {
  /** Acting on a client's address collection. */
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * Scope matrix for `useClientAddresses`. `client` is the only actor that
 * resolves; `self`, `staff` and `guest` are `null as never` (operator ruling R2
 * — `parity.yaml` rows D1-D8, N1).
 *
 * WHAT THE TYPE SYSTEM ACTUALLY ENFORCES — corrected against a real
 * `ts.createProgram` probe, not asserted. `ScopeBuilderResult` accepts EVERY
 * `ScopeActorTypes` and reads the matrix row only to decide whether `.for()`
 * exists, so a `null as never` row removes `.for(...)` and nothing else:
 * `.as('staff')` and `.as('guest')` COMPILE, resolving to an instance with no
 * `.for()`, and are refused at RUNTIME by the scope factory. The compile-time
 * errors are `.as('staff' | 'guest' | 'self').for(...)`, while
 * `.as('client').for(...)` type-checks.
 *
 * Delivering a compile-time error on a bare `.as('staff')` would require
 * editing `scope.builder.ts` — protected core, forbidden by `design.md` D-2.
 * The claim is corrected here rather than the core edited; AC-33 / AC-34 need
 * the same correction in the bundle.
 *
 * @graphify-citation `graphify query "ScopeBuilderResult
 * ScopeBuilderStaffResult ContextsForActor"` (2026-08-14) → `ScopeBuilderResult`
 * at `scope.builder.ts:L184`, `ScopeBuilderStaffResult` at `:L140`,
 * `ContextsForActor` at `scope.types.ts:L103` — the three nodes this correction
 * rests on, all in community `headless/src/utils/index.ts`. No node is minted
 * here. See `graphify-out/GRAPH_REPORT.md`.
 */
export const CLIENT_ADDRESSES_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ClientAddressesContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientAddresses` (derived from the runtime const). */
export type ClientAddressesScopeMatrix = typeof CLIENT_ADDRESSES_SCOPE_MATRIX;

/**
 * Context types for the per-address MANAGER — which address is being edited.
 * The context names the ENTITY, not its owner: the owning client falls through
 * the same `resolveClientId` seam as every other call.
 */
export enum ClientAddressContextTypes {
  /** Editing one existing address by id. */
  ADDRESS = "address"
}

/**
 * Scope matrix for `useClientAddressManager`. Separate from the collection's —
 * the two composables scope on different things and cannot share one.
 */
export const CLIENT_ADDRESS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ClientAddressContextTypes.ADDRESS,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientAddressManager` (derived from the runtime const). */
export type ClientAddressScopeMatrix = typeof CLIENT_ADDRESS_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * An array of predefined address types, used for categorising different kinds of addresses.
 * Each object contains a numeric `key` and a human-readable `value`.
 */
export const AddressTypes = [
  { key: 1, value: "Home" },
  { key: 2, value: "Office" },
  { key: 3, value: "Holiday" },
  { key: 4, value: "Company" }
];

/**
 * A constant object mapping human-readable names to their corresponding numeric keys
 * from the {@link AddressTypes} array. This provides a type-safe way to reference
 * address types in code.
 */
export const ADDRESS_TYPE_KEYS = {
  HOME: AddressTypes[0].key,
  OFFICE: AddressTypes[1].key,
  HOLIDAY: AddressTypes[2].key,
  COMPANY: AddressTypes[3].key
} as const;

/**
 * Interface representing the data model for an address, suitable for forms
 * or API payloads. It encapsulates the core geographical details of an address.
 */
export interface AddressModel {
  /**
   * Optional unique identifier for the address. Present if editing an existing address.
   */
  id?: IAddress["id"];
  /**
   * Optional name or label for the address (e.g. "My Home Address").
   */
  name?: IAddress["name"];
  /**
   * The address type — one of {@link AddressTypes}' keys. Optional; a new
   * address defaults to `HOME` through the schema.
   */
  type?: IAddress["type"];
  /**
   * An object containing the primary components of a physical address.
   */
  address: {
    /**
     * The first line of the address (e.g. street name and number).
     */
    address1: IAddress["address_1"];
    /**
     * The second line of the address (e.g. flat, suite, or unit number). Optional.
     */
    address2?: IAddress["address_2"];
    /**
     * The city of the address.
     */
    city: IAddress["city"];
    /**
     * The ID of the country for the address.
     */
    countryId: IAddress["country_id"];
    /**
     * The postal code or Postcode of the address.
     */
    postcode: IAddress["postcode"];
    /**
     * The ID of the region for the address. Optional, depending on country.
     */
    regionId?: IAddress["region_id"];
    /**
     * The state or province name for the address. Optional, depending on country.
     */
    state?: IAddress["state"];
  };
}

/**
 * Interface representing a comprehensive address object, extending {@link AddressModel}
 * with additional identifiers, contextual information, and meta-data about the address.
 * This is typically used for addresses retrieved from the API or displayed in the UI.
 */
export interface Address extends AddressModel {
  // --- identifiers
  /**
   * The unique identifier for the address.
   */
  id: IAddress["id"];
  /**
   * The unique identifier of the client to whom this address belongs.
   */
  clientId: IAddress["client_id"];
  // --- context
  /**
   * A display title for the address (e.g. "Home Address").
   */
  title: string;
  /**
   * The name of the country for this address.
   */
  countryName?: string;
  /**
   * A detailed description of the address, potentially including full address lines.
   */
  description: string;
  /**
   * The name of the region/state for this address.
   */
  regionName?: string;
  /**
   * The type of address, corresponding to keys in {@link AddressTypes} (e.g., 1 for "Home").
   */
  type: IAddress["type"];
  /**
   * How far the address's verification went, carried from the API unchanged.
   * `meta.isVerified` keeps its boolean shape for the consumers that read a
   * flag; this carries the level the coercion used to destroy (`design.md`
   * D-7, ruling R8h).
   */
  verifiedLevel: IAddress["verified"];
  // --- meta info
  /**
   * Meta-information about the address's status and capabilities.
   */
  meta: {
    /**
     * Indicates whether the client can delete the address.
     */
    canDelete: boolean;
    /**
     * Indicates whether this is the client's default address.
     */
    isDefault: boolean;
    /**
     * Indicates whether the address has been verified.
     */
    isVerified: boolean;
  };
}

/**
 * The manager's machine context — the shared machine's, over this form model.
 * Every member beyond the base `DataManagerContext` is OPTIONAL: the shared
 * `dataManagerMachine` is fixed to `DataManagerContext`, and a `withConfig(...)`
 * action/guard/service typed against a context with REQUIRED extra fields is
 * not assignable to one typed against the base — which is exactly why the
 * pre-conversion `withConfig` call carried three `as any` casts. Optional is
 * what keeps the pin to `Parameters<typeof dataManagerMachine.withConfig>[0]`
 * real instead of re-introducing the casts it exists to remove.
 *
 * @template TModel - The type of the address model, typically {@link AddressModel}.
 */
export interface AddressContext extends DataManagerContext<AddressModel> {
  /**
   * The currently selected country object in the context.
   */
  country?: ICountry;
  /**
   * An array of regions available for the selected country.
   * Used for address form fields.
   */
  regions?: IRegion[];
  /**
   * An array of all available countries in the system for selection in address forms.
   */
  countries?: ICountry[];
}

// -----------------------------------------------------------------------------
// SERVICES CONTRACT
// -----------------------------------------------------------------------------

/**
 * The reactive list query, minted ONCE per scope in `useClientAddresses.ts`.
 * Aliased from the query platform's own `ListQuery` — never derived with
 * `ReturnType<typeof localServiceFn>`.
 */
export type ClientAddressListQuery = ListQuery<IAddress[], Address[]>;

/** Lands a failed collection mutation in the services instance's error state. */
export type ClientAddressErrorCapture = (error: unknown) => void;

/**
 * The contract `createClientAddressServices` resolves to — consumed by BOTH
 * halves, so the collection and the manager address the same client through
 * the same seam.
 */
export type ClientAddressServices = {
  /** The module's base cache key; a save invalidates it and the list refetches. */
  queryKey: QueryKey;
  /**
   * The target client this scope resolved. The manager seeds its machine
   * context from here rather than re-reading the session.
   */
  clientId: ComputedRef<string | undefined>;
  /**
   * The reactive form of the ONE addressability predicate every request gate in
   * `client-address.services` calls. The composable layers read THIS rather
   * than re-deriving the expression, so the flag a consumer renders and the
   * gate the wire enforces cannot drift apart.
   */
  isAvailable: ComputedRef<boolean>;
  /** The last failed collection mutation, captured as state — never raised. */
  error: ComputedRef<ResponseError | undefined>;
  loadList: (
    params?: Partial<QueryParams<IAddress[], Address[]>>
  ) => ClientAddressListQuery;
  /** Per-address read; seeds the manager when no collection is loaded. */
  loadOne: (id?: IAddress["id"]) => Promise<Address | undefined>;
  add: (model: AddressModel) => Promise<IAddress | undefined>;
  update: (
    id: IAddress["id"],
    model: AddressModel
  ) => Promise<IAddress | undefined>;
  /** Find-or-create; backs both the collection action and the machine's `add`. */
  ensure: (model: AddressModel) => Promise<Address>;
  /** Deletes an address. Reports failure through feedback (R10), never rejects. */
  remove: (id: IAddress["id"]) => Promise<void>;
  /** Promotes an address to the client's default. Reports through feedback (R10). */
  setDefault: (id: IAddress["id"]) => Promise<void>;
  /** Schema validation; rejects with the AJV errors as the error's `data`. */
  validate: (
    schema: AddressContext["schema"],
    model?: AddressModel
  ) => Promise<AddressModel | undefined>;
  /** Invalidates {@link ClientAddressServices.queryKey} so the collection refetches. */
  refresh: () => Promise<void>;
  /** Form-editor support, consumed only through the machine config. */
  loadLookups: (context: AddressContext) => Promise<Partial<AddressContext>>;
  parse: (
    context: AddressContext,
    event: AnyEventObject
  ) => Promise<Partial<AddressContext>>;
};

/**
 * The XState services map handed to `dataManagerMachine.withConfig({ services })`.
 * One key per `invoke.src` the shared machine names — an omitted key crashes on
 * entering its state rather than failing to compile, so read
 * `data-manager/data-manager.machine.ts` before trimming this list.
 */
export type ClientAddressManagerMachineServices = {
  /** `loading` — the context patch the form starts from. */
  loadLookups: (context: AddressContext) => Promise<Partial<AddressContext>>;
  /** `available.checking.parsing` — schema-parses the incoming model. */
  parse: (
    context: AddressContext,
    event: AnyEventObject
  ) => Promise<Partial<AddressContext>>;
  /** `available.checking.validating` and `processing.validating`. */
  validate: (context: AddressContext) => Promise<AddressModel | undefined>;
  /** `processing.adding` — reached when the machine's `isNew` guard passes. */
  add: (context: AddressContext) => Promise<Address>;
  /**
   * `processing.updating` — reached when context already carries an id.
   *
   * Resolves the MAPPED `Address`, not the raw `IAddress` the request returns.
   * Both `processing` limbs feed the shared machine's `setModel`, which
   * re-parses whatever it is handed through `useModelParser(schema, data,
   * baseModel)`; a raw snake_case body carries no `address` key, so
   * `defaultsDeep` refilled it from the form-open snapshot and a SUCCESSFUL
   * save reverted the model to its pre-edit values. Same shape on both limbs
   * is the invariant, not a preference.
   *
   * @graphify-citation `graphify query "mapAddress"` (2026-08-14, BFS depth 2,
   * 56 nodes) → `mapAddress()` at `client-address.mappers.ts:L15` and
   * `ensure()` at `client-address.services.ts:L165`, both community
   * `useModelParser` — i.e. the `add:` limb's existing mapping hop this
   * narrowing makes the `update:` limb match. No type is minted here; `Address`
   * already exists in that community. See `graphify-out/GRAPH_REPORT.md`.
   */
  update: (context: AddressContext) => Promise<Address | undefined>;
};
