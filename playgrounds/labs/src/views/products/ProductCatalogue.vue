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
          <div class="flex items-center gap-2">
            <div
              :class="[
                'h-2 w-2 rounded-full',
                !error ? 'bg-emerald-500' : 'bg-red-500',
              ]"
            ></div>
            <span :class="!error ? 'text-emerald-700' : 'text-red-700'">
              {{ !error ? "Connected" : "Error" }}
            </span>
          </div>
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

    <!-- Main Content -->
    <div class="mx-auto max-w-7xl px-6 py-6">
      <div class="flex gap-8">
        <!-- Categories Sidebar -->
        <div class="w-80 flex-shrink-0">
          <div class="rounded-xl border border-slate-200 bg-white shadow-sm">
            <!-- Categories Header -->
            <div class="border-b border-slate-200 p-6">
              <!-- Category Search -->
              <div class="relative">
                <div
                  class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
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
                  v-model="categorySearchTerm"
                  type="text"
                  placeholder="Category search"
                  class="w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <!-- Categories List -->
            <div class="space-y-1 p-4">
              <!-- All Categories Option -->
              <button
                @click="selectCategory(null)"
                :class="[
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors duration-200',
                  !selectedCategoryId
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-100',
                ]"
              >
                <span class="font-medium">All Categories</span>
                <span class="text-xs text-slate-500">{{ data.length }}</span>
              </button>

              <!-- Category Items -->
              <div
                v-for="category in filteredCategories"
                :key="category.id"
                class="space-y-1"
              >
                <!-- Main Category -->
                <div class="flex items-center">
                  <button
                    v-if="
                      category.subcategories &&
                      category.subcategories.length > 0
                    "
                    @click="toggleCategoryExpansion(category.id)"
                    class="mr-1 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <svg
                      :class="[
                        'h-3 w-3 transition-transform duration-200',
                        expandedCategories.has(category.id) ? 'rotate-90' : '',
                      ]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                  <div v-else class="w-6"></div>

                  <button
                    @click="selectCategory(category.id)"
                    :class="[
                      'flex flex-1 items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors duration-200',
                      selectedCategoryId === category.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-100',
                    ]"
                  >
                    <span
                      :class="
                        category.subcategories &&
                        category.subcategories?.length > 0
                          ? 'font-medium'
                          : ''
                      "
                    >
                      {{ category.name }}
                    </span>
                    <span class="text-xs text-slate-500">
                      {{ category.products_count || 0 }}
                    </span>
                  </button>
                </div>

                <!-- Subcategories -->
                <div
                  v-if="
                    category.subcategories &&
                    expandedCategories.has(category.id)
                  "
                  class="ml-6 space-y-1"
                >
                  <button
                    v-for="subcategory in category.subcategories"
                    :key="subcategory.id"
                    @click="selectCategory(subcategory.id)"
                    :class="[
                      'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors duration-200',
                      selectedCategoryId === subcategory.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100',
                    ]"
                  >
                    <span>{{ subcategory.name }}</span>
                    <span class="text-xs text-slate-500">
                      {{ subcategory.products_count || 0 }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Products Content -->
        <div class="flex-1">
          <!-- Search and Controls -->
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
                  placeholder="Product search"
                  class="w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 placeholder-slate-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @keydown.enter="performSearch"
                />
                <button
                  v-if="searchTerm"
                  @click="clearSearch"
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
                  v-if="hasActiveFilters"
                  @click="clearAllFilters"
                  class="rounded-lg bg-slate-200 px-6 py-3 font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-300"
                >
                  Clear Filters
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

            <!-- Active Filters -->
            <div
              v-if="hasActiveFilters"
              class="mt-4 flex flex-wrap items-center gap-2"
            >
              <!-- Search Filter -->
              <div
                v-if="activeSearch"
                class="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-sm text-blue-600"
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
                  >Search: <strong>"{{ activeSearch }}"</strong></span
                >
                <button
                  @click="clearSearch"
                  class="ml-1 text-blue-400 hover:text-blue-600"
                >
                  <svg
                    class="h-3 w-3"
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

              <!-- Category Filter -->
              <div
                v-if="selectedCategory"
                class="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1 text-sm text-green-600"
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
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <span
                  >Category: <strong>{{ selectedCategory.name }}</strong></span
                >
                <button
                  @click="selectCategory(null)"
                  class="ml-1 text-green-400 hover:text-green-600"
                >
                  <svg
                    class="h-3 w-3"
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
          <div
            v-if="!meta?.isLoading && meta?.isEmpty"
            class="py-16 text-center"
          >
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
                No products found
              </h3>
              <p class="mb-6 text-slate-600">{{ getEmptyStateMessage() }}</p>
              <button
                v-if="hasActiveFilters"
                @click="clearAllFilters"
                class="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          <!-- Products Grid -->
          <div v-if="!meta?.isLoading && !meta?.isEmpty" class="space-y-6">
            <div class="flex items-center justify-between">
              <span class="text-2xl font-bold text-slate-900">
                {{ getProductsTitle() }}
              </span>
              <div class="text-sm text-slate-500">
                {{ data.length }}
                {{ data.length === 1 ? "product" : "products" }}
              </div>
            </div>

            <!-- Product Cards -->
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="product in data"
                :key="product.id"
                class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 class="mb-2 text-lg font-semibold text-slate-900">
                  {{ product.productDetails.title }}
                </h3>
                <p
                  v-if="product.productDetails.description"
                  class="mb-4 text-sm text-slate-600"
                >
                  {{ product.productDetails.description }}
                </p>
                <div class="flex items-center justify-between">
                  <span class="text-lg font-bold text-blue-600">
                    {{ product.price?.currentPrice || "Price TBD" }}
                  </span>
                  <button
                    class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>

            <!-- Pagination Controls -->
            <div v-if="showPagination" class="py-8">
              <div class="flex items-center justify-center gap-4">
                <button
                  @click="loadPreviousPage"
                  :disabled="!canLoadPrevious"
                  class="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Previous
                </button>

                <span class="text-sm text-slate-600">
                  Page {{ currentPage }} of {{ totalPages }}
                </span>

                <button
                  @click="loadNextPage"
                  :disabled="!canLoadNext"
                  class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  Next
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useProductCatalogue } from "@upmind-automation/headless";
import type { IProductCategory } from "@upmind-automation/types";
import type { IApiFilter } from "@upmind-automation/headless";

