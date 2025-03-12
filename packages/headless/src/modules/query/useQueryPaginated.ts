// --- utils
import { get } from "lodash-es";
import { useUrl } from "../../utils";
import { useQuery } from "./useQuery";
import { getQueryClient, PAGINATION } from "./utils";

// --- types
import {
  QueryParams,
  PaginatedData,
  PaginatedParams,
  PaginatedResponse,
} from "./types";

const queryClient = getQueryClient();

export const useQueryPaginated = () => {
  // --------------------------------------------------------
  // methods

  /**
   * Sends a paginated request to the server with the given URL and options.
   * Warning: The fetcher function expects a PaginatedResponse object as a response from the server.
   * @see {@link PaginatedResponse}
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
   * @returns {Promise<PaginatedData>} A promise that resolves to the paginated data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function getPaginatedRequest<T extends object = object>({
    url,
    sort,
    queryKey,
    filters = [],
    pagination = {},
    ...options
  }: PaginatedParams & QueryParams<PaginatedResponse<T>>): Promise<
    PaginatedData<T>
  > {
    const { get: getRequest } = useQuery();

    let pageIndex = PAGINATION.pageIndex;
    let itemTotal = 0;

    async function paginatedFetch({
      sort,
      filters,
      pagination,
    }: Pick<PaginatedParams, "sort" | "filters" | "pagination">) {
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

      return getRequest<PaginatedResponse<T>>({
        url,
        queryKey: [...queryKey, { sort, filters, pagination }],
        ...options,
      }).then(response => {
        itemTotal = response.total;
        return response.data;
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
     * Returns the index of the first item on the current page.
     * @returns {number} The index of the first item on the current page.
     */
    function itemFrom(): number {
      if (!itemTotal) return 0;
      return getPagination().limit * (pageIndex - 1) + 1;
    }

    /**
     * Returns the index of the last item on the current page.
     * @returns {number} The index of the last item on the current page.
     */
    function itemTo(): number {
      const pagination = getPagination();
      if (!pagination.limit) return itemTotal;
      return Math.min(pagination.limit * pageIndex, itemTotal);
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
    async function prevPage(): Promise<PaginatedData<T>> {
      pageIndex = Math.max(pageIndex - 1, 1);
      const pagination = getPagination();
      return paginatedFetch({
        sort,
        filters,
        pagination: {
          ...pagination,
          offset: pagination.limit * (pageIndex - 1),
        },
      }).then(mapPaginatedData);
    }

    /**
     * Moves to the next page.
     */
    async function nextPage(): Promise<PaginatedData<T>> {
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
      }).then(mapPaginatedData);
    }

    /**
     * Maps the paginated data to a more user-friendly format.
     * @param data The data to map.
     * @returns {PaginatedData} The mapped data.
     */
    function mapPaginatedData(data?: T): PaginatedData<T> {
      return {
        /** Returns the data for the current page. Warning: Might be undefined */
        data,
        /** Returns the index of the last item on the current page. */
        itemTo: itemTo(),
        /** Returns the index of the first item on the current page. */
        itemFrom: itemFrom(),
        /** Returns the total number of items. */
        itemTotal,
        /** Returns the current page size. */
        pageSize: getPagination().limit,
        /** Returns the current page index. */
        pageIndex,
        /** Returns the total number of pages. */
        pageTotal: pageTotal(),
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
