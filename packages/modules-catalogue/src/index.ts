// -----------------------------------------------------------------------------
/**
 * @module catalogue
 * @description Browse: the catalogue page and the category tree under it.
 */

// --- Export Views
export { default as UpmCatalogue } from "./components/Catalogue.vue";
export { default as UpmCategories } from "./categories/Categories.vue";
export { default as UpmProducts } from "./products/WidgetGrid.vue";

// --- Export Types
export { CATALOGUE_TEMPLATE } from "./types";
export type { CatalogueTemplates } from "./types";

// --- Export the types the module published
export type {
  CategoriesFacetProps,
  CategoriesItemProps,
  CategoriesProps
} from "./categories/types";
export type { ProductSortProps, ProductsProps } from "./products/types";
