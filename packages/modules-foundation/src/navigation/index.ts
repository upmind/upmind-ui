/**
 * @module foundation/navigation
 * @description The shared "back" affordance and the breadcrumb builder.
 */

export { default as Back } from "./Back.vue";
export { useBreadcrumbs } from "./useBreadcrumbs";
export type {
  BreadcrumbCategory,
  UseBreadcrumbItemsOptions
} from "./useBreadcrumbs";
export type { StorefrontRoute } from "./types";
