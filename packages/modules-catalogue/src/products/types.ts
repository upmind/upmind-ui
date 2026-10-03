import type {
  ProductSortableProperties,
  RequestSortDirection
} from "@upmind-automation/headless";

export interface ProductsProps {
  categoryId?: string;
  sort?: ProductSortProps;
  query?: string;
}

export interface ProductSortProps {
  property?: ProductSortableProperties;
  direction?: RequestSortDirection;
}
