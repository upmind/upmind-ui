import type { Badge } from "../config/schema";
import type { IProductCategory } from "@upmind-automation/types";

export type ProductCategory = {
  id: IProductCategory["id"];
  title: IProductCategory["name"]; // translated name for display purposes
  name: IProductCategory["name"]; // untranslated name for reporting purposes
  description?: IProductCategory["description"];
  badge?: Badge;
  excerpt?: IProductCategory["short_description"];
  count?: IProductCategory["products_count"];
  countDeep?: IProductCategory["products_count"]; // includes sum of subcategories' products_count
  uiMeta?: Record<string, unknown>;
  imageUrl?: string;
  children?: ProductCategory[];
  parent?: IProductCategory["parent_id"];
};
