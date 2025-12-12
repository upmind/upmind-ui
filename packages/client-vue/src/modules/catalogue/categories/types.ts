import type { RouteLocationAsRelativeGeneric } from "vue-router";
import type { ProductSortProps } from "../products/types";

export interface CategoriesProps {
  modelValue?: string;
  sort?: ProductSortProps["property"];
  direction?: ProductSortProps["direction"];
  categoryRoute: RouteLocationAsRelativeGeneric;
  name: string;
}

export interface CategoriesFacetProps extends CategoriesProps {
  query: string;
}
