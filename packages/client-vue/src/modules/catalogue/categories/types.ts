import type { ProductSortProps } from "../products/types";

export interface CategoriesProps {
  modelValue?: string;
  sort?: ProductSortProps["property"];
  direction?: ProductSortProps["direction"];
}

export interface CategoriesFacetProps extends CategoriesProps {
  query: string;
}
