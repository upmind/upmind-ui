import type {
  ProductSortableProperties,
  RequestSortDirection
} from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

export type ProductsProps = {
  categoryId?: string;
  sort?: ProductSortProps;
  query?: string;
};

export type ProductSortProps = {
  property?: ProductSortableProperties;
  direction?: RequestSortDirection;
};
