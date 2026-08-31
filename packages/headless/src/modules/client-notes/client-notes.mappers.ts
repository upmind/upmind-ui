/** @internal */
import { map, isArray } from "lodash-es";
import type {
  VaultAsset,
  VaultAssetActor,
  VaultAssetModel
} from "./client-notes.types";
import type { IClient, IUser, IVaultAsset } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-notes/client-notes.mappers
 * @description Wire ↔ view-model shaping for the vault. Pure — no side
 * effects, no HTTP, and never actor-scoped: a divergent response shape would
 * be expressed as an actor-named mapper chosen at a services arm's own
 * `select:` call site, not by scoping this file.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientNotes.ts` / `useClientNoteManager.ts` only
 * (`@internal/no-cross-module-imports`).
 */

/** Maps the list response to the view-model collection. */
export function mapVaultAssets(raw: IVaultAsset | IVaultAsset[]): VaultAsset[] {
  const rows = isArray(raw) ? raw : [raw];
  return map(rows, mapVaultAsset);
}

/** Maps one wire record to the view-model. */
export function mapVaultAsset(raw: IVaultAsset): VaultAsset {
  return {
    id: raw.id,
    label: raw.label,
    note: raw.note,
    encrypted: raw.encrypted,
    pinned: raw.pinned,
    contractProduct: raw.contract_product,
    author: mapVaultAssetActor(raw.author_user, raw.author_client),
    editor: mapVaultAssetActor(raw.editor_user, raw.editor_client),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    meta: {
      isSecret: raw.encrypted,
      isPinned: raw.pinned,
      isHiddenFromClient: !(raw.visible_for_client ?? true),
      isLinkedToProduct: !!raw.contract_product_id
    }
  };
}

/**
 * Collapses the `author_user`/`author_client` (and `editor_*`) relation pair
 * into one actor, matching `vaultAssetAuthorSummary.vue:80-95`'s
 * `author_user || author_client` precedence.
 */
export function mapVaultAssetActor(
  user?: IUser | null,
  client?: IClient | null
): VaultAssetActor | undefined {
  if (user?.id) {
    return {
      id: user.id,
      name: user.fullname,
      imageUrl: user.image_url,
      isClient: false
    };
  }
  if (client?.id) {
    return {
      id: client.id,
      name: client.fullname,
      imageUrl: client.image_url ?? undefined,
      isClient: true
    };
  }
  return undefined;
}

/**
 * Maps the form model to the CREATE request body. `pinned` is always sent
 * `false` on create (the oracle's own `initForm()`), never the model's own
 * value.
 *
 * @decision
 * what: `contract_product_id` is coalesced to `null` with `??`, never sent
 *   as-is off the model.
 * why: `VaultAssetModel.contract_product_id` is declared always-present
 *   (`IContractProduct["id"] | null`, never optional), but the shared
 *   `useModelParser`/`compactDeep` pipeline (`utils/isDeepEmpty.ts`) strips
 *   ANY `null`-valued scalar to `undefined` on its way through `parse`/
 *   `loadLookups` — by design, for the 14 other modules that pipeline also
 *   serves. Re-asserting the coalesce here, at the wire boundary, restores
 *   the always-present contract (parity row M5: "contract_product_id null is
 *   present in the body, not stripped, so detaching works") without editing
 *   that shared utility. `label` is NOT given the same treatment: it is
 *   genuinely optional on `VaultAssetModel`, and its ABSENCE from a create
 *   body (a plain note, oracle's `initForm()`) is the correct wire shape
 *   (row M3) — only `contract_product_id`'s always-present contract needs
 *   restoring.
 * rejected: fixing the null-stripping at its source (`useModelParser`/
 *   `compactDeep`, `utils/isDeepEmpty.ts`) — a shared utility 14 OTHER
 *   modules also depend on for that exact null-to-undefined normalisation;
 *   out of this module's write lane and out of this fix's scope.
 */
export function mapVaultAssetCreate(
  model: VaultAssetModel
): Partial<IVaultAsset> {
  return {
    encrypted: model.encrypted,
    pinned: false,
    contract_product_id: model.contract_product_id ?? null,
    note: model.note,
    visible_for_client: model.visible_for_client,
    label: model.label
  } as Partial<IVaultAsset>;
}

/**
 * Maps the form model to the UPDATE request body — the oracle's own
 * five-key body (`updateVaultAssetModal.vue:241-258,275-281`). `pinned` is
 * excluded — `setPinned` owns that write.
 *
 * @decision
 * what: both `contract_product_id` and `label` are coalesced to `null` with
 *   `??`.
 * why: same shared-pipeline null-stripping as `mapVaultAssetCreate`'s
 *   decision above, but the oracle's edit form (`updateVaultAssetModal.vue`)
 *   sends its OWN five keys unconditionally — `label` is one of the fixed
 *   five here (parity row M5), unlike the create body where its absence is
 *   itself the correct shape. An edited asset with no label must still carry
 *   `label: null` on the wire, not omit the key.
 * rejected: same as `mapVaultAssetCreate`'s decision above — editing the
 *   shared `useModelParser`/`compactDeep` pipeline is out of this module's
 *   write lane.
 */
export function mapVaultAssetUpdate(
  model: VaultAssetModel
): Partial<IVaultAsset> {
  return {
    contract_product_id: model.contract_product_id ?? null,
    label: model.label ?? null,
    visible_for_client: model.visible_for_client,
    encrypted: model.encrypted,
    note: model.note
  } as Partial<IVaultAsset>;
}
