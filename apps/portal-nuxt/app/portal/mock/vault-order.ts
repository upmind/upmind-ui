// -----------------------------------------------------------------------------
/**
 * @module portal/mock/vault-order
 * @description The order a vault panel reads in: pinned rows first, then the
 * order they already had.
 *
 * Legacy left this to the SERVER — `vaultProvider.vue:164` deletes the sort
 * from its own query so the back end can put pinned rows on top — so it is
 * the mock's server that does it here, never a component.
 *
 * A LEAF on purpose: the account panels order through `collection-defs.ts`
 * and the product panels through `selectors.ts`, and `collection-defs.ts`
 * cannot import the facade barrel — that edge closes a module-load cycle
 * through the store and the seeds.
 */

import { orderBy } from "lodash-es";
import type { MockVaultAsset } from "./types";

export function pinnedFirst(
  assets: readonly MockVaultAsset[]
): MockVaultAsset[] {
  return orderBy(assets, asset => asset.pinned === true, ["desc"]);
}
