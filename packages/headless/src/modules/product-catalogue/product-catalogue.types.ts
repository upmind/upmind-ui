import { SortDirection } from "../query/query.types";
import type { Product } from "../product";
import type { ListQuery, QuerySortEntry } from "../query/query.types";
import type { IProduct } from "@upmind-automation/types";
import type { MaybeRefOrGetter } from "vue";

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
    id?: string[];
    products_category_id?: { eq?: string[] };
    name?: { like?: string };
    "prices.billing_cycle_months"?: string;
    available_for_sales?: string;
    clients_can_order?: string;
    billing_cycle_months?: { neq?: string };
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

// -----------------------------------------------------------------------------
// SCOPE — the opt-in narrowing of one caller (FE-3206, R13)
// -----------------------------------------------------------------------------

/**
 * The opt-in `scope` of `useProductCatalogue`. Each member except `enabled` is
 * a RESOLVED plain value: the criteria compile one static schema, and each
 * forced filter is a `const` leaf that needs its value when that schema is
 * built. A caller builds the instance when every value is resolved and builds
 * it again when one changes. With no `scope` the composable is unchanged.
 *
 * - `ids` — only these product ids (`filter[id]`, a comma list)
 * - `billingCycleMonths` — only products priced on this term, 0 included
 * - `recurringOnly` — only products on a recurring term
 * - `orderable` — only products the brand sells that a client can order
 * - `currencyId`, `accountId` — the caller's own currency and account
 * - `countOnly` — ask for the count of matches, not a page of them
 * - `categories` — `false` skips the category tree
 * - `enabled` — gates the request
 *
 * A scope reads no basket: no basket id, no basket currency, no promotions.
 */
export type ProductCatalogueScope = {
  ids?: string[];
  billingCycleMonths?: number;
  recurringOnly?: boolean;
  orderable?: boolean;
  currencyId?: string;
  accountId?: string;
  countOnly?: boolean;
  categories?: boolean;
  enabled?: MaybeRefOrGetter<boolean>;
};

/**
 * The handle `countOnly` returns in place of a list: the envelope `total` on
 * `pagination`, no rows on `data`, and no page to move.
 */
export type ProductCountQuery = Pick<
  ListQuery<IProduct[], Product[], ProductQueryModel>,
  | "data"
  | "error"
  | "isFetching"
  | "isFetched"
  | "refetch"
  | "pagination"
  | "meta"
  | "criteria"
  | "schema"
  | "isFiltered"
  | "criteriaError"
  | "setCriteria"
  | "fetchNextPage"
  | "fetchPreviousPage"
>;
