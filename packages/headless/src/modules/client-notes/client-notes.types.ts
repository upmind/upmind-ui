/**
 * @graphify-citation `graphify query "client notes vault VaultAsset
 * ClientNotesContextTypes ClientNoteContextTypes QueryModel FilterModel
 * SortModel"` (2026-08-27, BFS depth 2, 226 nodes) — no `client-notes`
 * module, no `ClientNotesContextTypes`/`ClientNoteContextTypes`, and no
 * `VaultAsset` view-model node exists anywhere in `graphify-out/graph.json`;
 * the only pre-existing nodes are the wire types `IVaultAsset` /
 * `IVaultAssetForm` (`packages/types/src/models/vaultAssets.ts`) and the
 * unrelated `INote` (`packages/types/src/models/notes.ts`). Minting the two
 * scope blocks and the module's own view/form models below is therefore
 * warranted, not a duplicate. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module client-notes/client-notes.types
 * @description Types for a client's own vault — notes and secrets are ONE
 * entity (`IVaultAsset.encrypted` is the discriminator). The module ships the
 * canonical hybrid pair: the query-backed collection (`useClientNotes`) and
 * the `dataManagerMachine`-backed per-asset form editor
 * (`useClientNoteManager`). Each composable owns its own context enum and
 * scope matrix; the model, the services contract and the mappers are shared,
 * which is what keeps ONE identity seam for both halves.
 */

