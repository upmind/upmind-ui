import { SortDirection } from "../query/query.types";
import type { QuerySortEntry } from "../query/query.types";
import type { JsonSchema7 } from "@jsonforms/core";

// -----------------------------------------------------------------------------
// QUERY MODEL — the collection's whole request state as ONE model
// -----------------------------------------------------------------------------

/**
 * Properties by which products can be sorted. The values are the API's own
 * `order=` columns, so the schema's `sort.field` enum is this enum's members.
 */
export enum ProductSortableProperties {
  DEFAULT = "order",
  NAME = "name",
  PRICE = "price"
}

/**
 * The whole request state as one model — `filters` (nested column → operator →
 * value), `sort` (ordered, precedence = position) and `pagination`. This is the
 * instance validated against `useQuerySchema()`; the translator maps it to the
 * `QueryProps` the query layer accepts.
 *
 * `products_category_id.eq` holds the category and its descendants as an id
 * ARRAY — the translator comma-joins it, which is how this endpoint spells "in
 * any of these categories". The composable expands the tree; the model holds
 * the expansion, so what the wire carries is what the published model says.
 *
 * @graphify-citation `graphify query "module query model filter sort pagination
 * schema"` (2026-08-10) — no `ProductQueryModel` / `ProductQuerySchema` node anywhere in
 * `graphify-out/graph.json`. The query platform's `QueryProps` describes the
 * WIRE shape; this describes the schema-validated MODEL. No duplicate to
 * consume, so minting here is warranted.
 */
export type ProductQueryModel = {
  filters?: {
    products_category_id?: { eq?: string[] };
    name?: { like?: string };
  };
  sort?: QuerySortEntry[];
  pagination?: { limit?: number; offset?: number };
};

/**
 * The order the catalogue starts in — the merchant's own product order.
 * Declared as the query schema's `sort` default, so an emptied sort refills
 * itself on the next parse.
 */
export const PRODUCT_DEFAULT_SORT: QuerySortEntry[] = [
  { field: ProductSortableProperties.DEFAULT, dir: SortDirection.ASC }
];

/**
 * The collection's query schema. A `JsonSchema7`: the translator and the
 * validators walk it at runtime, so the type stays general rather than a
 * module-specific literal.
 */
export type ProductQuerySchema = JsonSchema7;
