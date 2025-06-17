// --- external
import {
  useMutation,
  QueryClient,
  useQuery as vueUseQuery,
  useInfiniteQuery as vueUseInfiniteQuery,
} from "@tanstack/vue-query";
import { isArray, isFunction } from "xstate/lib/utils";
import { ref, unref, computed, MaybeRef } from "vue";

// --- internal
import { useLocale } from "../system";
import { doFetch, refreshToken } from "./services";

// --- utils
import { isPromise, useTime, useUrl } from "../../utils";
import { getTokenFromStorage } from "../session/utils";
import {
  get,
  set,
  unset,
  isString,
  isEmpty,
  isInteger,
  toNumber,
  isObject,
  forEach,
} from "lodash-es";
import {
  parseData,
  canRetryAuthorization,
  PAGINATION,
  cleanQueryKey,
} from "./utils";

// --- types
import {
  QueryParams,
  QueryResponse,
  RequestParams,
  MutationParams,
  InfiniteQueryPage,
  QueryResponseError,
} from "./types";
import { Methods } from "@upmind-automation/types";
import type { DefaultError } from "@tanstack/vue-query";

// -----------------------------------------------------------------------------

// NB we need to create our query client here so that it can be used in the `useQuery` hook.
// This will then be used in the `useUpmind` composable, which initializes the Upmind instance
// BEFORE vue has an injectable for the query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default time for inactive data to be garbage collected
      gcTime: useTime().MINUTE * 30,
      // Default cache time for data to be considered "fresh"
      staleTime: useTime().MINUTE * 5,
    },
  },
});

