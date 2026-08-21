/**
 * @graphify-citation `graphify query "module query model filter sort pagination
 * schema"` (2026-08-10) — no `ProductCategoryQueryModel` / `ProductCategoryQuerySchema` node anywhere in
 * `graphify-out/graph.json`. The query platform's `QueryProps` describes the
 * WIRE shape; this describes the schema-validated MODEL. No duplicate to
 * consume, so minting here is warranted.
 */
import type { Badge } from "../config/schema";
import type { JsonSchema7 } from "@jsonforms/core";
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

// -----------------------------------------------------------------------------
// QUERY MODEL — the collection's whole request state as ONE model
// -----------------------------------------------------------------------------

/**
 * The whole request state as one model. The tree is read whole and walked in
 * the client, so `pagination` is the only branch. This is the instance
 * validated against `useQuerySchema()`.
 */
export type ProductCategoryQueryModel = {
  pagination?: { limit?: number; offset?: number };
};

/**
 * The collection's query schema. A `JsonSchema7`: the translator and the
 * validators walk it at runtime, so the type stays general rather than a
 * module-specific literal.
 */
export type ProductCategoryQuerySchema = JsonSchema7;
