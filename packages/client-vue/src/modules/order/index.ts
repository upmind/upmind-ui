// -----------------------------------------------------------------------------

// --- Export Views
export { default as UpmOrder } from "./Order.vue";

// --- Export Components
export { default as UpmOrderProducts } from "./components/OrderProducts.vue";
export { default as UpmOrderEnclosedTemplate } from "./templates/OrderEnclosed.template.vue";
export { default as UpmOrderFullTemplate } from "./templates/OrderFull.template.vue";
export { default as UpmOrderInsetTemplate } from "./templates/OrderInset.template.vue";
export { default as UpmOrderLTRTemplate } from "./templates/OrderLTR.template.vue";
export { default as UpmOrderRTLTemplate } from "./templates/OrderRTL.template.vue";
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
export type { OrderProps } from "./types";