export const useQuery = () => {
  const { locale } = useLocale();

  /**
   * Sends a request with the given URL and options.
   * @see {@link RequestParams}
   * @name request
   * @async
   * @function
   *
   * @example
   *  request({ url: "/orders", withAccessToken: true }); // will use the access token from the session
   *  request({ url: "/orders", withAccessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..." });
   *
   * @param {RequestParams} params - The request parameters.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function request<T extends any = any>({
    url,
    sort,
    filters,
    pagination,
    // ---
    init,
    withAccessToken,
  }: RequestParams): Promise<QueryResponse<T>> {
    // safeguard
    init ??= {};
    let attempts = 0;

    // -- lets add our pagination, sorting, and filtering parameters
    // Set 'order' (sort) parameter
    if (!isEmpty(sort) && isArray(sort))
      url.searchParams.set("order", sort.join(""));

    // Set 'limit' parameter
    if (!isEmpty(pagination) && isInteger(pagination?.limit))
      url.searchParams.set("limit", `${pagination.limit}`);

    // Set 'offset' parameter
    if (!isEmpty(pagination) && isInteger(pagination?.offset))
      url.searchParams.set("offset", `${pagination.offset}`);

    // set the filters, if any
    if (!isEmpty(filters) && isObject(filters)) {
      forEach(filters, (value: any, key: string) => {
        if (!isEmpty(value)) {
          // if the value is an array, we need to set it as a comma-separated list
          if (isArray(value)) value = value.join(",");

          // if the value is an object, we need to stringify it
          if (isObject(value)) value = JSON.stringify(value);

          // if the value is a function, we need to call it with the current URL
          if (isFunction(value)) value = value(url);

          url.searchParams.set(key, value);
        }
      });
    }

    // set "lang" parameter
    if (!isEmpty(locale.value))
      url.searchParams.set("lang", locale.value as string);

    // Enforce Method (default to GET)
    set(init, "method", get(init, "method", Methods.GET).toUpperCase());

    // Enforce Content Type header
    if (init.body instanceof FormData) {
      // do not set a header content type
      unset(init, "headers.Content-Type");
    } else {
      set(init, "headers.Content-Type", "application/json");
    }

    // Enforce Authorization header, if required,
    // also allows us to pass a custom token, for e.g., 2fa
    if (withAccessToken) {
      const token = isString(withAccessToken)
        ? withAccessToken
        : getTokenFromStorage()?.access_token;
      set(init, `headers.Authorization`, `Bearer ${token}`);
    }

    // -------------------------------------------------------------------------

    return doFetch<T>({ url, init }).catch(async error => {
      const requestError = error as QueryResponseError;
      attempts++;

      // allow us to retry the request if we have a 401 error, but only once (we don't want an infinite loop)
      if (canRetryAuthorization(url, error, { attempts, max: 1 })) {
        return refreshToken().then(() => {
          // get the new access token and update the access token in the request
          set(
            init,
            `headers.Authorization`,
            `Bearer ${getTokenFromStorage()?.access_token}`
          ); // finally, retry the request
          return doFetch<T>({ url, init });
        });
      }
      return Promise.reject(requestError);
    });
  }

  // --- TanStack Query methods

  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   * @see {@link QueryParams}
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param guard A function that returns a promise to be resolved before the request is sent. This can be used to ensure that certain conditions are met before the request is sent, such as checking if the user is authenticated.
   * @param queryKey The query key to use for the request. This is used to cache the request and can be used to invalidate the cache later.
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param options Additional options to pass to TanStack query.
   */
  function query<TQueryFnData = unknown, TData = TQueryFnData>({
    queryKey,
    url,
    init,
    withAccessToken,
    guard,
    select,
    ...options
  }: QueryParams<TQueryFnData, TData>) {
    return vueUseQuery<TQueryFnData, DefaultError, TData>(
      {
        queryKey: cleanQueryKey([...queryKey]),
        queryFn: async ({ signal }) => {
          const hasGuard = isPromise(guard);
          const safeguard: Promise<void | boolean> = hasGuard
            ? guard()
            : Promise.resolve();
          return safeguard.then(() =>
            request<TQueryFnData>({
              url,
              init: {
                ...init,
                signal, // Pass the new signal to the request to allow cancellation
              },
              withAccessToken,
            }).then(response => {
              if (isFunction(select)) return select(response.data!) as TData;
              return response.data as TQueryFnData;
            })
          );
        },
        ...(options as any),
      },
      queryClient
    );
  }

  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   * This method is specifically designed for listing resources with pagination, sorting, and filtering capabilities.
   * @see {@link QueryParams}
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param guard A function that returns a promise to be resolved before the request is sent. This can be used to ensure that certain conditions are met before the request is sent, such as checking if the user is authenticated.
   * @param queryKey The query key to use for the request. This is used to cache the request and can be used to invalidate the cache later.
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param sort An array of strings representing the sorting order for the query. Each string should be in the format "field:direction", where "field" is the field to sort by and "direction" is either "asc" or "desc".
   * @param options Additional options to pass to TanStack query.
   */
  function list<TQueryFnData = unknown, TData = TQueryFnData>({
    url,
    init,
    queryKey,
    withAccessToken,
    guard,
    select,
    ...options
  }: QueryParams<TQueryFnData, TData>) {
    // --- state
    const limit = options?.pagination?.limit ?? PAGINATION.pageSize;
    const sort = ref(options?.sort);
    const total = ref(0);
    const pageTotal = computed(() => {
      if (!limit) return 1; // Can only be 1 page if limit=0
      return Math.max(Math.ceil(total.value / limit), 1);
    });
    const pageIndex = ref(
      options?.pagination?.offset
        ? Math.ceil(options?.pagination.offset / limit) + 1
        : 1
    );
    const filters = ref<QueryParams["filters"]>({
      ...(options?.filters ?? {}),
    });

    // --- query

    const response = vueUseQuery<TQueryFnData, DefaultError, TData>(
      {
        queryKey: cleanQueryKey([
          ...queryKey,
          { limit },
          { locale },
          { sort },
          { pageIndex },
          { filters },
        ]),
        queryFn: async ({ signal }) => {
          const hasGuard = isPromise(guard);
          const safeguard: Promise<void | boolean> = hasGuard
            ? guard()
            : Promise.resolve();
          return safeguard.then(() =>
            request<TQueryFnData>({
              url,
              sort: sort.value,
              filters: filters.value,
              pagination: { limit, offset: (pageIndex.value - 1) * limit },
              init: {
                ...init,
                signal, // Pass the new signal to the request to allow cancellation
              },
              withAccessToken,
            }).then(response => {
              total.value = response.total || 0; // Set the total items count
              if (isFunction(select)) return select(response.data!) as TData;
              return response.data as TQueryFnData;
            })
          );
        },
        ...(options as any),
      },
      queryClient
    );

    // -------------------------------------------------------------------------

    return {
      ...response,

      // ---state

      /**
       * Pagination information for the current query.
       * @type {Object}
       * @property {number} total - Total number of items in the query.
       * @property {number} limit - Number of items per page.
       * @property {number} page - Current page index.
       * @property {number} pages - Total number of pages.
       * @property {number} from - The starting item index for the current page.
       * @property {number} to - The ending item index for the current page.
       */
      pagination: computed(() => ({
        limit,
        total: total.value,
        page: pageIndex.value,
        pages: pageTotal.value,
        from: !total.value ? 0 : limit * (pageIndex.value - 1) + 1,
        to: !limit
          ? total.value
          : Math.min(limit * pageIndex.value, total.value),
      })),

      /**
       * Meta-information about the current query, such as whether there are next or previous pages.
       * @type {Object}
       * @property {boolean} hasNextPage - Whether there is a next page.
       * @property {boolean} hasPrevPage - Whether there is a previous page.
       */
      meta: computed(() => ({
        hasNextPage: pageIndex.value < pageTotal.value,
        hasPrevPage: pageIndex.value > 1,
      })),

      // --- methods

      /**
       * Function to go to the previous page in the query.
       * @function
       * @returns {void}
       * @throws {Error} Throws an error if there is no previous page.
       */
      fetchPrevPage: (): void => {
        if (!response.isPlaceholderData.value && pageIndex.value <= 1) {
          throw new Error("No previous page available");
        }
        pageIndex.value = Math.max(pageIndex.value - 1, 1);
      },

      /**
       * Function to go to the next page in the query.
       * @function
       * @returns {void}
       * @throws {Error} Throws an error if there is no next page.
       *
       */
      fetchNextPage: (): void => {
        if (
          !response.isPlaceholderData.value &&
          pageIndex.value >= pageTotal.value
        ) {
          throw new Error("No next page available");
        }
        if (!response.isPlaceholderData.value) {
          pageIndex.value = Math.min(pageIndex.value + 1, pageTotal.value);
        }
      },

      filter: (values: QueryParams["filters"]) => {
        // Ensure values is not a Ref, but a plain object
        // If values is a Ref, unwrap it; otherwise, use as is
        // @ts-ignore
        filters.value = unref(values) ?? {};
      },
    };
  }

  function listInfinite<TQueryFnData = unknown, TData = TQueryFnData>({
    url,
    init,
    queryKey,
    withAccessToken,
    guard,
    select,
    ...options
  }: QueryParams<TQueryFnData, TData>) {
    // --- state

    const limit = options?.pagination?.limit ?? PAGINATION.pageSize;
    const sort = ref(options?.sort);
    const total = ref(0);
    const pageTotal = computed(() => {
      if (!limit) return 1; // Can only be 1 page if limit=0
      return Math.max(Math.ceil(total.value / limit), 1);
    });
    const filters = ref<QueryParams["filters"]>({
      ...(options?.filters ?? {}),
    });

    // --- query

    const response = vueUseInfiniteQuery<TQueryFnData, DefaultError, TData>(
      {
        queryKey: cleanQueryKey([
          ...queryKey,
          { limit },
          { locale },
          { sort }, // Important for sorting to work
          { filters }, // Important for filters to work
        ]),
        queryFn: async ({ pageParam = 0, signal }) => {
          const offset = toNumber(pageParam);
          const hasGuard = isPromise(guard);
          const safeguard: Promise<void | boolean> = hasGuard
            ? guard()
            : Promise.resolve();
          return safeguard.then(() =>
            request<TQueryFnData>({
              url,
              sort: sort.value,
              filters: filters.value,
              pagination: { limit, offset },
              init: {
                ...init,
                signal, // Pass the new signal to the request to allow cancellation
              },
              withAccessToken,
            }).then(response => {
              total.value = response.total || 0; // Set the total items count

              const data = isFunction(select)
                ? select(response.data!)
                : response.data;

              return {
                nextOffset:
                  !limit || offset + limit >= total.value
                    ? undefined
                    : offset + limit,
                pageData: data,
              };
            })
          );
        },
        getNextPageParam: (lastPage: InfiniteQueryPage<TQueryFnData>) =>
          lastPage.nextOffset,
        ...(options as any),
      },
      queryClient
    );

    // -------------------------------------------------------------------------

    return {
      ...response,

      // ---state

      /**
       * Pagination information for the current query.
       * @type {Object}
       * @property {number} total - Total number of items in the query.
       * @property {number} limit - Number of items per page.
       * @property {number} page - Current page index.
       * @property {number} pages - Total number of pages.
       * @property {number} from - The starting item index for the current page.
       * @property {number} to - The ending item index for the current page.
       */
      pagination: computed(() => {
        // We use the length of the final, selected data array.
        // The `as any[]` is a safe type assertion here because we know
        // our `select` function returns an array.
        const itemsFetched = (response.data.value as any[])?.length ?? 0;

        // Calculate pages fetched based on items and limit
        const pagesFetched = limit > 0 ? Math.ceil(itemsFetched / limit) : 1;

        return {
          limit,
          total: total.value,
          page: pagesFetched,
          pages: pageTotal.value,
          from: 1, // For "load more", we always show from item 1
          to: itemsFetched, // The last item is simply the total number fetched
        };
      }),

      /**
       * Meta-information about the current query, such as whether there are next or previous pages.
       * @type {Object}
       * @property {boolean} hasNextPage - Whether there is a next page.
       * @property {boolean} hasPrevPage - Whether there is a previous page.
       */
      meta: computed(() => ({
        hasNextPage: response.hasNextPage.value,
        hasPrevPage: response.hasPreviousPage.value,
      })),

      filter: (values: QueryParams["filters"]) => {
        // Ensure values is not a Ref, but a plain object
        // If values is a Ref, unwrap it; otherwise, use as is
        // @ts-ignore
        filters.value = unref(values) ?? {};
      },
    };
  }

  /**
   * Syntax sugar for sending a POST request to the server with the given URL and options.
   * @see {@link MutationParams}
   * @param method The HTTP method to use for the request (e.g., POST, PUT, PATCH, DELETE).
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param options Additional options to pass to TanStack mutation.
   */
  function mutate<
    TData = unknown,
    TError = DefaultError,
    TVariables = void,
    TContext = unknown,
  >(
    method: Omit<Methods, "GET" | "HEAD">,
    {
      url,
      init,
      data,
      withAccessToken,
      ...options
    }: MutationParams<QueryResponse<TData>, TError, TVariables, TContext>
  ) {
    // safeguard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", method.toUpperCase());
    set(init, "body", parseData(data));

    return useMutation(
      {
        mutationFn: async () => request<TData>({ url, init, withAccessToken }),
        ...options,
      },
      queryClient
    );
  }

  // --- Async methods
  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   * @see {@link QueryParams}
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param queryKey The query key to use for the request. This is used to cache the request and can be used to invalidate the cache later.
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param options Additional options to pass to TanStack query.
   */
  async function getRequest<TQueryFnData = unknown, TData = TQueryFnData>({
    url,
    init,
    queryKey,
    withAccessToken,
    guard,
    select,
    ...options
  }: QueryParams<TQueryFnData, TData>): Promise<TData> {
    // Remove initialData from options before spreading, as it's not part of FetchQueryOptions

    // --- state
    const limit = options?.pagination?.limit ?? 0;
    const sort = options?.sort;
    const filters = options?.filters;

    const pageIndex = options?.pagination?.offset
      ? Math.ceil(options?.pagination.offset / limit) + 1
      : undefined;

    return queryClient.fetchQuery<TQueryFnData, DefaultError, TData>({
      queryKey: cleanQueryKey([
        ...queryKey,
        { limit },
        { locale },
        { sort },
        { pageIndex },
        { filters },
      ]),
      queryFn: async ({ signal }) => {
        return request<TQueryFnData>({
          url,
          sort,
          filters,
          pagination: { limit, offset: (pageIndex ?? 0) * limit },
          init: {
            ...init,
            signal, // Pass the new signal to the request to allow cancellation
          },
          withAccessToken,
        }).then(response => {
          if (isFunction(select)) return select(response.data!) as TData;
          return response.data as TQueryFnData;
        });
      },
      ...(options as any),
    });
  }

  /**
   * Syntax sugar for sending a POST request to the server with the given URL and options.
   * @see {@link RequestParams}
   * @name postRequest
   * @async
   * @function
   *
   * @example postRequest({ url: "/orders", withAccessToken: true });
   *
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. Can be a string or a boolean.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function postRequest<T = object>({
    url,
    init,
    data,
    withAccessToken,
  }: RequestParams): Promise<T> {
    // safeguard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", Methods.POST.toUpperCase());
    set(init, "body", parseData(data));

    return request<T>({ url, init, withAccessToken }).then(
      response => (response?.data || response) as T
    );
  }

  /**
   * Syntax sugar for sending a PUT request to the server with the given URL and options.
   * @see {@link RequestParams}
   * @name putRequest
   * @async
   * @function
   *
   * @example putRequest({ url: "/orders", withAccessToken: true });
   *
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. Can be a string or a boolean.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function putRequest<T = object>({
    url,
    init,
    data,
    withAccessToken,
  }: RequestParams): Promise<T> {
    // safeguard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", Methods.PUT.toUpperCase());
    set(init, "body", JSON.stringify(data));

    return request<T>({ url, init, withAccessToken }).then(
      response => (response?.data || response) as T
    );
  }

  /**
   * Syntax sugar for sending a PATCH request to the server with the given URL and options.
   * @see {@link RequestParams}
   * @name patchRequest
   * @async
   * @function
   *
   * @example patchRequest({ url: "/orders", withAccessToken: true });
   *
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. Can be a string or a boolean.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function patchRequest<T = object>({
    url,
    init,
    data,
    withAccessToken,
  }: RequestParams): Promise<T> {
    // safeguard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", Methods.PATCH.toUpperCase());
    set(init, "body", JSON.stringify(data));

    return request<T>({ url, init, withAccessToken }).then(
      response => (response?.data || response) as T
    );
  }

  /**
   * Syntax sugar for sending a DELETE request to the server with the given URL and options.
   * @see {@link RequestParams}
   * @name deleteRequest
   * @async
   * @function
   *
   * @example deleteRequest({ url: "/orders", withAccessToken: true });
   *
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. Can be a string or a boolean.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function deleteRequest<T = object>({
    url,
    init,
    data,
    withAccessToken,
  }: RequestParams): Promise<T> {
    // safeguard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", Methods.DELETE.toUpperCase());
    set(init, "body", JSON.stringify(data));

    return request<T>({ url, init, withAccessToken }).then(
      response => (response?.data || response) as T
    );
  }

  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   * @see {@link RequestParams}
   * @name headRequest
   * @async
   * @function
   *
   * @example headRequest({ url: "/orders", withAccessToken: true });
   *
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param withAccessToken The access token to use for the request. Can be a string or a boolean.
   * @param options Additional options to pass to TanStack query.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function headRequest<T = object>({
    url,
    init,
    withAccessToken,
  }: RequestParams): Promise<QueryResponse<T>> {
    // safeguard
    init ??= {};

    // Enforce method and header
    set(init, "method", Methods.GET.toUpperCase());
    set(init, "mode", "no-cors");

    return request<T>({ url, init, withAccessToken });
  }

  // ---------------------------------------------------------------------------

  return {
    // --- context
    queryClient,
    // --- utils
    useUrl,
    // --- tanstack query methods
    query,
    list,
    listInfinite,
    mutate,
    // --- async methods
    get: getRequest,
    del: deleteRequest,
    put: putRequest,
    post: postRequest,
    head: headRequest,
    patch: patchRequest,
  };
};
