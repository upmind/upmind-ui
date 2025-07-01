export interface ProductsProps {
  categoryId?: string;
  facetCategoryId?: string | null;
  sortValue?: string;
  searchQuery?: string;
}

export interface FacetProps {
  categoryId?: string;
  selectedCategoryId?: string | null;
}

export interface ProductSortProps {
  modelValue?: string;
}

export const ProductSortType = {
  DEFAULT: "default",
  NAME: "name",
  PRICE: "price"
} as const;
