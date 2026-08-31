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

import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ResponseError } from "../../utils";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { ListQuery } from "../query";
import type { SortDirection } from "../query/query.types";
import type { JsonSchema7 } from "@jsonforms/core";
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
 * resolves; `staff` and `guest` are `null as never`, which makes
 * `.as('staff')` a compile-time error rather than an advertised-but-absent
 * capability (operator cell ruling, 2026-08-27 — every staff capability the
 * oracle demonstrates is recorded as a signed drop in this module's
 * `parity.yaml` rows S1-S6).
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
export interface VaultAssetActor {
  /** The actor's id. */
  id: string;
  /** The actor's display name. */
  name: string;
  /** The actor's avatar image URL, if any. */
  imageUrl?: string;
  /** `true` when the actor is a client rather than a staff user. */
  isClient: boolean;
}

/**
 * The view model — a vault asset is ONE entity; `encrypted` is the
 * note-vs-secret discriminator, everything else is shared.
 */
export interface VaultAsset {
  /** The asset's id. */
  id: string;
  /** The asset's label. Required for a secret (row M7 / `@decision` on the schema). */
  label: string;
  /** The note body — the real value for a note, the plaintext once revealed for a secret. */
  note: string;
  /** `true` when this asset is a secret (stored encrypted, shown masked until revealed). */
  encrypted: boolean;
  /** `true` when this asset is pinned. */
  pinned: boolean;
  /** The contract product this asset is attached to, if any. */
  contractProduct?: IContractProduct | null;
  /** Who wrote this asset. */
  author?: VaultAssetActor;
  /** Who last changed this asset, if it has been changed. */
  editor?: VaultAssetActor;
  /** ISO creation timestamp. */
  createdAt: string;
  /** ISO last-updated timestamp. */
  updatedAt: string;
  meta: {
    /** `true` when this asset is a secret — the same value as `encrypted`, exposed as read-state. */
    isSecret: boolean;
    /** `true` when this asset is pinned — the same value as `pinned`, exposed as read-state. */
    isPinned: boolean;
    /** `true` when staff have hidden this asset from the client — `!(visible_for_client ?? true)`, the oracle's own expression. */
    isHiddenFromClient: boolean;
    /** `true` when this asset is attached to a contract product. */
    isLinkedToProduct: boolean;
  };
}

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
export interface VaultAssetModel {
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
}

/**
 * The manager's machine context. `isRevealed` records that the decrypt-on-open
 * already ran for this editor instance (AC-18) — without it, any re-entry
 * into `loading` (a `REFRESH`) would fire a second decrypt.
 */
export interface VaultAssetContext extends DataManagerContext<VaultAssetModel> {
  /** `true` once this editor instance has decrypted its secret. */
  isRevealed?: boolean;
}

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
  /** `true` for a staged-import client — reads still work; every write action refuses. */
  isDisabled: ComputedRef<boolean>;
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
