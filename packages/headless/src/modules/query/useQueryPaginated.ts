// --- internal
import { useQuery } from "./useQuery";

// --- utils
import { get } from "lodash-es";
import { useUrl } from "../../utils";
import { PAGINATION, getQueryClient } from "./utils";

// --- types
import type {
  QueryParams,
  QueryResponse,
  PaginatedData,
  PaginatedParams,
} from "./types";

const queryClient = getQueryClient();

// -----------------------------------------------------------------------------

export const useQueryPaginated = () => {
  /**
   * Sends a paginated request to the server with the given URL and options.
   * Warning: The fetcher function expects a PaginatedResponse object as a response from the server.
   * @see {@link QueryResponse}
   * @name getPaginatedRequest
   * @async
   * @function
   *
   * @example getPaginatedRequest({
   *   url: useUrl("modules/web_hosting/domains/tlds"),
   *   queryKey: ["module", "hosting", "domain", "tlds"],
   *   withAccessToken: true,
   *   sort: [ApiSortDirection.DESC, "created_at"],
   *   pagination: { limit: 4 }, // defaults to 10
   *   filters: [
   *     url => {
   *       url.searchParams.set("filter[name|like]", "%com%");
   *       return url;
   *     },
   *   ],
   * });
   *
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param sort {ApiSortDirection} The sort options.
   * @param filters {IApiFilter} The filter options.
   * @param queryKey {string[]} The query key to use for the query.
   * @param pagination {IAPIPagination} The pagination options.
   * @param options Additional options to pass to TanStack query.
   * @returns A promise that resolves to the paginated data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function getPaginatedRequest<T extends object = object>({
    url,
    sort,
    queryKey,
    filters = [],
    pagination = {},
    ...options
  }: PaginatedParams & QueryParams<QueryResponse<T>>) {
    const { get: getRequest } = useQuery();

    let pageIndex = PAGINATION.pageIndex;
    let itemTotal = 0;

    async function paginatedFetch(
      paginatedParams: PaginatedParams & {
        mapPaginatedData?: (response?: QueryResponse<T>) => PaginatedData<T>;
      }
    ): Promise<QueryResponse<T>> {
      const { sort, filters, pagination, mapPaginatedData } = paginatedParams;

      url.searchParams.set(
        "limit",
        `${get(pagination, "limit", PAGINATION.pageSize)}`
      );
      url.searchParams.set(
        "offset",
        `${get(pagination, "offset", PAGINATION.offset)}`
      );
      if (sort) url.searchParams.set("sort", sort.join(""));
      if (filters) filters.reduce((_url, filter) => filter(_url), url);

      return getRequest<T>({
        ...options,
        url,
        mapPaginatedData,
        queryKey: [
          ...queryKey,
          {
            ...(sort ? { sort: sort.toString() } : {}),
            ...(filters && {
              filters: filters
                .reduce((_url, filter) => filter(_url), url)
                .searchParams.toString()
                .split("&"),
            }),
            pagination: {
              limit: pagination?.limit ?? PAGINATION.pageSize,
              offset: pagination?.offset ?? PAGINATION.offset,
            },
          },
        ],
      });
    }

    /**
     * Returns the current pagination settings.
     * @returns The current pagination settings.
     */
    function getPagination() {
      return {
        limit: get(pagination, "limit", PAGINATION.pageSize),
        offset: get(pagination, "offset", PAGINATION.offset),
      };
    }

    /**
     * Returns the total number of pages.
     * @returns {number} The total number of pages.
     */
    function pageTotal(): number {
      const pagination = getPagination();
      // Can only be 1 page if limit=0
      if (!pagination.limit) return 1;
      return Math.max(Math.ceil(itemTotal / pagination.limit), 1);
    }

    /**
     * Returns whether there is a previous page.
     * @returns {boolean} Whether there is a previous page.
     */
    function hasPrevPage(): boolean {
      return pageIndex > PAGINATION.pageIndex;
    }

    /**
     * Returns whether there is a next page.
     * @returns {boolean} Whether there is a next page.
     */
    function hasNextPage(): boolean {
      return pageIndex < pageTotal();
    }

    /**
     * Moves to the previous page.
     */
    async function prevPage(): Promise<QueryResponse<T>> {
      pageIndex = Math.max(pageIndex - 1, 1);
      const pagination = getPagination();

      return paginatedFetch({
        sort,
        filters,
        pagination: {
          ...pagination,
          offset: pagination.limit * (pageIndex - 1),
        },
      });
    }

    /**
     * Moves to the next page.
     */
    async function nextPage(): Promise<QueryResponse<T>> {
      // let's add a guard to prevent going over the total number of pages
      if (pageIndex < pageTotal()) pageIndex += 1;
      const pagination = getPagination();

      return paginatedFetch({
        sort,
        filters,
        pagination: {
          ...pagination,
          offset: pagination.limit * (pageIndex - 1),
        },
      });
    }

    /**
     * Maps the paginated data to a more user-friendly format.
     * @param response The data to map.
     */
    function mapPaginatedData(response?: QueryResponse<T>) {
      itemTotal = response?.total || 0;

      return {
        /** Returns the data for the current page. Warning: Might be undefined */
        data: response?.data ?? ([] as T),

        pagination: {
          current: pageIndex,
          total: itemTotal,
          pages: pageTotal(),
          limit: getPagination().limit,
          offset: getPagination().offset,
        },

        /** Returns the total number of pages. */
        hasNextPage: hasNextPage(),
        /** Returns the index of the first item on the current page. */
        hasPrevPage: hasPrevPage(),
        /** Moves to the next page. */
        nextPage,
        /** Moves to the previous page. */
        prevPage,
      };
    }

    return paginatedFetch({ sort, filters, pagination }).then(mapPaginatedData);
  }

  return {
    useUrl,
    // ---
    get: getPaginatedRequest,
    // ---
    queryClient,
  };
};
