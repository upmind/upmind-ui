// -----------------------------------------------------------------------------
/**
 * @module contract-product
 * @description A client's own contract products. This module ships TWO scoped
 * composables: the collection (`useContractProducts`) and the per-product
 * manager (`useContractProduct`), backed by the locked
 * `contract-product.machine.ts`.
 *
 * This barrel is the module's ONLY public surface — `contract-product.services.ts`,
 * `contract-product.mappers.ts`, `contract-product.schemas.ts` and
 * `contract-product.machine.ts` each carry a line-1 internal marker and are
 * never imported directly by another module. Curated named re-exports only;
 * no `export *`.
 *
 * NO SCHEMA EXPORTS HERE. The query schema family reaches consumers through
 * `useContractProducts().useContext().schemas`.
 *
 * Both composables support the CLIENT'S OWN scope only (R2) — `staff` and
 * `guest` are compile-time errors.
 */

// --- Composables (collection + manager)
export {
  useContractProducts,
  type UseContractProducts
} from "./useContractProducts";
export {
  useContractProduct,
  type UseContractProduct
} from "./useContractProduct";

// --- Scope matrices — one per composable, both public
export {
  CONTRACT_PRODUCTS_SCOPE_MATRIX,
  ContractProductsContextTypes,
  CONTRACT_PRODUCT_SCOPE_MATRIX,
  ContractProductContextTypes
} from "./contract-product.types";
export type {
  ContractProductsScopeMatrix,
  ContractProductScopeMatrix
} from "./contract-product.types";

// --- Public model types (shared by both composables)
export { ContractProductState } from "./contract-product.types";
export type {
  ContractProduct,
  ContractProductContext,
  ContractProductRequest,
  ContractProductRequestStatus,
  ContractProductStatus,
  ScheduleCancellationModel,
  ScheduledAction,
  SetConsolidationModel,
  SoftCancelModel,
  UnpaidInvoice
} from "./contract-product.types";

// --- Curated cross-module mapper (the `contract` module maps its `products` relation with it)
export { mapContractProduct } from "./contract-product.mappers";

// --- Unpaid-invoice predicates (AC10, ADR-10, design 8.7 [o23]) — pure
// functions of `Pick<IInvoice, "status">`, not meta (R23); call per invoice.
export { isCancellable, isDue } from "./contract-product.utils";

// --- Sub-composable type exports for consumers (collection)
export type { UseContractProductsActions } from "./useContractProducts.actions";
export type { UseContractProductsContext } from "./useContractProducts.context";
export type { UseContractProductsMeta } from "./useContractProducts.meta";
export type { UseContractProductsInternals } from "./useContractProducts.internals";

// --- Sub-composable type exports for consumers (manager)
export type { UseContractProductActions } from "./useContractProduct.actions";
export type { UseContractProductContext } from "./useContractProduct.context";
export type { UseContractProductMeta } from "./useContractProduct.meta";
export type { UseContractProductInternals } from "./useContractProduct.internals";
