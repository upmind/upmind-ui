// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-vault
 * @description Four-layer contract for the `client-vault` module headless
 * does not have yet (plan §3): a client's notes and secrets, read account-wide
 * or for one product. This is the ONE contract whose scope varies on context
 * as well as actor (`client` | `contract-product`, plan §6). Rows are the wire
 * `IVaultAsset` — `encrypted` is the note/secret axis.
 *
 * @decision Plan §3 recorded "no wire model found" for the vault; searched
 * `packages/types` at build and `IVaultAsset` (`models/vaultAssets.ts`) is the
 * model, exported from the barrel. Rows are typed against it, not portal-local.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area — the account
 * notes/secrets panels and the product overview's notes/secrets; gap-doc rows
 * "4. Account → Notes & secrets" and "2. Products → Overview tab".
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { NO_ACTOR_CONTEXT, SCOPE_ACTOR } from "./scope";
import type { ContractInternals } from "./scope";
import type {
  ActorContextMatrix,
  PaginationInfo,
  RequestSortDirection,
  ResponseError,
  useCollection
} from "@upmind-automation/headless";
import type { IContractProduct, IVaultAsset } from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * What a note or secret form writes. One model for both: `encrypted` is the
 * axis between them and belongs to the SCOPE, not to what the client typed
 * (`vaultNoteForm.vue`, `vaultSecretForm.vue` carry the same two fields).
 */
export type VaultAssetModel = {
  label: IVaultAsset["label"];
  /** The note's text, or the secret's value. */
  value: IVaultAsset["note"];
};

/**
 * Where a created asset belongs, and which side of the note/secret axis it
 * lands on.
 *
 * CHANGE (plan §3): the real module carries the first two in its own SCOPE —
 * `useClientVault` resolves account-wide or for one product, and a create
 * inherits that. The shell mounts one dialog for every form (plan F2), so the
 * scope arrives as an argument here instead of through the composable.
 */
export type VaultAssetScope = {
  readonly context: ClientVaultContextTypes;
  /** The product it is attached to, where the context is a contract product. */
  readonly contractProductId?: IContractProduct["id"];
  /** A SECRET rather than a note. */
  readonly encrypted: boolean;
};

// -----------------------------------------------------------------------------
// SCOPE
// -----------------------------------------------------------------------------

/** Context types for the vault — whose (or which product's) assets are read. */
export const ClientVaultContextTypes = {
  /** Reading a client's account-wide notes and secrets. */
  CLIENT: AccessRoleTypes.CLIENT,
  /** Reading the notes and secrets attached to one contract product. */
  CONTRACT_PRODUCT: "contract-product"
} as const;

export type ClientVaultContextTypes =
  (typeof ClientVaultContextTypes)[keyof typeof ClientVaultContextTypes];

/** Both vault contexts resolve for the client actor — the matrix cell is their union. */
const vaultContext: ClientVaultContextTypes = ClientVaultContextTypes.CLIENT;

/**
 * Scope matrix for `useClientVault`. `client` is the only actor that resolves,
 * and it resolves BOTH contexts: the account panels and the product panels are
 * one module scoped two ways, not two modules.
 */
export const CLIENT_VAULT_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: vaultContext,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientVault` (derived from the runtime const). */
export type ClientVaultScopeMatrix = typeof CLIENT_VAULT_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** Wire columns the vault list can be sorted by. */
export const ClientVaultSortableProperties = {
  DEFAULT: "created_at",
  DATE_CREATED: "created_at",
  LABEL: "label"
} as const;

export type ClientVaultSortableProperties =
  (typeof ClientVaultSortableProperties)[keyof typeof ClientVaultSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/** The collection's named filters — an absent value clears that key. */
export type ClientVaultFilters = {
  /** Free-text narrowing over label and note. */
  query: (value?: string) => void;
  /** Splits the two panels: secrets are encrypted, notes are not. */
  encrypted: (value?: IVaultAsset["encrypted"]) => void;
  /** Narrows to one product's assets. */
  contractProductId: (value?: IContractProduct["id"]) => void;
};

// -----------------------------------------------------------------------------
// LAYERS — useClientVault
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of vault assets and its lookups. */
export type UseClientVaultContext = {
  /** The reactive current page of this scope's assets (always an array). */
  data: ComputedRef<IVaultAsset[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one asset on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<IVaultAsset>>["findOne"];
  /** Finds one asset on the page by id. */
  getOne: ReturnType<typeof useCollection<IVaultAsset>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseClientVaultMeta = {
  /** True if the list query or a mutation failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this scope holds no assets. */
  isEmpty: ComputedRef<boolean>;
  /** True while the list is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while there is a further page beyond the current one. */
  hasNextPage: ComputedRef<boolean>;
  /** True while there is a page before the current one. */
  hasPrevPage: ComputedRef<boolean>;
  /** True while the list spans more than one page. */
  hasPages: ComputedRef<boolean>;
};

/** Collection actions — list controls, the four asset verbs, and lifecycle. */
export type UseClientVaultActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: ClientVaultFilters;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the collection is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Fetches the next page. */
  nextPage: () => void;
  /** Fetches the previous page. */
  prevPage: () => void;
  /** Refetches the list from the server. */
  refresh: () => Promise<void>;
  /** Sorts the list by the given property and direction. */
  sort: (
    property?: ClientVaultSortableProperties,
    direction?: RequestSortDirection
  ) => void;
  /**
   * Pins one row to the top of its panel, or lets it back down — legacy's
   * `updatePinned` (`vaultNoteItem.vue:87`), which posted the flag inverted.
   * The ORDER is the server's: legacy dropped its own sort from the query so
   * the back end could put pinned rows first (`vaultProvider.vue:164`).
   */
  setPinned: (assetId: IVaultAsset["id"]) => Promise<void>;
  /** Adds one note or secret, resolving the row the server recorded. */
  create: (
    model: VaultAssetModel,
    scope: VaultAssetScope
  ) => Promise<IVaultAsset | undefined>;
  /** Edits one — its scope and its axis are the row's already. */
  update: (
    id: IVaultAsset["id"],
    model: VaultAssetModel
  ) => Promise<IVaultAsset | undefined>;
  /** Deletes one asset. */
  remove: (id: IVaultAsset["id"]) => Promise<void>;
  /** Converts one asset between note and secret — the `encrypted` flip. */
  convert: (id: IVaultAsset["id"]) => Promise<void>;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseClientVaultInternals = ContractInternals;
