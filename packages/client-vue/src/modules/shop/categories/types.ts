import type { ProductCategory } from "@upmind-automation/headless";

export interface CategoriesProps {
  categoryId?: string;
}

export interface CategoriesHeaderProps {
  category?: ProductCategory;
  categoryId?: string;
}

export interface ControlsProps {
  categoryId?: string;
}
