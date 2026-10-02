// -----------------------------------------------------------------------------
/**
 * @module invoice
 * @description The curated public barrel of the invoice and order-view surface.
 */

// --- Export Views
export { default as UpmOrder } from "./components/Order.vue";

// --- Export Components
export { default as UpmOrderProducts } from "./components/OrderProducts.vue";
export {
  detailsSkeletonItemVariants,
  detailsSkeletonRootVariants,
  detailsSkeletonRowVariants,
  detailsSkeletonTotalRowVariants,
  detailsTotalLabelVariants,
  detailsTotalRootVariants,
  detailsTotalValueVariants
} from "./variants";

// --- Export Types
export { ORDER_TEMPLATE } from "./types";
export type { OrderProps, OrderTemplates } from "./types";
