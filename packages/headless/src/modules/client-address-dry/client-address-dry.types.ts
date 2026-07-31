// see graphify-out/graph.json — reorder only, no new symbol on this line
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- `typeof useQuery` below needs a real value import; `import type` cannot be used in a `typeof` type query
import { useQuery as tanstackUseQuery } from "@tanstack/vue-query";
import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
// graphify-out/graph.json: QueryResponse/PaginationInfo/useMutation are existing nodes, reused not re-minted
import type { QueryParams, QueryResponse, PaginationInfo } from "../query";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type { DefaultError, QueryKey, useMutation } from "@tanstack/vue-query";
import type { ICountry, IRegion, IAddress } from "@upmind-automation/types";
import type { ComputedRef } from "vue";

/**
 * The shape a mutation's caught error carries (`title`/`message`/`data`) —
 * mirrors `client-phone-dry.types.ts`'s `MutationErrorLike` (no existing type
 * in graphify-out/graph.json fits this shape).
 */
export type MutationErrorLike = {
  title?: string;
  message?: string;
  data?: unknown;
};

// -----------------------------------------------------------------------------
/**
 * @module client-address-dry/types
 * @description `client-address-dry` — query-variant scoped module for client
 * postal addresses (conversion + full legacy parity,
 * `docs/sdd/client-address-dry-smoke/design.md`).
 * @graphify `graphify query "client address"` (graphify-out/graph.json) — no
 * existing `client-address-dry` node; the nearest siblings are
 * `client-address.services.ts` (the conversion baseline this module
 * converts, side-by-side, per design.md) and `client-phone-dry/` (the prior
 * sibling smoke, the closest worked exemplar of this arm shape).
 */

/**
 * Context types for the `client-address-dry` collection — Cell 2 only
 * (`.as('staff').for('client', id)`); Cell 1 is `.as('self')` -> client, no
 * `.for()`; Cell 3 is `.as('self')` under impersonation (also no `.for()`)
 * (`docs/adr/001-scope-based-composables.md:103-159`, design.md §1/§3).
 */
export enum AddressContextTypes {
  CLIENT = AccessRoleTypes.CLIENT
}

/** Scope matrix for `useClientAddressesDry` — cite ADR-001, do not re-derive. */
export const CLIENT_ADDRESS_DRY_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: AddressContextTypes.CLIENT,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

export type ClientAddressDryScopeMatrix =
  typeof CLIENT_ADDRESS_DRY_SCOPE_MATRIX;

/** Staff capability codes gating the actions arm (parity #8, ADR-001 §6, AC-B3/AC-B4). */
export enum ClientAddressDryCapability {
  LIST = "list_client_addresses",
  CREATE = "create_client_address",
  UPDATE = "update_client_address",
  DELETE = "delete_client_address"
}

/**
 * Single-source staff capability read-state (parity #8/#19, D-ADDR-5,
 * AC-B3/AC-B4/AC-B5) — computed ONCE by
 * `client-address-dry.utils.ts`'s `getClientAddressDryStaffCapabilities()`
 * and consumed by BOTH the `actions.staff` arm (gates action exposure) and
 * the `meta.staff` arm (exposes as readable UI state). Never recomputed
 * independently by either arm.
 * @graphify `graphify query "staff capability"` (graphify-out/graph.json) —
 * no existing capability-bundle type in the graph to reuse; the nearest
 * sibling is `client-phone-dry.utils.ts`'s `getStaffToken()`, which returns a
 * single token, not a capability bundle.
 */
