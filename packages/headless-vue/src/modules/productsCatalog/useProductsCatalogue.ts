// --- external
import { computed, unref } from "vue";
import { useInfiniteQuery } from "@tanstack/vue-query";
import type { MaybeRefOrGetter } from "vue";

// --- internal
import { useSession } from "@upmind-automation/headless-vue";
import {
  QueryResponse,
  useProductsCatalogue as useUpmindProductsCatalogue,
} from "@upmind-automation/headless";

// --- utils
import { isArray, isEmpty } from "lodash-es";
import { IProduct } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export const useProductsCatalogue = ({
  limit = 12,
  search,
  enabled = true,
}: {
  limit?: number;
  search?: MaybeRefOrGetter<string>;
  enabled?: boolean;
} = {}) => {
  const { meta: session } = useSession();
  const { isReady, getProducts, queryOptions } = useUpmindProductsCatalogue();

  // Make search reactive
  const searchValue = computed(() => {
    if (!search) return "";
    const searchTerm = unref(search);
    return typeof searchTerm === "string" ? searchTerm.trim() : "";
  });

  // Create the query function that matches useInfiniteQuery expectations
  const queryFn = async ({ pageParam = 0 }: { pageParam?: number }) => {
    try {
      // Ensure the user is authenticated before loading products
      await isReady();
      // Call the service to load products with the provided parameters
      // pageParam should be the offset (page * limit)
      const searchTerm = searchValue.value;
      return await getProducts({
        limit,
        pageParam,
        ...(searchTerm && { search: searchTerm }), // Only include search if not empty
      });
    } catch (error) {
      console.error("Query function error:", error);
      throw error;
    }
  };

  const {
    data,
    error,
    status,
    isError,
    refetch,
    isPending,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryFn,
    enabled: session.value?.isAuthenticated && enabled,
    queryKey: [...(queryOptions.queryKey || []), { search: searchValue }], // Include reactive search in the query key
    staleTime: queryOptions?.staleTime || 0,
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: QueryResponse<IProduct[]>,
      allPages: QueryResponse<IProduct[]>[]
    ) => {
      try {
        // Check if the response has an error or failed status
        if (lastPage.status !== 200 || lastPage.errors) {
          return undefined; // Stop pagination on error
        }

        // Get the actual data array from the response
        const pageData = lastPage.data;

        // Ensure we have an array of data
        if (!isArray(pageData)) {
          return undefined;
        }

        const currentPageSize = pageData.length;

        // If we got less than the expected page size, we're at the end
        if (currentPageSize < limit) {
          return undefined; // No more pages
        }

        // If we have a total count, check against it
        if (lastPage.total !== null && lastPage.total !== undefined) {
          const totalLoadedItems = allPages.reduce((sum, page) => {
            return sum + (isArray(page.data) ? page.data.length : 0);
          }, 0);

          if (totalLoadedItems >= lastPage.total) {
            return undefined; // We've loaded everything
          }
        }

        // Return the next page number (current page count)
        return allPages.length;
      } catch (error) {
        console.error("getNextPageParam error:", error);
        return undefined;
      }
    },
  });

  // Create safe computed properties
  const meta = computed(() => {
    const pages = data.value?.pages;
    const firstPage = pages?.[0];

    // Access data from QueryResponse structure
    const firstPageData = firstPage?.data || [];

    return {
      isError: isError.value,
      isEmpty: isEmpty(firstPageData),
      isPending: isPending.value,
      isLoading: isFetching.value,
      isAvailable: session.value?.isAuthenticated,
    };
  });

  // Helper computed properties for pagination
  const totalPages = computed(() => {
    const pages = data.value?.pages;
    if (!pages || pages.length === 0) return 0;

    const firstPage = pages[0];
    if (firstPage.total && isArray(firstPage.data)) {
      return Math.ceil(firstPage.total / limit);
    }

    return pages.length + (hasNextPage.value ? 1 : 0);
  });

  const currentPage = computed(() => {
    return (data.value?.pages?.length || 1) - 1;
  });

  const totalItems = computed(() => {
    const pages = data.value?.pages;
    if (!pages || pages.length === 0) return 0;

    // If we have a total from the API, use that
    const firstPage = pages[0];
    if (firstPage.total !== null && firstPage.total !== undefined) {
      return firstPage.total;
    }

    // Otherwise, count loaded items
    return pages.reduce((sum, page) => {
      return sum + (isArray(page.data) ? page.data.length : 0);
    }, 0);
  });

  // ---------------------------------------------------------------------------
  return {
    data,
    meta,
    error,
    status,
    refetch,
    // next page related properties
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    // pagination helpers
    totalPages,
    currentPage,
    totalItems,
    // ---
    isReady,
  };
};
