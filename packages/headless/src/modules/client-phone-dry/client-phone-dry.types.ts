// see graphify-out/graph.json — reorder only, no new symbol on this line
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- `typeof useQuery` below needs a real value import; `import type` cannot be used in a `typeof` type query
import { useQuery as tanstackUseQuery } from "@tanstack/vue-query";
import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
// graphify-out/graph.json: QueryResponse/PaginationInfo/useMutation are existing nodes, reused not re-minted
import type { QueryParams, QueryResponse, PaginationInfo } from "../query";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type { DefaultError, QueryKey, useMutation } from "@tanstack/vue-query";
import type { ICountry, IPhone } from "@upmind-automation/types";
import type { ComputedRef } from "vue";

/**
 * The shape a mutation's caught error carries (`title`/`message`/`data`) —
 * no existing type in graphify-out/graph.json fits this shape (`ResponseError`,
 * `../../utils/useError.ts`, has no `title`), so this is minted fresh.
 */
export type MutationErrorLike = {
  title?: string;
  message?: string;
  data?: unknown;
};

// -----------------------------------------------------------------------------
/**
 * @module client-phone-dry/types
 * @description `client-phone-dry` — query-variant scoped module for client
 * phone numbers (conversion + full legacy parity, `docs/sdd/client-phone-dry-smoke/design.md`).
 * @graphify `graphify query "client phone"` (graphify-out/graph.json) — no
 * existing `client-phone-dry` node; the nearest sibling is `client-phone.services.ts`
 * (the conversion baseline this module converts, side-by-side, per design.md).
 */

/**
 * Context types for the `client-phone-dry` collection — Cell B only
 * (`.as('staff').for('client', id)`); Cell A is `.as('self')`→client, no
 * `.for()` (`docs/adr/001-scope-based-composables.md:103-111`).
 */
export enum PhoneContextTypes {
  CLIENT = AccessRoleTypes.CLIENT
}

/** Scope matrix for `useClientPhonesDry` — cite ADR-001, do not re-derive. */
export const CLIENT_PHONE_DRY_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: PhoneContextTypes.CLIENT,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

export type ClientPhoneDryScopeMatrix = typeof CLIENT_PHONE_DRY_SCOPE_MATRIX;

/** Staff capability codes gating the actions arm (gap #7, ADR-001 §6, AC-B3). */
export enum ClientPhoneDryCapability {
  LIST = "list_client_phones",
  CREATE = "create_client_phone",
  UPDATE = "update_client_phone",
  DELETE = "delete_client_phone"
}

/**
 * Phone type options (legacy `PhoneTypes`, `vue-app/src/data/status.ts:374-379`
 * — D2; graphify-out/graph.json carries no equivalent node). A mutable array
 * (no `as const`) — `useSchema`'s `oneOf` maps it into `JsonSchema7[]`, which
 * rejects a `readonly` source array.
 */
export const CLIENT_PHONE_DRY_TYPES: { key: number; value: string }[] = [
  { key: 1, value: "mobile" },
  { key: 2, value: "home" },
  { key: 3, value: "office" },
  { key: 4, value: "personal" }
];

export const DEFAULT_PHONE_TYPE = CLIENT_PHONE_DRY_TYPES[0].key;

/**
 * Base cache key, in `.types.ts` (not `.services.ts`) so the staff arm can
 * extend it without a `.services.ts` <-> `.services.staff.ts` circular
 * import — mirrors `auth/auth.types.ts`'s `AUTH_SESSION_QUERY_KEY_BASE` (no
 * equivalent base-key node for this module in graphify-out/graph.json).
 */
export const CLIENT_PHONE_DRY_QUERY_KEY_BASE: QueryKey = [
  "client-phone-dry",
  "phones"
];

/** Form data for a phone number (D2 — `type` is required, restored from baseline's drop). */
export interface PhoneModel {
  id?: IPhone["id"];
  phone: {
    number: string | null;
    nationalNumber: string | null;
    countryCallingCode: string | null;
    country: string | null;
  };
  type: IPhone["type"];
}

/** A phone number as read from the list (D4 — `meta.isStaged` from `staged_import`). */
export interface Phone {
  id: IPhone["id"];
  title?: string;
  description?: string;
  phone: PhoneModel["phone"];
  type: IPhone["type"];
  meta: {
    canDelete: boolean;
    isVerified: boolean;
    isDefault: boolean;
    /** D4 — truthy `staged_import`; edit/set-default/delete are locked while true. */
    isStaged: boolean;
  };
}

/** The form-side state `parse`/`validate`/the schema parsers operate over. */
export interface PhoneFormContext {
  model?: PhoneModel;
  schema?: JsonSchema7;
  uischema?: UISchemaElement;
  country?: ICountry;
}

/**
 * A mutation service member's return shape — `useQuery().mutate<TData>(...)`'s
 * own return type, named here because `remove`/`setDefault` each resolve a
 * different `TData` (`null` / `IPhone`) and an untyped
 * `ReturnType<typeof useQuery>["mutate"]>` collapses both to `unknown`,
 * rejecting the concrete return every real `mutate<T>(...)` call produces. No
 * equivalent node exists in graphify-out/graph.json.
 */
export type ClientPhoneDryMutation<TData> = ReturnType<
  typeof useMutation<QueryResponse<TData>, DefaultError, void, unknown>
>;

/**
 * The reactive list query `useQuery().list<IPhone[], Phone[]>(...)` produces
 * — mirrors that method's own return-type annotation
 * (`query/useQuery.ts`'s `list()`) with concrete `Phone[]` generics, for the
 * same reason as `ClientPhoneDryMutation` above: an untyped
 * `ReturnType<ReturnType<typeof useQuery>["list"]>` collapses to `unknown[]`.
 * Declared here (not derived from `ClientPhoneDryServices["loadList"]`) so
 * `loadList`'s own return type can reference it without a circular type. No
 * equivalent node exists in graphify-out/graph.json.
 */
export type ClientPhoneDryListQuery = ReturnType<
  typeof tanstackUseQuery<IPhone[], DefaultError, QueryResponse<Phone[]>>
> & {
  data: ComputedRef<Phone[]>;
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
 * The contract `scopedServices()` in `client-phone-dry.services.ts` resolves
 * to. `loadList`/`add`/`update`/`remove`/`setDefault` are overridden A-vs-A+B
 * by the staff arm (D1); the rest are shared across both cells.
 */
export interface ClientPhoneDryServices {
  queryKey: QueryKey;
  loadList: (
    params?: Partial<QueryParams<IPhone[], Phone[]>>
  ) => ClientPhoneDryListQuery;
  /** `undefined` when the create request settled but returned no body. */
  add: (model: PhoneModel) => Promise<IPhone | undefined>;
  /** `undefined` when the update request settled but returned no body. */
  update: (id: Phone["id"], model: PhoneModel) => Promise<IPhone | undefined>;
  ensure: (model: PhoneModel) => Promise<Phone>;
  remove: (phoneId: Phone["id"]) => ClientPhoneDryMutation<null>;
  setDefault: (phoneId: Phone["id"]) => ClientPhoneDryMutation<IPhone>;
  parse: (
    formContext: Pick<PhoneFormContext, "schema" | "country">,
    data: unknown
  ) => Promise<{ model?: PhoneModel; country?: ICountry }>;
  validate: (
    formContext: Pick<PhoneFormContext, "schema" | "model">
  ) => Promise<PhoneModel | undefined>;
}
