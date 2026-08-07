import {
  useMutation,
  useQuery as vueUseQuery,
  useInfiniteQuery as vueUseInfiniteQuery
} from "@tanstack/vue-query";
import { ref, unref, computed, watch } from "vue";
import { effectScope, getCurrentScope, type Ref } from "vue";
import { isArray, isFunction } from "xstate/lib/utils";
import { Methods } from "@upmind-automation/types";
import { useBasket, useBasketCurrency } from "../basket";
import { useActiveSession } from "../session-store";
import { getTokenFromStorage } from "../session-store";
import { useI18n, useLocale } from "../system-localisation";
import { queryClient } from "./client";
import { doFetch, refreshToken } from "./query.services";
import {
  parseData,
  PAGINATION,
  cleanQueryKey,
  canRetryAuthorization
} from "./query.utils";
import { useQueryCriteria } from "./useQueryCriteria";
import {
  useUrl,
  isPromise,
  ErrorOrigin,
  DetailedError,
  responseCodes
} from "../../utils";
import {
  forEach,
  get,
  has,
  isEmpty,
  isEqual,
  isInteger,
  isObject,
  isString,
  map,
  set,
  toNumber,
  unset
} from "lodash-es";
import type {
  QueryParams,
  QueryProps,
  QueryResponse,
  RequestParams,
  MutationParams,
  InfiniteQueryPage,
  ReactiveQueryKeys,
  PaginationInfo,
  CriteriaInput,
  RawCriteria,
  SchemaCriteria,
  WithCriteria,
  ListQuery,
  SimpleQuery,
  InfiniteListQuery,
  MutationResult
} from "./query.types";
import type { DefaultError, MutationKey, QueryKey } from "@tanstack/vue-query";

// -----------------------------------------------------------------------------

// This will then be used in the `useUpmind` composable, which initializes the Upmind instance
// BEFORE vue has an injectable for the query client

