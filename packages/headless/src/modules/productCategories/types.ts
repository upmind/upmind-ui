// --- types
import type { IProductCategory } from "@upmind-automation/types";

export type ProductCategory = {
  id: IProductCategory["id"];
  title: IProductCategory["name"]; // translated name for display purposes
  name: IProductCategory["name"]; // untranslated name for reporting purposes
  description?: IProductCategory["description"];
  excerpt?: IProductCategory["short_description"];
  count?: IProductCategory["products_count"];
  uiMeta?: Record<string, any>;
  imageUrl?: string;
  categories?: ProductCategory[];
};
