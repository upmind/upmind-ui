import type { ProductSortProps } from "../products/types";
import type { ProductCategory } from "@upmind-automation/headless";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

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

export type CategoriesItemProps = Omit<CategoriesProps, "modelValue"> &
  Omit<ProductCategory, "title"> & { title?: string; isFaceted: boolean };