/**
 * A composable function that provides utilities for making HTTP requests
 * with advanced functionalities like pagination, sorting, filtering, currency handling,
 * and caching using TanStack Query. It provides methods for sending requests and handling
 * responses in a reactive way.
 */
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
   *  request({ url: "/orders", withAccessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..." }); // will use the provided access token
   *
   * @param {RequestParams} params - The request parameters.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function request<T = any>({
    url,
    sort,
    filters,
    pagination,
    withCurrency,
    withBasket,
    withoutLocale,
    // ---
    init,
    withAccessToken
  }: RequestParams): Promise<QueryResponse<T>> {
    // safeguard
    init ??= {};
    let attempts = 0;

    // Enforce Method (default to GET)
    set(init, "method", get(init, "method", Methods.GET).toUpperCase());

    // NB only add the url params for GET requests
    if (init.method === Methods.GET.toUpperCase()) {
      // -- lets add our pagination, sorting, and filtering parameters
      // Set 'order' (sort) parameter
      if (!isEmpty(sort) && isArray(sort)) {
        // Multi-sort: [["-", "default"], ["", "id"]] → "-default,id"
        // Single sort: ["-", "default"] → "-default"
        const isMultiSort = isArray(sort[0]);
        const order = isMultiSort
          ? map(sort as string[][], s => s.join("")).join(",")
          : (sort as string[]).join("");
        url.searchParams.set("order", order);
      } else url.searchParams.delete("order");

      // Set 'limit' parameter
      if (has(pagination, "limit")) {
        if (pagination.limit == "count") {
          url.searchParams.set("limit", pagination.limit);
        } else {
          url.searchParams.set("limit", `${pagination.limit}`);
        }
      }
      // NB NEVER remove limits from the url as we may include limit=0

      // Set 'offset' parameter
      if (has(pagination, "offset") && isInteger(pagination?.offset))
        url.searchParams.set("offset", `${pagination.offset}`);
      else url.searchParams.delete("offset");

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
          } else {
            url.searchParams.delete(key);
          }
        });
      }

      // set "lang" parameter
      if (!withoutLocale && !isEmpty(locale.value)) {
        url.searchParams.set("lang", locale.value as string);
      }

      // set "currency" parameter
      if (withCurrency) {
        const { currencyCode } = useBasketCurrency();
        if (!isEmpty(currencyCode?.value))
          url.searchParams.set("currency_code", currencyCode.value as string);
      }

      if (withBasket) {
        const { basketId } = useBasket();
        if (!isEmpty(basketId?.value))
          url.searchParams.set("basket_id", basketId.value as string);
      }
    }

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
        : await useActiveSession()
            .useActions()
            .isReady()
            .then(
              () => useActiveSession().useContext().session.value?.access_token
            );
      if (token) set(init, `headers.Authorization`, `Bearer ${token}`);
    }

    // -------------------------------------------------------------------------

    return doFetch<T>({ url, init }).catch(async error => {
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

      // let the original error propagate
      throw error;
    });
  }

  // --- TanStack Query methods

  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   * NOTE: this does not deal with pagination, it is a simple GET request.
   * @see {@link QueryParams}
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param guard A function that returns a promise to be resolved before the request is sent. This can be used to ensure that certain conditions are met before the request is sent, such as checking if the user is authenticated.
   * @param select A function that is used to transform the response data before it is returned. This can be used to extract specific fields from the response or to transform the data into a different format.
   * @param queryKey The query key to use for the request. This is used to cache the request and can be used to invalidate the cache later.
   * @param withCurrency Whether to automagically add the currency filter to the request based on the `useBasketCurrency` composable.
   * @param withBasket Whether to automagically add the basket ID to the request based on the `useBasket` composable.
   * @param withoutLocale Whether to exclude the locale from the request.
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param criteria The collection's declared query schema (and optional starting model). Mutually exclusive with `sort`/`filters` — declaring both is a compile error. `query()` has no pagination, so the criteria's `pagination` branch is not read here.
   * @param options Additional options to pass to TanStack query.
   */
  function query<TQueryFnData = unknown, TData = TQueryFnData>(
    params: Omit<QueryParams<TQueryFnData, TData>, "pagination"> &
      RawCriteria<"sort" | "filters">
  ): SimpleQuery<TQueryFnData, TData>;
  function query<
    TQueryFnData = unknown,
    TData = TQueryFnData,
    TModel extends Record<string, unknown> = Record<string, unknown>
  >(
    params: Omit<QueryParams<TQueryFnData, TData>, "pagination"> &
      SchemaCriteria<TModel, "sort" | "filters">
  ): WithCriteria<SimpleQuery<TQueryFnData, TData>, TModel>;
  function query<
    TQueryFnData = unknown,
    TData = TQueryFnData,
    TModel extends Record<string, unknown> = Record<string, unknown>
  >({
    url,
    init,
    guard,
    select,
    queryKey,
    withCurrency,
    withBasket,
    withoutLocale,
    withAccessToken,
    criteria: declaration,
    ...options
  }: Omit<QueryParams<TQueryFnData, TData>, "pagination"> &
    CriteriaInput<TModel, "sort" | "filters">):
    | SimpleQuery<TQueryFnData, TData>
    | WithCriteria<SimpleQuery<TQueryFnData, TData>, TModel> {
    // ensure we have a scope, in case we call this outside of a setup function
    // Check if current scope is active - stopped scopes cause scope.run() to return undefined
    const currentScope = getCurrentScope();
    const scope = currentScope?.active ? currentScope : effectScope(true);

    // The criteria is constructed here, never handed in: a module declares a
    // schema and passes it, so it cannot wire the pipeline wrongly.
    const criteria = declaration
      ? useQueryCriteria<TModel>(declaration)
      : undefined;

    // --- state

    // ONE source for the request branches: the criteria owns them when declared
    // and the caller spells them raw when it is not — never both.
    const props = computed<QueryProps>(() =>
      criteria
        ? criteria.props.value
        : { sort: options?.sort, filters: options?.filters }
    );

    const filters = ref<QueryParams["filters"]>({
      ...(props.value.filters ?? {})
    });

    const sort = ref(props.value.sort);

    if (criteria)
      watch(props, next => {
        if (!isEqual(unref(sort), next.sort)) sort.value = next.sort;
        if (!isEqual(unref(filters), next.filters))
          filters.value = next.filters;
      });

    // --- query
    const reactiveKeys: ReactiveQueryKeys = { sort, filters };

    if (!withoutLocale && locale.value) reactiveKeys.locale = locale;

    if (withCurrency) {
      const { currencyCode } = useBasketCurrency();
      reactiveKeys.currencyCode = currencyCode;
    }

    if (withBasket) {
      const { basketId } = useBasket();
      reactiveKeys.basketId = basketId;
    }

    const response = scope.run(() =>
      vueUseQuery<TQueryFnData, DefaultError, TData>(
        {
          queryKey: [...queryKey, reactiveKeys],
          queryFn: async ({ signal }) => {
            const hasGuard = isPromise(guard);
            const safeguard: Promise<void | boolean> = hasGuard
              ? guard()
              : Promise.resolve();

            return safeguard.then(() => {
              return request<TQueryFnData>({
                url,
                sort: sort.value,
                filters: filters.value,
                withCurrency,
                withBasket,
                withoutLocale,
                init: {
                  ...init,
                  signal // Pass the new signal to the request to allow cancellation
                },
                withAccessToken
              }).then(response => {
                if (isFunction(select)) return select(response.data!) as TData;
                return response.data as TQueryFnData;
              });
            });
          },
          ...(options as any)
        },
        queryClient
      )
    );

    const handle = {
      ...response,
      data: computed((): TData => response?.data?.value ?? ([] as TData)),
      resetQuery: () => {
        return queryClient.resetQueries({ queryKey });
      }
    };

    // ONE write path: the criteria owns the request state when declared, and
    // the raw setters are the whole surface when it is not.
    if (criteria)
      return {
        ...handle,
        criteria: criteria.model,
        schema: criteria.schema,
        isFiltered: criteria.isFiltered,
        criteriaError: criteria.error,
        setCriteria: criteria.set
      } as WithCriteria<SimpleQuery<TQueryFnData, TData>, TModel>;

    return {
      ...handle,
      sort: (values?: QueryParams["sort"]) => {
        sort.value = unref(values);
      },
      filter: (values: QueryParams["filters"]) => {
        filters.value = unref(values);
      }
    } as SimpleQuery<TQueryFnData, TData>;
  }

  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   * This method is specifically designed for listing resources with pagination, sorting, and filtering capabilities.
   *
   * @see {@link QueryParams}
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param sort An array of strings representing the sorting order for the query. Each string should be in the format "field:direction", where "field" is the field to sort by and "direction" is either "asc" or "desc".
   * @param guard A function that returns a promise to be resolved before the request is sent. This can be used to ensure that certain conditions are met before the request is sent, such as checking if the user is authenticated.
   * @param queryKey The query key to use for the request. This is used to cache the request and can be used to invalidate the cache later.
   * @param withCurrency Whether to automagically add the currency filter to the request based on the `useBasketCurrency` composable.
   * @param withBasket Whether to automagically add the basket ID to the request based on the `useBasket` composable.
   * @param withoutLocale Whether to exclude the locale from the request.
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param criteria The collection's declared query schema (and optional starting model). Mutually exclusive with `sort`/`filters`/`pagination` — declaring both is a compile error. In criteria mode the handle publishes `criteria`/`schema`/`isFiltered`/`criteriaError`/`setCriteria` and does NOT expose `sort()`/`filter()`.
   * @param options Additional options to pass to TanStack query.
   */
  function list<TQueryFnData = unknown, TData = TQueryFnData>(
    params: QueryParams<TQueryFnData, TData> & RawCriteria
  ): ListQuery<TQueryFnData, TData>;
  function list<
    TQueryFnData = unknown,
    TData = TQueryFnData,
    TModel extends Record<string, unknown> = Record<string, unknown>
  >(
    params: QueryParams<TQueryFnData, TData> & SchemaCriteria<TModel>
  ): WithCriteria<ListQuery<TQueryFnData, TData>, TModel>;
  function list<
    TQueryFnData = unknown,
    TData = TQueryFnData,
    TModel extends Record<string, unknown> = Record<string, unknown>
  >({
    url,
    init,
    guard,
    select,
    queryKey,
    withCurrency,
    withBasket,
    withoutLocale,
    withAccessToken,
    withSplitCount,
    criteria: declaration,
    ...options
  }: QueryParams<TQueryFnData, TData> & CriteriaInput<TModel>):
    | ListQuery<TQueryFnData, TData>
    | WithCriteria<ListQuery<TQueryFnData, TData>, TModel> {
    // ensure we have a scope, in case we call this outside of a setup function
    // Check if current scope is active - stopped scopes cause scope.run() to return undefined
    const currentScope = getCurrentScope();
    const scope = currentScope?.active ? currentScope : effectScope(true);

    const { currencyCode } = useBasketCurrency();
    const { basketId } = useBasket();

    // The criteria is constructed here, never handed in: a module declares a
    // schema and passes it, so it cannot wire the pipeline wrongly.
    const criteria = declaration
      ? useQueryCriteria<TModel>(declaration)
      : undefined;

    // --- state

    // ONE source for the three request branches: the criteria owns them when
    // declared and the caller spells them raw when it is not — never both.
    const props = computed<QueryProps>(() =>
      criteria
        ? criteria.props.value
        : {
            sort: options?.sort,
            filters: options?.filters,
            pagination: options?.pagination
          }
    );

    // Reactive, not captured at mint: a live page-size change re-keys the query
    // and reaches the wire, which is what finally gives `paginate` a sink.
    const limit = computed(
      () => props.value.pagination?.limit ?? PAGINATION.limit
    );
    const offset = computed(
      () => props.value.pagination?.offset ?? PAGINATION.offset
    );
    const total = ref(0);
    const sort = ref(props.value.sort);
    const pageIndex = ref(
      !offset.value ? 1 : Math.ceil(offset.value / limit.value) + 1
    );
    const filters = ref<QueryParams["filters"]>({
      ...(props.value.filters ?? {})
    });
    // --- query
    // NB the limit/pageIndex keys attach UNCONDITIONALLY: a `if (limit)` guard
    // is evaluated once on the initial value, so a `limit: 0` list would never
    // carry them and a later 0 → 10 would not re-key the query.
    const reactiveKeys: ReactiveQueryKeys = { sort, filters, limit, pageIndex };
    if (!withoutLocale && locale.value) reactiveKeys.locale = locale;
    if (withCurrency) reactiveKeys.currencyCode = currencyCode;
    if (withBasket) reactiveKeys.basketId = basketId;

    // This s used to persist paginatin and filter/sort on first load, so that if the user refreshes the page, we don't reset the pagination and filters to the default values. We only want to reset them if the user changes the sort or filter values.
    const isInitialCall = ref(true);

    /**
     * The ONE guarded write into a request branch: the `isEqual` early return so
     * an unchanged branch is inert, then the page reset and cache reset a real
     * change owes. Shared by the raw setters and the criteria watcher, so both
     * modes keep identical pagination-reset semantics.
     */
    function applyBranch<T>(target: Ref<T>, next: T): void {
      if (isEqual(unref(target), next)) return;
      target.value = next;
      if (isInitialCall.value) return;
      pageIndex.value = 1;
      queryClient.resetQueries({ queryKey });
    }

    if (criteria)
      watch(props, next => {
        applyBranch(sort, next.sort);
        applyBranch(filters, next.filters);

        // `limit`/`offset` are computed straight off `props`, so a pagination
        // change needs no assignment — only the page it lands on, seeded by the
        // same arithmetic as the initial `pageIndex`.
        const page = !offset.value
          ? 1
          : Math.ceil(offset.value / limit.value) + 1;
        if (pageIndex.value === page) return;
        pageIndex.value = page;
        if (!isInitialCall.value) queryClient.resetQueries({ queryKey });
      });

    const response = scope.run(() =>
      vueUseQuery<TQueryFnData, DefaultError, QueryResponse<TData>>(
        {
          queryKey: [...queryKey, reactiveKeys],
          queryFn: async ({ signal }) => {
            const hasGuard = isPromise(guard);
            const safeguard: Promise<void | boolean> = hasGuard
              ? guard()
              : Promise.resolve();
            return safeguard.then(async () => {
              // define our request parameters for easy reuse
              if (withSplitCount) url.searchParams.set("skip_count", "1");

              const params = {
                url,
                sort: sort.value,
                filters: filters.value,
                pagination: {
                  limit: limit.value,
                  offset: (pageIndex.value - 1) * limit.value
                },
                withCurrency,
                withBasket,
                withoutLocale,
                init: {
                  ...init,
                  signal // Pass the new signal to the request to allow cancellation
                },
                withAccessToken
              };

              return (
                request<TQueryFnData>(params)
                  // NB: we need to ensure that if we are given an offset that is greater than the total number of pages, we adjust it accordingly
                  .then(response => {
                    const pageOffset = (pageIndex.value - 1) * limit.value;
                    if (response.total && pageOffset >= response.total) {
                      // modify the params and re-request with the new offset
                      // Calculate the correct offset for the last page so it doesn't exceed the total
                      const safeOffset = Math.max(
                        0,
                        response.total -
                          (response.total % limit.value || limit.value)
                      );
                      params.pagination.offset = safeOffset;
                      pageIndex.value = Math.ceil(safeOffset / limit.value) + 1;
                      return request<TQueryFnData>(params);
                    }
                    return response;
                  })
                  // NB: we need to ensure that we parse the data correctly prior to applying the select function
                  //     this ensures the cache stores the parsed data and not the raw data
                  .then(response => {
                    if (isFunction(select)) {
                      return {
                        ...response,
                        data: select(response.data!)
                      };
                    }
                    return response;
                  })
                  .finally(() => {
                    isInitialCall.value = false;
                  })
              );
            });
          },

          ...(options as any)
        },
        queryClient
      )
    );

    if (withSplitCount)
      countRequest({
        queryKey,
        url,
        sort: sort.value,
        filters: filters.value,
        withCurrency,
        withoutLocale,
        init: {
          ...init
        },
        withAccessToken
      }).then(count => {
        total.value = count as number;
      });

    // -------------------------------------------------------------------------

    const handle = {
      ...response,

      data: computed((): TData => response?.data?.value?.data ?? ([] as TData)),

      total: computed(
        (): number => total.value ?? response?.data?.value?.total ?? 0
      ),

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
      pagination: computed((): PaginationInfo => {
        total.value = response?.data?.value?.total ?? total.value;
        const pageTotal = !limit.value
          ? 1
          : Math.max(Math.ceil(total.value / limit.value), 1);
        return {
          limit: limit.value,
          total: total.value,
          page: pageIndex.value,
          pages: pageTotal,
          from: !total.value ? 0 : limit.value * (pageIndex.value - 1) + 1,
          to: !limit.value
            ? total.value
            : Math.min(limit.value * pageIndex.value, total.value)
        } as PaginationInfo;
      }),

      /**
       * Meta-information about the current query, such as whether there are next or previous pages.
       * @type {Object}
       * @property {boolean} hasNextPage - Whether there is a next page.
       * @property {boolean} hasPrevPage - Whether there is a previous page.
       * @property {boolean} hasPages - Whether there is more than one page of results.
       */
      meta: computed(() => {
        total.value = response?.data?.value?.total ?? total.value;
        const pageTotal = !limit.value
          ? 1
          : Math.max(Math.ceil(total.value / limit.value), 1);
        return {
          hasNextPage: pageIndex.value < pageTotal,
          hasPrevPage: pageIndex.value > 1,
          hasPages: pageTotal > 1
        };
      }),

      // --- methods

      /**
       * Function to go to the previous page in the query.
       * @function
       * @returns {void}
       * @throws {Error} Throws an error if there is no previous page.
       */
      fetchPreviousPage: (): void => {
        const { t } = useI18n();
        total.value = response?.data?.value?.total ?? total.value;
        const pageTotal = !limit.value
          ? 1
          : Math.max(Math.ceil(total.value / limit.value), 1);

        if (!response?.isPlaceholderData.value && pageIndex.value <= 1) {
          throw new DetailedError(
            t("text.page_previous_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            {
              limit: limit.value,
              page: pageIndex.value,
              from: !total.value ? 0 : limit.value * (pageIndex.value - 1) + 1,
              total: total.value,
              pages: pageTotal,
              to: !limit.value
                ? total.value
                : Math.min(limit.value * pageIndex.value, total.value)
            }
          );
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
        const { t } = useI18n();

        total.value = response?.data?.value?.total ?? 0;
        const pageTotal = !limit.value
          ? 1
          : Math.max(Math.ceil(total.value / limit.value), 1);
        if (
          !response?.isPlaceholderData.value &&
          pageIndex.value >= pageTotal
        ) {
          throw new DetailedError(
            t("text.page_next_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            {
              limit: limit.value,
              page: pageIndex.value,
              from: !total.value ? 0 : limit.value * (pageIndex.value - 1) + 1,
              total: total.value,
              pages: pageTotal,
              to: !limit.value
                ? total.value
                : Math.min(limit.value * pageIndex.value, total.value)
            }
          );
        }
        if (!response?.isPlaceholderData.value) {
          pageIndex.value = Math.min(pageIndex.value + 1, pageTotal);
        }
      },

      resetQuery: () => {
        pageIndex.value = 1;
        return queryClient.resetQueries({ queryKey });
      }
    };

    // ONE write path: the criteria owns the request state when declared, and
    // the raw setters are the whole surface when it is not.
    if (criteria)
      return {
        ...handle,
        criteria: criteria.model,
        schema: criteria.schema,
        isFiltered: criteria.isFiltered,
        criteriaError: criteria.error,
        setCriteria: criteria.set
      } as WithCriteria<ListQuery<TQueryFnData, TData>, TModel>;

    return {
      ...handle,

      sort: (values?: QueryParams["sort"]) => applyBranch(sort, unref(values)),

      filter: (values: QueryParams["filters"]) =>
        applyBranch(filters, unref(values))
    } as ListQuery<TQueryFnData, TData>;
  }

  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   * This method is specifically designed for listing resources with infinite scrolling capabilities.
   *
   * @see {@link QueryParams}
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param sort An array of strings representing the sorting order for the query. Each string should be in the format "field:direction", where "field" is the field to sort by and "direction" is either "asc" or "desc".
   * @param guard A function that returns a promise to be resolved before the request is sent. This can be used to ensure that certain conditions are met before the request is sent, such as checking if the user is authenticated.
   * @param queryKey The query key to use for the request. This is used to cache the request and can be used to invalidate the cache later.
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param criteria The collection's declared query schema (and optional starting model). Mutually exclusive with `sort`/`filters`/`pagination` — declaring both is a compile error. The criteria's `pagination` reaches this entry point as the page SIZE only; the cursor stays the infinite query's own, exactly as a raw caller's `pagination` does.
   * @param options Additional options to pass to TanStack query.
   */
  function listInfinite<TQueryFnData = unknown, TData = TQueryFnData>(
    params: QueryParams<TQueryFnData, TData> & RawCriteria
  ): InfiniteListQuery<TQueryFnData, TData>;
  function listInfinite<
    TQueryFnData = unknown,
    TData = TQueryFnData,
    TModel extends Record<string, unknown> = Record<string, unknown>
  >(
    params: QueryParams<TQueryFnData, TData> & SchemaCriteria<TModel>
  ): WithCriteria<InfiniteListQuery<TQueryFnData, TData>, TModel>;
  function listInfinite<
    TQueryFnData = unknown,
    TData = TQueryFnData,
    TModel extends Record<string, unknown> = Record<string, unknown>
  >({
    url,
    init,
    guard,
    select,
    queryKey,
    withCurrency,
    withBasket,
    withoutLocale,
    withAccessToken,
    withSplitCount,
    criteria: declaration,
    ...options
  }: QueryParams<TQueryFnData, TData> & CriteriaInput<TModel>):
    | InfiniteListQuery<TQueryFnData, TData>
    | WithCriteria<InfiniteListQuery<TQueryFnData, TData>, TModel> {
    // ensure we have a scope, in case we call this outside of a setup function
    // Check if current scope is active - stopped scopes cause scope.run() to return undefined
    const currentScope = getCurrentScope();
    const scope = currentScope?.active ? currentScope : effectScope(true);

    const { currencyCode } = useBasketCurrency();
    const { basketId } = useBasket();

    // The criteria is constructed here, never handed in: a module declares a
    // schema and passes it, so it cannot wire the pipeline wrongly.
    const criteria = declaration
      ? useQueryCriteria<TModel>(declaration)
      : undefined;

    // --- state

    // ONE source for the request branches: the criteria owns them when declared
    // and the caller spells them raw when it is not — never both.
    const props = computed<QueryProps>(() =>
      criteria
        ? criteria.props.value
        : {
            sort: options?.sort,
            filters: options?.filters,
            pagination: options?.pagination
          }
    );

    // Reactive, not captured at mint: a live page-size change re-keys the query
    // and reaches the wire.
    const limit = computed(
      () => props.value.pagination?.limit ?? PAGINATION.limit
    );
    const sort = ref(props.value.sort);
    const total = ref(0);
    const pageTotal = computed(() => {
      if (!limit.value) return 1; // Can only be 1 page if limit=0
      return Math.max(Math.ceil(total.value / limit.value), 1);
    });
    const filters = ref<QueryParams["filters"]>({
      ...(props.value.filters ?? {})
    });

    // This s used to persist paginatin and filter/sort on first load, so that if the user refreshes the page, we don't reset the pagination and filters to the default values. We only want to reset them if the user changes the sort or filter values.
    const isInitialCall = ref(true);

    // --- query
    // NB the limit key attaches UNCONDITIONALLY: a `if (limit)` guard is
    // evaluated once on the initial value, so a `limit: 0` list would never
    // carry it and a later 0 → 10 would not re-key the query.
    const reactiveKeys: ReactiveQueryKeys = { sort, filters, limit };
    if (!withoutLocale && locale.value) reactiveKeys.locale = locale;
    if (withCurrency) reactiveKeys.currencyCode = currencyCode;
    if (withBasket) reactiveKeys.basketId = basketId;

    if (criteria)
      watch(props, next => {
        // A `limit` change needs no assignment — it re-keys the query, which
        // restarts the cursor at the first page on its own.
        if (
          isEqual(unref(sort), next.sort) &&
          isEqual(unref(filters), next.filters)
        )
          return;
        sort.value = next.sort;
        filters.value = next.filters;
        if (!isInitialCall.value) queryClient.resetQueries({ queryKey }); // Reset to first page
      });

    const response = scope.run(() =>
      vueUseInfiniteQuery<TQueryFnData, DefaultError, TData>(
        {
          queryKey: [...queryKey, reactiveKeys],
          queryFn: async ({ pageParam = 0, signal }) => {
            const offset = toNumber(pageParam);
            const hasGuard = isPromise(guard);
            const safeguard: Promise<void | boolean> = hasGuard
              ? guard()
              : Promise.resolve();
            return safeguard.then(() => {
              if (withSplitCount) url.searchParams.set("skip_count", "1");

              return request<TQueryFnData>({
                url,
                sort: sort.value,
                filters: filters.value,
                pagination: { limit: limit.value, offset },
                withCurrency,
                withBasket,
                withoutLocale,
                init: {
                  ...init,
                  signal // Pass the new signal to the request to allow cancellation
                },
                withAccessToken
              })
                .then(response => {
                  total.value = response.total || 0; // Set the total items count

                  const data = isFunction(select)
                    ? select(response.data!)
                    : response.data;

                  return {
                    nextOffset:
                      !limit.value || offset + limit.value >= total.value
                        ? undefined
                        : offset + limit.value,
                    pageData: data
                  };
                })
                .finally(() => {
                  isInitialCall.value = false;
                });
            });
          },
          getNextPageParam: (lastPage: InfiniteQueryPage<TQueryFnData>) =>
            lastPage.nextOffset,
          ...(options as any)
        },
        queryClient
      )
    );

    // -------------------------------------------------------------------------

    if (withSplitCount)
      countRequest({
        queryKey,
        url,
        sort: sort.value,
        filters: filters.value,
        withCurrency,
        withoutLocale,
        init: {
          ...init
        },
        withAccessToken
      }).then(count => {
        total.value = count as number;
      });

    const handle = {
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
      pagination: computed((): PaginationInfo => {
        // We use the length of the final, selected data array.
        // The `as any[]` is a safe type assertion here because we know
        // our `select` function returns an array.
        const itemsFetched = (response?.data.value as any[])?.length ?? 0;

        // Calculate pages fetched based on items and limit
        const pagesFetched =
          limit.value > 0 ? Math.ceil(itemsFetched / limit.value) : 1;

        return {
          limit: limit.value,
          total: total.value,
          page: pagesFetched,
          pages: pageTotal.value,
          from: 1, // For "load more", we always show from item 1
          to: itemsFetched // The last item is simply the total number fetched
        };
      }),

      /**
       * Meta-information about the current query, such as whether there are next or previous pages.
       * @type {Object}
       * @property {boolean} hasNextPage - Whether there is a next page.
       * @property {boolean} hasPrevPage - Whether there is a previous page.
       * @property {boolean} hasPages - Whether there is more than one page of results.
       */
      meta: computed(() => ({
        hasNextPage: response?.hasNextPage?.value,
        hasPrevPage: response?.hasPreviousPage?.value,
        hasPages: pageTotal.value > 1
      })),

      resetQuery: () => queryClient.resetQueries({ queryKey })
    };

    // ONE write path: the criteria owns the request state when declared, and
    // the raw setters are the whole surface when it is not.
    if (criteria)
      return {
        ...handle,
        criteria: criteria.model,
        schema: criteria.schema,
        isFiltered: criteria.isFiltered,
        criteriaError: criteria.error,
        setCriteria: criteria.set
      } as WithCriteria<InfiniteListQuery<TQueryFnData, TData>, TModel>;

    return {
      ...handle,

      sort: (values?: QueryParams["sort"]) => {
        sort.value = unref(values);
        if (!isInitialCall.value) queryClient.resetQueries({ queryKey }); // Reset to first page
      },

      filter: (values: QueryParams["filters"]) => {
        filters.value = unref(values);
        if (!isInitialCall.value) queryClient.resetQueries({ queryKey }); // Reset to first page
      }
    } as InfiniteListQuery<TQueryFnData, TData>;
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
    TContext = unknown
  >(
    method: Omit<Methods, "GET" | "HEAD">,
    {
      mutationKey,
      url,
      init,
      data,
      withAccessToken,
      withoutLocale,
      ...options
    }: MutationParams<QueryResponse<TData>, TError, TVariables, TContext>
  ) {
    // ensure we have a scope, in case we call this outside of a setup function
    // Check if current scope is active - stopped scopes cause scope.run() to return undefined
    const currentScope = getCurrentScope();
    const scope = currentScope?.active ? currentScope : effectScope(true);

    // safeguard
    init ??= {};

    // set "lang" parameter
    if (!withoutLocale && locale.value) {
      if (!url.searchParams.has("lang")) {
        url.searchParams.set("lang", locale.value as string);
      }
    }

    // Enforce method, header, parse body
    set(init, "method", method.toUpperCase());
    set(init, "body", parseData(data));

    const response = scope.run(() =>
      useMutation(
        {
          mutationKey,
          mutationFn: async () =>
            request<TData>({ url, init, withAccessToken }),
          ...options
        },
        queryClient
      )
    );

    return response as MutationResult<TData, TError, TVariables, TContext>;
  }

  // --- Async methods
  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   * NOTE: this does not deal with pagination, it is a simple GET request.
   * @see {@link QueryParams}
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param guard A function that returns a promise to be resolved before the request is sent. This can be used to ensure that certain conditions are met before the request is sent, such as checking if the user is authenticated.
   * @param select A function to select a subset of the data returned by the request. This can be used to transform the data before it is returned.
   * @param queryKey The query key to use for the request. This is used to cache the request and can be used to invalidate the cache later.
   * @param withCurrency Whether to automagically add the currency filter to the request based on the `useBasketCurrency` composable.
   * @param withBasket Whether to automagically add the basket ID to the request based on the `useBasket` composable.
   * @param withoutLocale Whether to exclude the locale from the request.
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param options Additional options to pass to TanStack query.
   */
  async function countRequest<TQueryFnData = unknown, _TData = TQueryFnData>({
    url,
    init,
    guard: _guard,
    select: _select,
    queryKey,
    withCurrency,
    withoutLocale,
    withAccessToken,
    ...options
  }: Omit<QueryParams<TQueryFnData, number>, "pagination">): Promise<number> {
    // Remove initialData from options before spreading, as it's not part of FetchQueryOptions

    // --- state
    const sort = options?.sort;
    const filters = options?.filters;
    const reactiveKeys: ReactiveQueryKeys = { sort, filters };
    if (!withoutLocale && locale.value) reactiveKeys.locale = locale.value;

    // ensure we request the count
    const safeUrl = new URL(url.toString());
    safeUrl.searchParams.set("limit", "count");

    // --- query
    return queryClient.fetchQuery<TQueryFnData, DefaultError, number>({
      queryKey: cleanQueryKey([...queryKey, reactiveKeys, "count"]),
      queryFn: async ({ signal }) => {
        return request<TQueryFnData>({
          url: safeUrl,
          sort,
          filters,
          withoutLocale,
          withCurrency,
          init: {
            ...init,
            signal // Pass the new signal to the request to allow cancellation
          },
          withAccessToken
        }).then(response => {
          return response.total;
        });
      },
      ...(options as any)
    });
  }

  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   * NOTE: this does not deal with pagination, it is a simple GET request.
   * @see {@link QueryParams}
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param guard A function that returns a promise to be resolved before the request is sent. This can be used to ensure that certain conditions are met before the request is sent, such as checking if the user is authenticated.
   * @param select A function to select a subset of the data returned by the request. This can be used to transform the data before it is returned.
   * @param queryKey The query key to use for the request. This is used to cache the request and can be used to invalidate the cache later.
   * @param withCurrency Whether to automagically add the currency filter to the request based on the `useBasketCurrency` composable.
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param options Additional options to pass to TanStack query.
   */
  async function getRequest<TQueryFnData = unknown, TData = TQueryFnData>({
    url,
    init,
    guard: _guard,
    select,
    queryKey,
    withCurrency,
    withBasket,
    withoutLocale,
    withAccessToken,
    ...options
  }: Omit<QueryParams<TQueryFnData, TData>, "pagination">): Promise<TData> {
    // Remove initialData from options before spreading, as it's not part of FetchQueryOptions

    // --- state
    const sort = options?.sort;
    const filters = options?.filters;
    const reactiveKeys: ReactiveQueryKeys = { sort, filters };
    if (!withoutLocale && locale.value) reactiveKeys.locale = locale.value;

    // --- query
    return queryClient.fetchQuery<TQueryFnData, DefaultError, TData>({
      queryKey: cleanQueryKey([...queryKey, reactiveKeys]),
      queryFn: async ({ signal }) => {
        return request<TQueryFnData>({
          url,
          sort,
          filters,
          withoutLocale,
          withCurrency,
          withBasket,
          init: {
            ...init,
            signal // Pass the new signal to the request to allow cancellation
          },
          withAccessToken
        }).then(response => {
          if (isFunction(select))
            return (select as (...args: unknown[]) => unknown)(
              response.data!,
              response.related,
              response.meta
            ) as TData;
          return response.data as TQueryFnData;
        });
      },
      ...(options as any)
    });
  }

  /**
   * Syntax sugar for sending a GET request with pagination, filters, and sorting to the server with the given URL and options.
   * @see {@link QueryParams}
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param guard A function that returns a promise to be resolved before the request is sent. This can be used to ensure that certain conditions are met before the request is sent, such as checking if the user is authenticated.
   * @param select A function to select a subset of the data returned by the request. This can be used to transform the data before it is returned.
   * @param queryKey The query key to use for the request. This is used to cache the request and can be used to invalidate the cache later.
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param options Additional options to pass to TanStack query.
   */
  async function listRequest<TQueryFnData = unknown, TData = TQueryFnData>({
    url,
    init,
    guard: _guard,
    select,
    queryKey,
    withAccessToken,
    withoutLocale,
    withSplitCount,
    ...options
  }: QueryParams<TQueryFnData, TData>): Promise<QueryResponse<TData>> {
    // --- state
    const limit = options?.pagination?.limit ?? PAGINATION.limit;
    const offset = options?.pagination?.offset ?? PAGINATION.offset;
    const sort = options?.sort;
    const filters = options?.filters;
    const pageIndex = ref(Math.ceil(offset / limit) + 1);

    const reactiveKeys: ReactiveQueryKeys = { sort, filters, limit, pageIndex };
    if (!withoutLocale && locale.value) reactiveKeys.locale = locale.value;

    return queryClient.fetchQuery<
      TQueryFnData,
      DefaultError,
      QueryResponse<TData>
    >({
      queryKey: cleanQueryKey([...queryKey, reactiveKeys]),
      queryFn: async ({ signal }) => {
        if (withSplitCount) url.searchParams.set("skip_count", "1");

        const params = {
          url,
          sort,
          filters,
          pagination: { limit, offset },
          withoutLocale,
          withCurrency: options.withCurrency,
          withBasket: options.withBasket,
          init: {
            ...init,
            signal // Pass the new signal to the request to allow cancellation
          },
          withAccessToken
        };
        return (
          request<TQueryFnData>(params)
            // NB: we need to ensure that if we are given an offset that is greater than the total number of pages, we adjust it accordingly
            .then(response => {
              const offset = (pageIndex.value - 1) * limit;

              if (response.total && offset >= response.total) {
                // modify the params and re-request with the new offset
                // Calculate the correct offset for the last page so it doesn't exceed the total
                const safeOffset = Math.max(
                  0,
                  response.total - (response.total % limit || limit)
                );
                params.pagination.offset = safeOffset;
                pageIndex.value = Math.ceil(safeOffset / limit) + 1;
                return request<TQueryFnData>(params);
              }
              return response;
            })
            // NB: we need to ensure that we parse the data correctly prior to applying the select function
            //     this ensures the cache stores the parsed data and not the raw data
            .then(response => {
              if (isFunction(select)) {
                return {
                  ...response,
                  data: select(response.data!)
                };
              }
              return response;
            })
            // Merge the count from the separate request if using split count
            .then(async response => {
              if (!withSplitCount) return response;

              return countRequest({
                queryKey,
                url,
                sort,
                filters,
                withCurrency: options.withCurrency,
                withoutLocale,
                init,
                withAccessToken
              }).then(count => {
                response.total = count as number;
                return response;
              });
            })
        );
      },
      ...(options as any)
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
   * @param mutationKey The mutation key to use for the request. This is used to cache the request and can be used to invalidate the cache later.
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. Can be a string or a boolean.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function postRequest<T = object>({
    mutationKey,
    url,
    init,
    data,
    withAccessToken,
    withoutLocale
  }: RequestParams & { mutationKey: MutationKey }): Promise<T> {
    return mutate<T>(Methods.POST, {
      mutationKey,
      url,
      init,
      data,
      withAccessToken,
      withoutLocale
    })
      .mutateAsync()
      .then(response => (response?.data || response) as T);
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
   * @param mutationKey The mutation key to use for the request. This is used to cache the request and can be used to invalidate the cache later.
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. Can be a string or a boolean.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function putRequest<T = object>({
    mutationKey,
    url,
    init,
    data,
    withAccessToken,
    withoutLocale
  }: RequestParams & { mutationKey: MutationKey }): Promise<T> {
    return mutate<T>(Methods.PUT, {
      mutationKey,
      url,
      init,
      data,
      withAccessToken,
      withoutLocale
    })
      .mutateAsync()
      .then(response => (response?.data || response) as T);
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
   * @param mutationKey The mutation key to use for the request. This is used to cache the request and can be used to invalidate the cache later.
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. Can be a string or a boolean.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function patchRequest<T = object>({
    mutationKey,
    url,
    init,
    data,
    withAccessToken,
    withoutLocale
  }: RequestParams & { mutationKey: MutationKey }): Promise<T> {
    return mutate<T>(Methods.PATCH, {
      mutationKey,
      url,
      init,
      data,
      withAccessToken,
      withoutLocale
    })
      .mutateAsync()
      .then(response => (response?.data || response) as T);
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
   * @param mutationKey The mutation key to use for the request. This is used to cache the request and can be used to invalidate the cache later.
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. Can be a string or a boolean.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function deleteRequest<T = object>({
    mutationKey,
    url,
    init,
    data,
    withAccessToken,
    withoutLocale
  }: RequestParams & { mutationKey: MutationKey }): Promise<T> {
    return mutate<T>(Methods.DELETE, {
      mutationKey,
      url,
      init,
      data,
      withAccessToken,
      withoutLocale
    })
      .mutateAsync()
      .then(response => (response?.data || response) as T);
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
    withAccessToken
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
    getList: listRequest,
    del: deleteRequest,
    put: putRequest,
    post: postRequest,
    head: headRequest,
    patch: patchRequest,
    // --- raw envelope-returning request (for callers that need the full
    //     `QueryResponse` — e.g. to read sideloaded resources like `related`
    //     that `select`/`get`/`getList` strip away)
    request,
    // --- cancel method
    cancel: async (
      queryKey: QueryKey,
      options: { exact?: boolean } = { exact: false }
    ) => {
      return queryClient.cancelQueries({ queryKey, ...options });
    }
  };
};
