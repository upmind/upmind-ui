<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- Header Section -->
    <div class="border-b border-slate-200 bg-white shadow-sm">
      <div class="mx-auto max-w-7xl px-6 py-8">
        <div class="text-center">
          <h1 class="mb-2 text-4xl font-bold text-slate-900">
            Products Catalogue
          </h1>
          <p class="mx-auto max-w-2xl text-lg text-slate-600">
            Discover and explore our comprehensive range of products and
            services
          </p>
        </div>

        <!-- Status Bar -->
        <div class="mt-6 flex items-center justify-center gap-6 text-sm">
          <div class="text-slate-500">•</div>
          <div class="text-slate-600">
            {{ data.length }} Products
            <span v-if="pagination.total > data.length">
              of {{ pagination.total }}
            </span>
          </div>
          <div
            v-if="meta?.isLoading"
            class="flex items-center gap-2 text-blue-600"
          >
            <div
              class="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
            ></div>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Controls -->
    <div class="mx-auto max-w-7xl px-6 py-6">
      <div
        class="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div class="flex flex-col items-center gap-4 lg:flex-row">
          <!-- Search Input -->
          <div class="relative flex-1">
            <div
              class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"
            >
              <svg
                class="h-5 w-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Search products, categories, or descriptions..."
              class="w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 placeholder-slate-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              @keydown.enter="performSearch"
            />
            <button
              v-if="searchTerm"
              @click="
                searchTerm = '';
                clearSearch();
              "
              class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button
              @click="performSearch"
              :disabled="meta?.isLoading"
              class="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-blue-400"
            >
              <svg
                v-if="!meta?.isLoading"
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span
                v-else
                class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              />
              Search
            </button>

            <button
              v-if="activeSearch"
              @click="clearSearch"
              class="rounded-lg bg-slate-200 px-6 py-3 font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-300"
            >
              Clear
            </button>

            <button
              @click="refreshProducts"
              class="rounded-lg bg-slate-100 px-4 py-3 text-slate-700 transition-colors duration-200 hover:bg-slate-200"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Active Search Indicator -->
        <div
          v-if="activeSearch"
          class="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-600"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span
            >Showing results for: <strong>"{{ activeSearch }}"</strong></span
          >
        </div>
      </div>

      <!-- Status Messages -->
      <div v-if="statusMessage" class="mb-6">
        <div
          :class="[
            'flex items-center gap-3 rounded-lg px-4 py-3',
            statusMessage.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : '',
            statusMessage.type === 'error'
              ? 'border border-red-200 bg-red-50 text-red-800'
              : '',
            statusMessage.type === 'info'
              ? 'border border-blue-200 bg-blue-50 text-blue-800'
              : '',
          ]"
        >
          <svg
            v-if="statusMessage.type === 'success'"
            class="h-5 w-5 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <svg
            v-else-if="statusMessage.type === 'error'"
            class="h-5 w-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <svg
            v-else
            class="h-5 w-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{{ statusMessage.message }}</span>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div
      v-if="error"
      class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4"
    >
      <div class="flex items-center gap-3">
        <svg
          class="h-5 w-5 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <div class="font-semibold text-red-800">Error occurred</div>
          <div class="mt-1 text-sm text-red-700">
            {{ error?.message || error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Empty States -->
    <div v-if="!meta?.isLoading && meta.isEmpty" class="py-16 text-center">
      <div class="mx-auto max-w-md">
        <div
          class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100"
        >
          <svg
            class="h-8 w-8 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 class="mb-2 text-xl font-semibold text-slate-900">
          {{ activeSearch ? "No products found" : "No products available" }}
        </h3>
        <p class="mb-6 text-slate-600">
          {{
            activeSearch
              ? `We couldn't find any products matching "${activeSearch}". Try adjusting your search terms.`
              : "There are no products available at the moment. Please check back later."
          }}
        </p>
        <button
          v-if="activeSearch"
          @click="clearSearch"
          class="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700"
        >
          Clear Search
        </button>
      </div>
    </div>

    <pre>{{ { meta, pagination } }}</pre>
    <!-- Products Grid -->
    <div v-if="!meta?.isLoading && !meta.isEmpty" class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="text-2xl font-bold text-slate-900">
          {{ activeSearch ? `Search Results` : "Available Products" }}
        </div>
        <div class="text-sm text-slate-500">
          {{ data.length }}
          {{ data.length === 1 ? "product" : "products" }}
        </div>
      </div>

      <div
        class="grid grid-cols-1 items-start gap-8 md:grid-cols-2 xl:grid-cols-3"
      >
        <div
          v-for="product in allProducts"
          :key="product.id"
          class="group h-fit overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-xl"
        >
          <!-- Product Image -->
          <div
            class="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200"
          >
            <img
              v-if="product.image"
              :src="product.image.full_url || product.image.image_url"
              :alt="product.name"
              class="m-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div v-else class="flex h-full w-full items-center justify-center">
              <svg
                class="h-12 w-12 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>

            <!-- Category Badge -->
            <div v-if="product.category" class="absolute left-3 top-3">
              <span
                class="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur-sm"
              >
                {{ product.category.name }}
              </span>
            </div>
          </div>

          <!-- Product Content -->
          <div class="flex min-h-[280px] flex-col p-6">
            <!-- Header -->
            <div class="mb-4">
              <h3 class="mb-2 line-clamp-2 text-xl font-bold text-slate-900">
                {{ product.name }}
              </h3>

              <!-- Price -->
              <div class="flex items-center gap-2">
                <span
                  v-if="product.display_price"
                  class="text-2xl font-bold text-blue-600"
                >
                  {{ product.display_price }}
                </span>
                <span
                  v-else-if="product.prices?.[0]"
                  class="text-2xl font-bold text-blue-600"
                >
                  {{ product.prices[0].price_formatted }}
                </span>

                <span
                  v-if="product.prices?.[0]?.billing_cycle_months > 0"
                  class="text-sm text-slate-500"
                >
                  / {{ product.prices[0].billing_cycle_months }} months
                </span>
              </div>
            </div>

            <!-- Description -->
            <div v-if="product.description" class="mb-4 flex-1">
              <p class="line-clamp-3 text-sm leading-relaxed text-slate-600">
                {{ product.description }}
              </p>
            </div>

            <!-- Attributes -->
            <div
              v-if="product.attributes && product.attributes.length > 0"
              class="mb-4"
            >
              <div
                class="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                {{ getAttributesCategoryName(product.attributes) }}
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="attr in product.attributes.slice(0, 4)"
                  :key="attr.id"
                  class="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {{ attr.name }}
                </span>
                <span
                  v-if="product.attributes.length > 4"
                  class="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500"
                >
                  +{{ product.attributes.length - 4 }} more
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-auto flex gap-3">
              <button
                @click="openJsonDialog(product)"
                class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-200"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                JSON
              </button>

              <button
                v-if="product.options && product.options.length > 0"
                @click="openOptionsDialog(product)"
                class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors duration-200 hover:bg-blue-100"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
                Options ({{ product.options.length }})
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More Section -->
      <div v-if="meta.hasNextPage" class="py-8 text-center">
        <button
          @click="loadNextPage"
          :disabled="meta.isLoading"
          class="mx-auto flex items-center gap-3 rounded-lg bg-blue-600 px-8 py-4 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-blue-400"
        >
          <span
            v-if="meta.isLoading"
            class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
          />
          <svg
            v-else
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
          <span>
            {{ meta.isLoading ? "Loading..." : "Load More Products" }}
            <span v-if="!meta.isLoading && meta.hasNextPage">
              ({{ pagination.total - (pagination.offset + pagination.limit) }}
              remaining)
            </span>
          </span>
        </button>
      </div>

      <!-- End of Results -->
      <div v-else class="py-8 text-center">
        <div
          class="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>All products loaded ({{ pagination.total }} total)</span>
        </div>
      </div>
    </div>

    <!-- Debug Panel (collapsible) -->
    <div class="mx-auto max-w-7xl px-6 pb-8">
      <div
        class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <button
          @click="showDebug = !showDebug"
          class="flex w-full items-center justify-between px-6 py-4 text-left transition-colors duration-200 hover:bg-slate-50"
        >
          <span class="text-sm font-medium text-slate-900"
            >Debug Information</span
          >
          <svg
            :class="[
              'h-4 w-4 text-slate-500 transition-transform duration-200',
              showDebug ? 'rotate-180' : '',
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <div v-if="showDebug" class="border-t border-slate-200 bg-slate-50 p-6">
          <div
            v-if="data?.pages?.[0]"
            class="mb-4 grid grid-cols-2 gap-4 text-xs md:grid-cols-4"
          >
            <div><strong>Status:</strong> {{ data.pages[0].status }}</div>
            <div><strong>Total:</strong> {{ data.pages[0].total }}</div>
            <div>
              <strong>Data Length:</strong> {{ data.pages[0].data?.length }}
            </div>
            <div><strong>Pages Loaded:</strong> {{ data.pages.length }}</div>
          </div>
          <pre
            class="max-h-60 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100"
            >{{ JSON.stringify(data?.pages?.[0] || "No data", null, 2) }}</pre
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useProductCatalogue } from "@upmind-automation/headless-vue";

// Search state
const searchTerm = ref("");
const activeSearch = ref("");

// UI state
const showDebug = ref(false);

// Use the product catalogue composable with reactive search
const { data, error, meta, pagination, getPaged } = useProductCatalogue({
  limit: 3,
});

// Local state
const statusMessage = ref<{ type: string; message: string } | null>(null);

// Auto-clear status messages
const clearStatusMessage = () => {
  setTimeout(() => {
    statusMessage.value = null;
  }, 5000);
};

// Watch for data changes to update the status
watch(
  () => data.value.length,
  (newLength, oldLength) => {
    if (newLength > 0 && newLength !== oldLength) {
      if (activeSearch.value) {
        statusMessage.value = {
          type: "success",
          message: `Found ${newLength} products matching "${activeSearch.value}"`,
        };
      } else {
        statusMessage.value = {
          type: "success",
          message: `Successfully loaded ${newLength} products`,
        };
      }
      clearStatusMessage();
    }
  }
);

// Search functionality
function performSearch() {
  const trimmedSearch = searchTerm.value.trim();
  if (trimmedSearch !== activeSearch.value) {
    activeSearch.value = trimmedSearch;
    statusMessage.value = trimmedSearch
      ? { type: "info", message: `Searching for "${trimmedSearch}"...` }
      : { type: "info", message: "Loading all products..." };
    clearStatusMessage();
  }
}

function clearSearch() {
  searchTerm.value = "";
  activeSearch.value = "";
  statusMessage.value = {
    type: "info",
    message: "Showing all products",
  };
  clearStatusMessage();
}

// Load next page
async function loadNextPage() {
  try {
    await getPaged({
      // sort?: [direction: ApiSortDirection, property: string];
      // filters?: IApiFilter[];
      pagination: {
        limit: pagination.value.limit,
        offset: pagination.value.offset + pagination.value.limit,
      },
    });
    statusMessage.value = {
      type: "success",
      message: `Loaded ${data.value.length} products total`,
    };
    clearStatusMessage();
  } catch (err: any) {
    statusMessage.value = {
      type: "error",
      message: `Failed to load more products: ${err.message}`,
    };
  }
}

// Refresh all products
function refreshProducts() {
  statusMessage.value = {
    type: "info",
    message: "Refreshing products...",
  };
  getPaged({
    // sort?: [direction: ApiSortDirection, property: string];
    // filters?: IApiFilter[];
    pagination: {
      limit: 3,
      offset: 0,
    },
  });

  clearStatusMessage();
}

onMounted(() => {
  // Initial load
  getPaged({
    pagination: {
      limit: 3,
      offset: 0,
    },
  });
});
</script>