// Search state
const searchTerm = ref("");
const activeSearch = ref("");

// Category state
const categorySearchTerm = ref("");
const selectedCategoryId = ref<string | null>(null);
const expandedCategories = ref(new Set<string>());

// Composables
const {
  data,
  meta,
  error,
  getPaged,
  pagination,
  invalidate,
  categories: { getAll: getAllCategories },
} = useProductCatalogue();

// Categories data
const categories = ref<IProductCategory[]>([]);

// Local state
const statusMessage = ref<{ type: string; message: string } | null>(null);

// Computed properties
const filteredCategories = computed(() => {
  if (!categories.value) return [];

  if (!categorySearchTerm.value.trim()) {
    return categories.value;
  }

  const searchLower = categorySearchTerm.value.toLowerCase();
  return categories.value.filter((category: IProductCategory) => {
    const matchesName = category.name?.toLowerCase().includes(searchLower);
    const matchesSubcategory = category.subcategories?.some(
      (sub: IProductCategory) => sub.name?.toLowerCase().includes(searchLower)
    );
    return matchesName || matchesSubcategory;
  });
});

const selectedCategory = computed(() => {
  if (!selectedCategoryId.value || !categories.value) return null;

  // Search in main categories
  for (const category of categories.value) {
    if (category.id === selectedCategoryId.value) {
      return category;
    }
    // Search in subcategories
    if (category.subcategories) {
      for (const subcategory of category.subcategories) {
        if (subcategory.id === selectedCategoryId.value) {
          return subcategory;
        }
      }
    }
  }
  return null;
});

const hasActiveFilters = computed(() =>
  Boolean(activeSearch.value || selectedCategoryId.value)
);

const showPagination = computed(
  () => pagination.value && pagination.value.total > pagination.value.limit
);

const canLoadNext = computed(() => meta.value.hasNextPage);

const canLoadPrevious = computed(() => meta.value.hasPreviousPage);

const currentPage = computed(() => {
  if (!pagination.value) return 1;
  return Math.floor(pagination.value.offset / pagination.value.limit) + 1;
});

const totalPages = computed(() => {
  if (!pagination.value) return 1;
  return Math.ceil(pagination.value.total / pagination.value.limit);
});

// Auto-clear status messages
const clearStatusMessage = () => {
  setTimeout(() => {
    statusMessage.value = null;
  }, 5000);
};

// Load categories
async function loadCategories() {
  try {
    categories.value = await getAllCategories();
  } catch (error) {
    console.error("Failed to load categories:", error);
  }
}

// Search functionality
function performSearch() {
  activeSearch.value = searchTerm.value.trim();
  loadProducts();
}

function clearSearch() {
  searchTerm.value = "";
  activeSearch.value = "";
  loadProducts();
}

// Category functionality
function selectCategory(categoryId: string | null) {
  selectedCategoryId.value = categoryId;
  loadProducts();
}

function toggleCategoryExpansion(categoryId: string) {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId);
  } else {
    expandedCategories.value.add(categoryId);
  }
}

