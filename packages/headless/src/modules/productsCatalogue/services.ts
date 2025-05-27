// --- internal
import { useQuery } from "../query";
import { useSession } from "../session";

// --- types
import type { QueryKey } from "@tanstack/query-core";
import type { IProduct } from "@upmind-automation/types";
import type { QueryResponse } from "../query";
import type { LoadProductsParams } from "./types";

const queryKey: QueryKey = ["products", "catalogue"];

// -----------------------------------------------------------------------------
// QUERIES

/**
 * Loads products based on the specified parameters, including pagination and search queries.
 *
 * @param {Object} params - The parameters for loading products.
 * @param {number} [params.limit=12] - The number of products to load per page.
 * @param {string} [params.search=""] - The search query string for filtering products.
 * @param {number} [params.pageParam=0] - The current page index for pagination.
 * @return {Promise<QueryResponse<IProduct[]>>} A promise that resolves to the query response containing the product data.
 */
async function loadProducts({
  limit = 12,
  search = "",
  pageParam = 0,
}: LoadProductsParams): Promise<QueryResponse<IProduct[]>> {
  const { get, useUrl } = useQuery();
  const { isAuthenticated } = useSession();

  await isAuthenticated().catch(error => Promise.reject(error));

  const offset = pageParam * limit;

  /**
   * @example
   * brand_id=47d73824-8507-9315-e54f-81e642d59e06
   * currency_id=e47d7382-4850-7931-56c8-1e642d59e063
   * promotions=
   * ✅limit=12
   * order=order
   * ✅offset=0
   * ✅search=".com"
   * with=image,prices,attributes,options,options.prices,related
   * filter[products_category_id]=8d632507-9806-5d1e-37ef-8174e234e98d
   * lang=en
   */
  return get<IProduct[]>({
    url: useUrl("basket/products", {
      limit,
      offset,
      search,
      with: "image,prices,attributes,options,options.prices,related",
    }),
    queryKey: [...queryKey, { page: pageParam + 1, search }],
    withAccessToken: true,
  });
}

export default {
  queryKey,
  loadProducts,
};
