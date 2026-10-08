// -----------------------------------------------------------------------------
/**
 * @module contract-product/index
 * @description A client's own contract products: the collection
 * (`useContractProducts`) and the per-product manager (`useContractProduct`).
 * This barrel is the module's only public surface. The query schema family
 * reaches consumers through `useContractProducts().useContext().schemas`.
 */

export {
  useContractProducts,
  type UseContractProducts
} from "./useContractProducts";
export {
  useContractProduct,
  type UseContractProduct
} from "./useContractProduct";

export {
  CONTRACT_PRODUCTS_SCOPE_MATRIX,
  ContractProductsContextTypes
} from "./contract-product.types";
export type { ContractProductsScopeMatrix } from "./contract-product.types";

export {
  ContractProductCancelOption,
  ContractProductFormTypes,
  ContractProductsSortableProperties,
  ContractProductState
} from "./contract-product.types";
export type {
  BillingEntityChoice,
  CancellationModel,
  ContractProduct,
  ContractProductEmbedded,
  ContractProductContext,
  ContractProductRequest,
  ContractProductStatus,
  MigrationConfig,
  MigrationPreview,
  MigrationResult,
  MigrationTarget,
  RequestCancellationModel,
  ScheduleCancellationModel,
  ScheduledAction,
  SetConsolidationModel,
  SoftCancelModel
} from "./contract-product.types";

// The `contract` module maps its `products` relation, and `tickets` its
// single read's linked product, with these.
export {
  mapContractProduct,
  mapContractProductEmbedded
} from "./contract-product.mappers";

export { minFutureCancellationDate } from "./contract-product.utils";

export type { UseContractProductsActions } from "./useContractProducts.actions";
export type { UseContractProductsContext } from "./useContractProducts.context";
export type { UseContractProductsMeta } from "./useContractProducts.meta";
export type { UseContractProductsInternals } from "./useContractProducts.internals";

export type { UseContractProductActions } from "./useContractProduct.actions";
export type { UseContractProductContext } from "./useContractProduct.context";
export type { UseContractProductMeta } from "./useContractProduct.meta";
export type { UseContractProductInternals } from "./useContractProduct.internals";