function clearAllFilters() {
  searchTerm.value = "";
  activeSearch.value = "";
  selectedCategoryId.value = null;
  loadProducts();
}

// Helper function to build filters array
function buildFilters(): IApiFilter[] {
  const filters: IApiFilter[] = [];

  // Add search filter - function that modifies the URL
  if (activeSearch.value) {
    filters.push((url: URL) => {
      url.searchParams.set("search", activeSearch.value);
      return url;
    });
  }

  // Add category filter - function that modifies the URL
  if (selectedCategoryId.value) {
    filters.push((url: URL) => {
      url.searchParams.set(
        "filter[products_category_id]",
        selectedCategoryId.value!
      );
      return url;
    });
  }

  return filters;
}

// Product loading
async function loadProducts(resetOffset = true) {
  try {
    // Always invalidate cache before applying new filters
    // This ensures we get fresh data even if query key serialization fails
    invalidate();

    const filters = buildFilters();
    const paginationParams = {
      limit: 12,
      offset: resetOffset ? 0 : pagination.value?.offset || 0,
    };

    const result = await getPaged({
      filters,
      pagination: paginationParams,
    });

    // Update status message
    const filterDescriptions = [];
    if (activeSearch.value) filterDescriptions.push(`"${activeSearch.value}"`);
    if (selectedCategory.value)
      filterDescriptions.push(selectedCategory.value.name);

    const filterText =
      filterDescriptions.length > 0
        ? ` matching ${filterDescriptions.join(" and ")}`
        : "";
    const resultCount = Array.isArray(result)
      ? result.length
      : data.value.length;

    statusMessage.value = {
      type: "success",
      message: `Found ${resultCount} products${filterText}`,
    };
    clearStatusMessage();
  } catch (err: any) {
    console.error("Failed to load products:", err);
    statusMessage.value = {
      type: "error",
      message: `Failed to load products: ${err.message}`,
    };
    clearStatusMessage();
  }
}

// Pagination
async function loadNextPage() {
  if (!canLoadNext.value) return;

  try {
    const filters = buildFilters(); // Use helper function

    await getPaged({
      filters: filters.length > 0 ? filters : undefined,
      pagination: {
        limit: pagination.value.limit,
        offset: pagination.value.offset + pagination.value.limit,
      },
    });
  } catch (err: any) {
    statusMessage.value = {
      type: "error",
      message: `Failed to load next page: ${err.message}`,
    };
    clearStatusMessage();
  }
}

async function loadPreviousPage() {
  if (!canLoadPrevious.value) return;

  try {
    const filters = buildFilters(); // Use helper function

    await getPaged({
      filters: filters.length > 0 ? filters : undefined,
      pagination: {
        limit: pagination.value.limit,
        offset: Math.max(0, pagination.value.offset - pagination.value.limit),
      },
    });
  } catch (err: any) {
    statusMessage.value = {
      type: "error",
      message: `Failed to load previous page: ${err.message}`,
    };
    clearStatusMessage();
  }
}

function refreshProducts() {
  statusMessage.value = {
    type: "info",
    message: "Refreshing products...",
  };
  clearStatusMessage();
  loadProducts(true);
}

// Utility functions
function getProductsTitle(): string {
  if (activeSearch.value && selectedCategory.value) {
    return `"${activeSearch.value}" in ${selectedCategory.value.name}`;
  } else if (activeSearch.value) {
    return `Search Results for "${activeSearch.value}"`;
  } else if (selectedCategory.value) {
    return selectedCategory.value.name;
  } else {
    return "All Products";
  }
}

function getEmptyStateMessage(): string {
  if (activeSearch.value && selectedCategory.value) {
    return `No products found matching "${activeSearch.value}" in ${selectedCategory.value.name}. Try adjusting your search terms or selecting a different category.`;
  } else if (activeSearch.value) {
    return `We couldn't find any products matching "${activeSearch.value}". Try adjusting your search terms.`;
  } else if (selectedCategory.value) {
    return `No products found in ${selectedCategory.value.name}. Try selecting a different category.`;
  } else {
    return "There are no products available at the moment. Please check back later.";
  }
}

// Watchers
watch(
  () => data.value.length,
  (newLength, oldLength) => {
    if (newLength > 0 && newLength !== oldLength) {
      const filters = [];
      if (activeSearch.value) filters.push(`"${activeSearch.value}"`);
      if (selectedCategory.value) filters.push(selectedCategory.value.name);

      const filterText =
        filters.length > 0 ? ` matching ${filters.join(" and ")}` : "";
      statusMessage.value = {
        type: "success",
        message: `Loaded ${newLength} products${filterText}`,
      };
      clearStatusMessage();
    }
  }
);

// Lifecycle
onMounted(async () => {
  await loadCategories();
  await loadProducts();
});
</script>
