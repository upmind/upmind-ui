// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockVault
 * @description The client's notes and secrets, managed — the mock stand-in for
 * `useClientVault` (`contracts/client-vault.ts`). One module scoped two ways:
 * the account panels read the rows whose `contract_product_id` is null, a
 * product's panels read its own, and both write through here.
 *
 * `encrypted` IS the note/secret axis, so converting one to the other is a
 * flip of that flag rather than a move between two lists (the contract's own
 * `convert`). A CREATE is handed its scope and its axis (`VaultAssetScope`)
 * because the shell mounts one dialog for every form (plan F2) — an edit
 * needs neither: the row it addresses carries both already.
 */

import {
  defineMockFacade,
  MOCK_RECEIPT_REASON,
  mockId,
  submittedText
} from "./facade";
import { assign, find, map, remove } from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type { VaultAssetScope } from "../contracts/client-vault";
import type { MockDataset } from "../types";
import type { MockVaultAsset } from "../types";
import type { FormModel } from "@upmind/ui";
// -----------------------------------------------------------------------------

/**
 * Whether the account is still being imported. Legacy hung EVERY vault control
 * off this one fact (`clientVaultAssetsModal.vue:10` passes `isStaged` down as
 * `is-disabled`; `useBrandAppearance.ts:44` reads it as `!!client.staged_import`),
 * and it is the only guard the vault has.
 */
export function isStagedImport(data: MockDataset): boolean {
  return data.persona.stagedImport === true;
}

export const useMockVault = defineMockFacade(
  (data): readonly MockVaultAsset[] => data.vault,
  data => ({
    /**
     * Why the vault takes no change right now — an account still being
     * imported. Asked BEFORE any control is offered (plan R4), which is what
     * legacy's `is-disabled` did to the whole panel.
     */
    whyNotEditable: (): MockActionReceipt<MockVaultAsset> | undefined => {
      if (!isStagedImport(data)) return undefined;
      return { ok: false, reason: MOCK_RECEIPT_REASON.STAGED_IMPORT };
    },

    /**
     * Pins one row to the top of its panel, or lets it back down — legacy's
     * `updatePinned`, which posted the flag inverted and returned early while
     * the account was staged.
     */
    setPinned: (
      assetId: string
    ): MockActionReceipt<MockVaultAsset> | undefined => {
      const asset = find(data.vault, { id: assetId });
      if (asset === undefined) return undefined;
      if (isStagedImport(data)) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.STAGED_IMPORT,
          entity: asset
        };
      }
      assign(asset, {
        pinned: asset.pinned !== true,
        updated_at: new Date().toISOString()
      });
      return { ok: true, entity: asset };
    },

    /**
     * Adds one note or secret. The SCOPE says where it belongs — an account
     * row carries no product, a product row carries its own — and `encrypted`
     * says which of the two panels it lands in.
     */
    create: (
      model: FormModel,
      scope: VaultAssetScope
    ): MockActionReceipt<MockVaultAsset> => {
      const stamped = new Date().toISOString();
      const created: MockVaultAsset = {
        id: mockId("vault", map(data.vault, "id")),
        label: submittedText(model, "label"),
        note: submittedText(model, "value"),
        encrypted: scope.encrypted,
        client_id: data.persona.id,
        contract_product_id: scope.contractProductId ?? null,
        created_at: stamped,
        updated_at: stamped
      };
      data.vault.push(created);
      return { ok: true, entity: created };
    },

    /** Edits one; its scope and its axis are the row's own and do not move. */
    update: (
      assetId: string,
      model: FormModel
    ): MockActionReceipt<MockVaultAsset> | undefined => {
      const asset = find(data.vault, { id: assetId });
      if (asset === undefined) return undefined;
      assign(asset, {
        label: submittedText(model, "label"),
        note: submittedText(model, "value"),
        updated_at: new Date().toISOString()
      });
      return { ok: true, entity: asset };
    },

    /** Deletes one note or secret; an id the client does not hold is a quiet no-op. */
    remove: (
      assetId: string
    ): MockActionReceipt<MockVaultAsset> | undefined => {
      const asset = find(data.vault, { id: assetId });
      if (asset === undefined) return undefined;
      remove(data.vault, { id: assetId });
      return { ok: true, entity: asset };
    },

    /** Turns a note into a secret, or a secret back into a note. */
    convert: (
      assetId: string
    ): MockActionReceipt<MockVaultAsset> | undefined => {
      const asset = find(data.vault, { id: assetId });
      if (asset === undefined) return undefined;
      assign(asset, { encrypted: !asset.encrypted });
      return { ok: true, entity: asset };
    }
  })
);
