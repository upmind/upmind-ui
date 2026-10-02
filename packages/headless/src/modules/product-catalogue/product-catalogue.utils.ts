import type { ProductCatalogueScope } from "./product-catalogue.types";
import type { QueryKey } from "@tanstack/vue-query";
// -----------------------------------------------------------------------------
/**
 * @module product-catalogue/product-catalogue.utils
 * @description Pure helpers of the catalogue reads.
 */
// -----------------------------------------------------------------------------

/**
 * The query key of a scoped read. A scope reads no basket, so the key carries
 * the caller's own currency and account in place of the basket's.
 *
 * @param base - The catalogue's own query key.
 * @param scope - The caller's scope.
 * @returns The key of a scoped read.
 */
export function scopeQueryKey(
  base: QueryKey,
  scope: ProductCatalogueScope
): QueryKey {
  return [
    ...base,
    "scope",
    { currencyId: scope.currencyId, accountId: scope.accountId }
  ];
}