// @graphify-citation `graphify query "ProductLookupQueryModel
// ContractProductLookupQuery LookupItem product lookup query criteria"`
// (2026-09-02, BFS depth 2, 584 nodes) — no lookup query-model / handle node in
// `graphify-out/graph.json`; the nearest neighbour is the wire type
// `IContractProduct` (`packages/types/src/models/contracts.ts`). The async
// lookup types below narrow the query platform's own `ListQuery` and reuse the
// `lookup` module's `LookupItem`, so nothing is duplicated (design.md §Layer 3).
import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { FormattedDate, ResponseError } from "../../utils";
import type { DataManagerContext } from "../data-manager/data-manager.types";
// The `lookup` module's own `LookupItem` (replaces the renderer-local stub) —
// see the file-header `graphify-out/` citation above for the lookup types.
import type { LookupItem } from "../lookup";
import type { ListQuery } from "../query";
import type { SortDirection } from "../query/query.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IContractProduct, IVaultAsset } from "@upmind-automation/types";
import type { ComputedRef } from "vue";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/** Context types for the vault COLLECTION — whose vault is being addressed. */
export enum ClientNotesContextTypes {
  /** Acting on a client's vault. */
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * Scope matrix for `useClientNotes`. `client` is the only actor that
 * resolves; `staff` and `guest` are `null as never` (operator cell ruling,
 * 2026-08-27 — every staff capability the oracle demonstrates is recorded as
 * a signed drop in this module's `parity.yaml` rows S1-S6).
 *
 * WHAT THE TYPE SYSTEM ACTUALLY ENFORCES. `ScopeBuilderResult` accepts EVERY
 * `ScopeActorTypes` and reads the matrix row only to decide whether `.for()`
 * exists, so a `null as never` row removes `.for(...)` and nothing else:
 * `.as('staff')` and `.as('guest')` COMPILE, resolving to an instance with no
 * `.for()`, and are refused at RUNTIME — with no context to name a target,
 * `resolveClientId` falls back to the active session's own id and
 * `isAddressable` gates the request. The compile-time errors are
 * `.as('staff' | 'guest' | 'self').for(...)`, while `.as('client').for(...)`
 * type-checks. A designed boundary rather than an advertised-but-absent
 * capability. Same correction as `client-address.types.ts`, whose note carries
 * the `ts.createProgram` probe this rests on.
 */
export const CLIENT_NOTES_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ClientNotesContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientNotes` (derived from the runtime const). */
export type ClientNotesScopeMatrix = typeof CLIENT_NOTES_SCOPE_MATRIX;

/**
 * Context types for the per-asset MANAGER — which record is being edited.
 *
 * @decision
 * what: the context names the ENTITY (`"client-note"`), not its owner — the
 *   owning client falls through the same `resolveClientId` seam as every
 *   other call.
 * why: operator ruling R4 (design.md §D5), and both live siblings agree —
 *   `ClientPhoneContextTypes.PHONE = "phone"` and the client-address
 *   equivalent name the entity, not the owner. An owner-named context would
 *   duplicate the identity seam and create two ways to say the same thing.
 * rejected: `templates/SINGLE-READ.md`'s owner-named form — a SURFACED
 *   disagreement with the template, recorded rather than silently resolved
 *   (`ARMS.md`: "a disagreement is a surfaced finding, never silently
 *   resolved toward either"). The operator ruling and both live siblings win
 *   over the template; `parity.yaml` open finding W1 records that the
 *   template is the thing that should change.
 */
export enum ClientNoteContextTypes {
  /** Editing one existing vault asset by id. */
  NOTE = "client-note"
}

/**
 * Scope matrix for `useClientNoteManager`. Separate from the collection's —
 * the two composables scope on different things and cannot share one.
 */
export const CLIENT_NOTE_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ClientNoteContextTypes.NOTE,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientNoteManager` (derived from the runtime const). */
export type ClientNoteScopeMatrix = typeof CLIENT_NOTE_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/** One actor (user or client) who wrote or last changed a vault asset. */
export type VaultAssetActor = {
  /** The actor's id. */
  id: string;
  /** The actor's display name. */
  name: string;
  /** The actor's avatar image URL, if any. */
  imageUrl?: string;
  /** `true` when the actor is a client rather than a staff user. */
  isClient: boolean;
};

/**
 * The view model — a vault asset is ONE entity; `encrypted` is the
 * note-vs-secret discriminator, everything else is shared.
 */
// @graphify-citation see the header of this file — `graphify-out/graph.json`
// carries no prior node for a widened `VaultAsset.label` or a `useDate()`
// descriptor here; both widen existing module-local fields (D15 / C21), they
// mint no new type.
export type VaultAsset = {
  /** The asset's id. */
  id: string;
  /**
   * The asset's label. Required for a secret (row M7 / `@decision` on the
   * schema).
   *
   * @decision D15
   * what: widened to `string | null` — the module's own view model only.
   * why: 22 of 35 recorded fixture rows carrying this key have `null`, not an
   *   empty string. The prior `string` type coerced a real, meaningful
   *   absence into a value TypeScript claimed was always present, which is
   *   what let a label-less row read as truthy in a naive check (row C22 /
   *   AC-38).
   * rejected: widening the submodule's `IVaultAsset.label` — `packages/types`
   *   is a git submodule (§D1); out of this story's write lane, filed as
   *   follow-up row X3.
   */
  label: string | null;
  // @graphify-citation `graphify query "VaultAsset note field ciphertext
  // masking"` (2026-09-02, BFS depth 2, 4 nodes) — no `VaultAsset.note`
  // masking-contract node exists in `graphify-out/graph.json`; this widens
  // an existing view-model field's docblock (defect fix), it mints no new
  // type.
  /**
   * The note body — the real value for a note; `""` for an unrevealed
   * secret (the mapper never exposes the ciphertext envelope), the
   * plaintext once revealed.
   */
  note: string;
  /** `true` when this asset is a secret (stored encrypted, shown masked until revealed). */
  encrypted: boolean;
  /** `true` when this asset is pinned. */
  pinned: boolean;
  // @graphify-citation `graphify query "VaultAsset contract_product_id scalar
  // field client notes vault"` (2026-09-02, BFS depth 2, 12 nodes) — no
  // `VaultAsset.contract_product_id` node exists in `graphify-out/graph.json`;
  // this widens an existing view-model field (row M5/W9), it mints no new
  // type.
  /**
   * The linked contract product's id, or `null` when unlinked — the raw FK
   * scalar, independent of whether the `contractProduct` relation below was
   * loaded (`loadOne` requests no `with=` relations).
   */
  contract_product_id: IContractProduct["id"] | null;
  /** The contract product this asset is attached to, if any. */
  contractProduct?: IContractProduct | null;
  /** Who wrote this asset. */
  author?: VaultAssetActor;
  /** Who last changed this asset, if it has been changed. */
  editor?: VaultAssetActor;
  // @graphify-citation see the header of this file — graphify-out/ carries no
  // prior node for these fields; widening an existing view-model field, not a
  // new type (row C21 / AC-40).
  /**
   * Creation date, locale-formatted through the platform `useDate()`
   * descriptor (row C21 / AC-40) — every landed sibling that maps a date
   * (`client-email`, `client-email-history`, `invoices`) does the same; a raw
   * ISO string cannot render in the client's locale.
   */
  createdAt: FormattedDate;
  /** Last-updated date, same descriptor shape as {@link VaultAsset.createdAt}. */
  updatedAt: FormattedDate;
  meta: {
    /** `true` when this asset is a secret — the same value as `encrypted`, exposed as read-state. */
    isSecret: boolean;
    /** `true` when this asset is pinned — the same value as `pinned`, exposed as read-state. */
    isPinned: boolean;
    /** `true` when staff have hidden this asset from the client — `!(visible_for_client ?? true)`, the oracle's own expression. */
    isHiddenFromClient: boolean;
    /** `true` when this asset is attached to a contract product. */
    isLinkedToProduct: boolean;
    /**
     * `true` when this secret is CURRENTLY revealed — its decrypted plaintext is
     * merged into `note` and held in `useClientNotes().useContext().revealed`.
     * Client-side read-state (never on the wire): the mapper defaults it `false`
     * and the collection context flips it per the live `revealed` map. Drives the
     * `reveal` (secret & !revealed) vs `hide` (secret & revealed) control gating.
     */
    isRevealed: boolean;
  };
};

/**
 * The FORM model.
 *
 * @decision
 * what: the module declares its own form model, `VaultAssetModel`, and never
 *   imports `IVaultAssetForm`.
 * why: `packages/types` is a git submodule; widening it is a cross-repo
 *   change that cannot close inside this story's gates. `IVaultAssetForm` is
 *   already inaccurate at its only oracle consumer —
 *   `updateVaultAssetModal.vue:241-258` picks `encrypted` into a value typed
 *   as it, and pin/convert send `pinned`/`encrypted`, none of which it
 *   declares. `client-phone`'s `PhoneModel` and `client-address`'s address
 *   model are the sibling precedent for a module-owned form type over a wire
 *   type.
 * rejected: extending the submodule — correct in the long run, undeliverable
 *   in this story; recorded as follow-up row X3 in `parity.yaml`. The two
 *   types coexist and can drift; this module never imports the submodule
 *   form type.
 */
export type VaultAssetModel = {
  /** Present when editing an existing asset; absent for a new draft. */
  id?: string;
  /** The note body — always required, note or secret alike. */
  note: string;
  /** Required only when `encrypted` is true (row M7). */
  label?: string;
  /** The note-vs-secret discriminator. */
  encrypted: boolean;
  /** Always sent `false` on create; changed only through `setPinned`. */
  pinned: boolean;
  /** The linked contract product, or `null` to detach. */
  contract_product_id: IContractProduct["id"] | null;
  /**
   * Sent `true` on a client create (the oracle's own
   * `visible_for_client: this.isClient`); `readOnly: true` on the form
   * schema for this cell (row S3) — a client cannot write it, but the field
   * stays on the model because it drives the "hidden from client" read-state
   * (`VaultAsset.meta.isHiddenFromClient`).
   */
  visible_for_client: boolean;
};

/**
 * The manager's machine context. `isRevealed` records that the decrypt-on-open
 * already ran for this editor instance (AC-18) — without it, any re-entry
 * into `loading` (a `REFRESH`) would fire a second decrypt.
 */
export type VaultAssetContext = DataManagerContext<VaultAssetModel> & {
  /** `true` once this editor instance has decrypted its secret. */
  isRevealed?: boolean;
  /**
   * The currently-linked product seed (AC7) — populated once by `loading`'s
   * `loadLookups` invoke (from `loadOne`'s `with=contract_product`) and never
   * cleared by `CLEAR`. Consumed by `setSchemas` to seed the lookup control's
   * `options.lookup.current`, so an existing link's label shows before any
   * search. Typed shape: {@link VaultAssetLookups} (see the file-header
   * `graphify-out/` citation).
   *
   * Deliberately NOT re-declared with the narrower {@link VaultAssetLookups}
   * shape here — the inherited `DataManagerContext.lookups?: Record<string,
   * any[]>` is kept as-is. Narrowing it broke `AssignAction<VaultAssetContext,
   * …>`'s assignability against the shared machine's own
   * `Parameters<typeof dataManagerMachine.withConfig>[0]` for EVERY action in
   * this file, not only the ones touching `lookups` — an XState v4 typing
   * interaction, not a semantic requirement. Typed access for consumers goes
   * through {@link VaultAssetLookups} instead.
   */
};

// @graphify-citation see the file header — no `ContractProductLookupQuery`
// node in `graphify-out/graph.json`; these narrow the query platform's own
// `ListQuery` for this module's async product lookup (design.md §Layer 1/3).
/**
 * The criteria model the contract-product lookup query validates against — the
 * top-level `query` quick-search (emitted as a bare `query=<term>`) plus a page
 * window. `useLookup`'s search/pagination writes land on this instance.
 */
export type ProductLookupQueryModel = {
  query?: string | null;
  pagination?: { limit?: number; offset?: number };
};

/**
 * The contract-product lookup handle — a `listInfinite` query whose `select`
 * maps rows to {@link LookupItem}. This IS the service `useLookup` drives; it
 * rides a control's `options.lookup.service` as a thunk (below).
 */
export type ContractProductLookupQuery = ListQuery<
  IContractProduct[],
  LookupItem[],
  ProductLookupQueryModel
>;

/**
 * What a `lookup` control's `options.lookup.service` carries — a THUNK
 * returning the once-minted {@link ContractProductLookupQuery}, NOT the
 * reactive handle itself. A function is JSON-safe (dropped by the labs
 * renderer-port `JSON` round-trip and by `appliedOptions`' `cloneDeep`, as
 * `options.manage`'s composables are), whereas the live handle's circular
 * reactive refs throw on `JSON.stringify` — see `client-notes.schemas.ts`.
 */
export type ProductLookupService = () => ContractProductLookupQuery;

/**
 * The typed shape of {@link VaultAssetContext.lookups} — the ONE currently-
 * linked product, seeded on edit so its label shows before any search (AC7).
 * An array (0 or 1) to satisfy the inherited `Record<string, any[]>`.
 */
export type VaultAssetLookups = {
  currentProduct?: LookupItem[];
};

// -----------------------------------------------------------------------------
// QUERY MODEL
// -----------------------------------------------------------------------------

/**
 * The whole request state as one model — `filters` (nested column → operator
 * → value), `sort` (ordered, precedence = position) and `pagination`. This is
 * the instance validated against `useQuerySchema()`; the translator maps it
 * to the `QueryProps` the query layer already accepts.
 */
// @graphify-citation see the header of this file — `graphify-out/graph.json`
// carries no separate node for `QueryModel.filters.encrypted`; this widens an
// existing module-local field (D9), it does not mint a new type.
export type QueryModel = {
  filters?: {
    // Tri-state, matching `pinned.eq` — `null`/absent is the clear position,
    // "show everything" (`client-notes.schemas.ts` `@decision` D9).
    encrypted?: { eq?: boolean | null };
    label?: { like?: string | null };
    pinned?: { eq?: boolean | null };
    contract_product_id?: { eq?: string | null };
  };
  sort?: SortEntry[];
  pagination?: { limit?: number; offset?: number };
};

/** The nested filter model — the `filters` branch of {@link QueryModel}. */
export type FilterModel = NonNullable<QueryModel["filters"]>;

/**
 * One sort entry. `field` is a literal union of the query schema's own
 * declared `sort.items` enum (`client-notes.schemas.ts`'s `useQuerySchema()`
 * — `label` / `pinned` / `created_at`), mirroring
 * `client-address.types.ts:288`'s narrowing: an undeclared field is a
 * compile error here rather than a silently ajv-discarded write.
 */
export type SortEntry = {
  field: "label" | "pinned" | "created_at";
  dir: SortDirection;
};

/** The ordered sort model — the `sort` branch of {@link QueryModel}. */
export type SortModel = NonNullable<QueryModel["sort"]>;

/**
 * No `DEFAULT_SORT` constant here — deliberate (`@decision` D2 on the
 * schema's `sort` branch, `client-notes.schemas.ts`). The oracle deletes
 * `params.order` on every request and lets the BE apply pinned ordering; a
 * default `sort` would override that and regress the boot ordering.
 */

// -----------------------------------------------------------------------------
// SERVICES CONTRACT
// -----------------------------------------------------------------------------

/**
 * The reactive list query, minted ONCE per scope in `useClientNotes.ts`.
 * Aliased from the query platform's own `ListQuery` — never derived with
 * `ReturnType<typeof localServiceFn>`.
 */
export type ClientNoteListQuery = ListQuery<
  IVaultAsset[],
  VaultAsset[],
  QueryModel
>;

/** Lands a failed row mutation (`remove` / `setPinned` / `setEncrypted`) in the services instance's error state. */
export type ClientNoteErrorCapture = (error: unknown) => void;

/**
 * The contract `createClientNoteServices` resolves to — consumed by BOTH
 * halves, so the collection and the manager address the same client through
 * the same seam.
 */
export type ClientNoteServices = {
  /** The module's base cache key; a save invalidates it and the list refetches. */
  queryKey: QueryKey;
  /** The target client this scope resolved. The manager seeds its machine context from here rather than re-reading the session. */
  clientId: ComputedRef<string | undefined>;
  /**
   * The reactive form of the ONE addressability predicate every request gate
   * in `client-notes.services` calls — authenticated, addressable, AND the
   * brand feature gate. The composable layers read THIS rather than
   * re-deriving the expression.
   */
  isAvailable: ComputedRef<boolean>;
  /** The last failed row mutation, captured as state — never raised itself. */
  error: ComputedRef<ResponseError | undefined>;
  /** The collection's list query. Takes NOTHING: the request state is the declared query schema. */
  loadList: () => ClientNoteListQuery;
  /** Per-asset read; seeds the manager when no collection is loaded. */
  loadOne: (id?: string) => Promise<VaultAsset | undefined>;
  add: (model: VaultAssetModel) => Promise<IVaultAsset | undefined>;
  update: (
    id: string,
    model: Partial<VaultAssetModel>
  ) => Promise<IVaultAsset | undefined>;
  remove: (id: string) => Promise<void>;
  setPinned: (id: string, pinned: boolean) => Promise<IVaultAsset | undefined>;
  setEncrypted: (
    id: string,
    encrypted: boolean
  ) => Promise<IVaultAsset | undefined>;
  /**
   * Reveal a secret's plaintext. Neither `loadOne` nor a CRUD verb — the
   * headless analogue of the oracle's `storeData: false`. NEVER cached (row
   * C11 / `@decision` D8).
   */
  decrypt: (id: string) => Promise<string>;
  /** `loading` — seeds the form, decrypting on open when the seed is an unrevealed secret. */
  loadLookups: (
    context: VaultAssetContext
  ) => Promise<Partial<VaultAssetContext>>;
  // @graphify-citation see the file header — `graphify-out/graph.json` carries
  // no `ContractProductLookupQuery` node; this mints the async lookup handle.
  /**
   * The async contract-product lookup — a client-scoped `listInfinite` query
   * over `contracts_products` (bounded, `product.name`-searchable, paged). The
   * ONE handle `useLookup` drives; minted once per scope in the composables,
   * threaded onto both controls' `options.lookup.service`. Replaces the eager
   * `limit:100` full-list read (design.md §Layer 3).
   *
   * `isActive` gates the FETCH (not the mint): it stays `false` until the
   * control first reads the service, so manager `loading` boot fires no
   * `contracts_products` request (AC2) — the first fetch is the control's own.
   */
  loadContractProductLookup: () => ContractProductLookupQuery;
  /** `available.checking.parsing` — schema-parses the incoming model. */
  parse: (
    context: VaultAssetContext,
    event: AnyEventObject
  ) => Promise<Partial<VaultAssetContext>>;
  /** `available.checking.validating` and `processing.validating`. */
  validate: (
    context: Partial<VaultAssetContext>
  ) => Promise<VaultAssetModel | undefined>;
  /** Invalidates {@link ClientNoteServices.queryKey} so the collection refetches. */
  refresh: () => Promise<void>;
};

/**
 * The XState services map handed to `dataManagerMachine.withConfig({ services })`.
 * One key per `invoke.src` the shared machine names.
 */
export type ClientNoteManagerMachineServices = {
  loadLookups: (
    context: VaultAssetContext
  ) => Promise<Partial<VaultAssetContext>>;
  parse: (
    context: VaultAssetContext,
    event: AnyEventObject
  ) => Promise<Partial<VaultAssetContext>>;
  validate: (
    context: VaultAssetContext
  ) => Promise<VaultAssetModel | undefined>;
  /** `processing.adding` — reached when the machine's `isNew` guard passes. */
  add: (context: VaultAssetContext) => Promise<IVaultAsset | undefined>;
  /** `processing.updating` — reached when context already carries an id. */
  update: (context: VaultAssetContext) => Promise<IVaultAsset | undefined>;
};
