/** @internal */
import { useDate } from "../../utils";
import { map, isArray } from "lodash-es";
import type { LookupItem } from "../lookup";
import type {
  VaultAsset,
  VaultAssetActor,
  VaultAssetModel
} from "./client-notes.types";
import type {
  IClient,
  IContractProduct,
  IUser,
  IVaultAsset
} from "@upmind-automation/types";
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

/**
 * Maps one wire record to the view-model.
 *
 * @decision (row M5/W9)
 * what: maps `raw.contract_product_id` onto `VaultAsset.contract_product_id`
 *   as its own scalar, alongside (not instead of) the existing
 *   `contractProduct`/`meta.isLinkedToProduct` mappings.
 * why: the FK id is independent of the `contract_product` relation — the wire
 *   always returns it, whether or not `with=contract_product` was requested.
 *   Without the scalar, `useClientNoteManager`'s `loadOne` read (which
 *   requests no `with=` relations) left the editor's seeded model with no
 *   linked-product value to select, even on a linked record.
 * rejected: reading `contractProduct?.id` alone (the pre-existing shape) —
 *   correct only when the relation was loaded, which `loadOne` never does.
 */
/**
 * @decision (defect fix — operator screenshot; `note` docblock below)
 * what: an encrypted row's mapped `note` is `""`, never `raw.note`.
 * why: `raw.note` on an encrypted row is the base64 Laravel envelope — the
 *   wire never decrypts on a list/single read, only `POST …/decrypt` does
 *   (`client-notes.services.ts`'s `decrypt`). Mapping it straight through
 *   handed every consumer the ciphertext, which is what the operator's
 *   screenshot showed rendered raw in the NOTE column. The oracle
 *   (`vaultSecretItem.vue`) never holds the envelope in view state either —
 *   its `note` local starts `""` and is only ever written by the SAME
 *   decrypt response this module's `reveal`/decrypt-on-open already use;
 *   `""` is the parity-matching "nothing to show yet" value, and this
 *   mapper's own scope has no access to a `revealed` map (that lives above
 *   it, `useClientNotes.ts`/`useClientNoteManager.services.ts`) to fill in
 *   otherwise.
 * rejected: a masked placeholder string (e.g. bullets) — the oracle's
 *   masking is a RANDOM-length presentational choice
 *   (`` `&bull;`.repeat($_.random(8,16)) ``) made by the component, not a
 *   fixed value a pure, side-effect-free mapper should invent; a consumer
 *   renders its own mask off `meta.isSecret` + an empty `note`, same as it
 *   already must merge in `revealed` for the decrypted case.
 */
export function mapVaultAsset(raw: IVaultAsset): VaultAsset {
  return {
    id: raw.id,
    label: raw.label,
    note: raw.encrypted ? "" : raw.note,
    encrypted: raw.encrypted,
    pinned: raw.pinned,
    contract_product_id: raw.contract_product_id,
    contractProduct: raw.contract_product,
    author: mapVaultAssetActor(raw.author_user, raw.author_client),
    editor: mapVaultAssetActor(raw.editor_user, raw.editor_client),
    createdAt: useDate(raw.created_at),
    updatedAt: useDate(raw.updated_at),
    meta: {
      isSecret: raw.encrypted,
      isPinned: raw.pinned,
      isHiddenFromClient: !(raw.visible_for_client ?? true),
      isLinkedToProduct: !!raw.contract_product_id,
      // Client-side read-state, never on the wire — the collection context flips
      // it per the live `revealed` map (`useClientNotes.context.ts`).
      isRevealed: false
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

/**
 * Maps a `contracts_products` row to a lookup option `{ value, label }`. The
 * `label` leads with the service identifier, falling back to the product/plain
 * name — the same string the oracle's picker row leads with.
 */
export function mapContractProductLookupItem(cp: IContractProduct): LookupItem {
  return {
    value: cp.id,
    label: cp.service_identifier || cp.product_name || cp.name
  };
}

/** Maps a `contracts_products` page to lookup options — the query's `select`. */
export function mapContractProductLookupItems(
  raw: IContractProduct[] = []
): LookupItem[] {
  return map(raw, mapContractProductLookupItem);
}