export interface ClientAddressDryStaffCapabilities {
  canList: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/**
 * Address type options (restored — D-ADDR-3; legacy
 * `addEditAddressForm.vue:41` `rules="required"`). A mutable array (no
 * `as const`) — `useSchema`'s `oneOf` maps it into `JsonSchema7[]`, which
 * rejects a `readonly` source array.
 */
export const AddressTypes: { key: number; value: string }[] = [
  { key: 1, value: "Home" },
  { key: 2, value: "Office" },
  { key: 3, value: "Holiday" },
  { key: 4, value: "Company" }
];

export const DEFAULT_ADDRESS_TYPE = AddressTypes[0].key;

/**
 * Base cache key, in `.types.ts` (not `.services.ts`) so the staff arm can
 * extend it without a `.services.ts` <-> `.services.staff.ts` circular
 * import — mirrors `client-phone-dry.types.ts`'s
 * `CLIENT_PHONE_DRY_QUERY_KEY_BASE`.
 */
export const CLIENT_ADDRESS_DRY_QUERY_KEY_BASE: QueryKey = [
  "client-address-dry",
  "addresses"
];

/** Form data for an address (D-ADDR-3 — `type` is required, restored from baseline's drop). */
export interface AddressModel {
  id?: IAddress["id"];
  name?: IAddress["name"];
  address: {
    address1: IAddress["address_1"];
    address2?: IAddress["address_2"];
    city: IAddress["city"];
    // optional — unset until `loadLookups` resolves (graphify-out/graph.json: no stricter existing shape to cite)
    countryId?: IAddress["country_id"];
    postcode: IAddress["postcode"];
    regionId?: IAddress["region_id"];
    state?: IAddress["state"];
  };
  type: IAddress["type"];
}

/** An address as read from the list. NO `isStaged` — `IAddress` carries no `staged_import` field (D-ADDR-4). */
export interface Address extends AddressModel {
  id: IAddress["id"];
  clientId: IAddress["client_id"];
  title: string;
  countryName?: string;
  description: string;
  regionName?: string;
  meta: {
    canDelete: boolean;
    isDefault: boolean;
    isVerified: boolean;
  };
}

/** The form-side state `loadLookups`/`parse`/`validate`/the schema parsers operate over. */
export interface AddressFormContext {
  model?: AddressModel;
  baseModel?: AddressModel;
  schema?: JsonSchema7;
  uischema?: UISchemaElement;
  country?: ICountry;
  countries?: ICountry[];
  regions?: IRegion[];
  /** Raw brand config keys (`REQUIRE_REGION_IN_ADDRESS` — R12, brand-config not actor). */
  config?: Record<string, unknown>;
}

/**
 * A mutation service member's return shape — `useQuery().mutate<TData>(...)`'s
 * own return type, named here because `remove`/`setDefault` each resolve a
 * different `TData` (`null` / `IAddress`), mirroring
 * `client-phone-dry.types.ts`'s `ClientPhoneDryMutation`.
 */
export type ClientAddressDryMutation<TData> = ReturnType<
  typeof useMutation<QueryResponse<TData>, DefaultError, void, unknown>
>;

/**
 * The reactive list query `useQuery().list<IAddress[], Address[]>(...)`
 * produces — mirrors `client-phone-dry.types.ts`'s `ClientPhoneDryListQuery`.
 */
export type ClientAddressDryListQuery = ReturnType<
  typeof tanstackUseQuery<IAddress[], DefaultError, QueryResponse<Address[]>>
> & {
  data: ComputedRef<Address[]>;
  pagination: ComputedRef<PaginationInfo>;
  meta: ComputedRef<{
    hasNextPage: boolean;
    hasPrevPage: boolean;
    hasPages: boolean;
  }>;
  total: ComputedRef<number>;
  fetchNextPage: () => void;
  fetchPreviousPage: () => void;
  sort: (values?: QueryParams["sort"]) => void;
  filter: (values: QueryParams["filters"]) => void;
  resetQuery: () => Promise<void>;
};

/**
 * The contract `scopedServices()` in `client-address-dry.services.ts`
 * resolves to. `loadList`/`add`/`update`/`remove`/`setDefault` are overridden
 * A-vs-A+B by the staff arm (D-ADDR-1); `loadLookups`/`parse`/`validate` stay
 * shared across all three cells (D-ADDR-3/D-ADDR-4 fields are SHARED, not a
 * schemas arm).
 */
export interface ClientAddressDryServices {
  queryKey: QueryKey;
  loadList: (
    params?: Partial<QueryParams<IAddress[], Address[]>>
  ) => ClientAddressDryListQuery;
  /** `undefined` when the create request settled but returned no body. */
  add: (model: AddressModel) => Promise<IAddress | undefined>;
  /** `undefined` when the update request settled but returned no body. */
  update: (
    id: Address["id"],
    model: AddressModel
  ) => Promise<IAddress | undefined>;
  ensure: (model: AddressModel) => Promise<Address>;
  remove: (addressId: Address["id"]) => ClientAddressDryMutation<null>;
  setDefault: (addressId: Address["id"]) => ClientAddressDryMutation<IAddress>;
  /** Region/country lookups + brand config, seeding the form model (R11/R12). */
  loadLookups: (
    formContext: Pick<AddressFormContext, "model" | "schema">
  ) => Promise<
    Pick<
      AddressFormContext,
      "regions" | "country" | "countries" | "config" | "model" | "baseModel"
    >
  >;
  parse: (
    formContext: Pick<AddressFormContext, "schema" | "regions" | "country">,
    data: unknown
  ) => Promise<Pick<AddressFormContext, "model" | "regions" | "country">>;
  validate: (
    formContext: Pick<AddressFormContext, "schema" | "model">
  ) => Promise<AddressModel | undefined>;
}
