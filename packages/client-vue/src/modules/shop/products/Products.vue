<template>
  <div :class="styles.products.root">
    <ProductFacet
      v-if="uiMeta?.catalog?.facet"
      class="mb-4 w-full md:mb-0 md:w-1/4"
      :category-id="categoryId"
      :selected-category-id="facetCategoryId"
      @category-selected="handleFacetCategorySelect"
    />

    <main
      :class="styles.products.main.root"
      role="main"
      aria-label="Product listing"
    >
      <!-- Search and controls -->
      <div
        :class="[
          styles.products.main.controls,
          'flex-col gap-3 md:flex-row md:gap-4'
        ]"
      >
        <InputExtended
          v-model="searchQuery"
          :class="[styles.products.main.searchInput, 'flex-1']"
          :placeholder="t('product.search.placeholder')"
          :auto-focus="false"
          input-size="sm"
          aria-label="Search products"
          data-testid="product-search"
          @input="handleSearch"
        >
          <template #prepend>
            <Icon
              icon="search"
              size="2xs"
              :class="styles.products.main.searchIcon"
            />
          </template>
        </InputExtended>

        <div class="w-full flex-shrink-0 md:w-auto">
          <ProductSort
            :model-value="currentSort"
            @update:model-value="handleSortChange"
          />
        </div>
      </div>

      <!-- Products grid -->
      <section
        v-if="!meta.isEmpty || meta.isLoading"
        :class="styles.products.main.grid.root"
      >
        <div
          :class="styles.products.main.grid.container"
          data-testid="products-grid"
        >
          <ProductItem
            v-if="!meta.isLoading"
            v-for="product in data as Product[]"
            :key="product.id"
            v-bind="product"
          />

          <ProductItemSkeleton
            v-else
            v-for="n in skeletonCount"
            :key="`skeleton-${n}`"
          />
        </div>

        <Pagination
          v-bind="pagination"
          :meta="meta"
          @next="nextPage"
          @prev="prevPage"
        />
      </section>

      <!-- Empty state -->
      <section
        v-else
        :class="styles.products.main.emptyState.root"
        role="status"
        aria-live="polite"
      >
        <Icon
          icon="search"
          size="md"
          :class="styles.products.main.emptyState.icon"
        />
        <div>
          <h3 :class="styles.products.main.emptyState.title">
            {{ t("product.empty.title") }}
          </h3>
          <p :class="styles.products.main.emptyState.description">
            {{ t("product.empty.description") }}
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed, watch, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  useBrand,
  useProductCatalogue,
  RequestSortDirection
} from "@upmind-automation/headless";

// --- utils
import { debounce } from "lodash-es";

// --- components
import {
  InputExtended,
  Icon,
  Pagination,
  useStyles
} from "@upmind-automation/upmind-ui";

// --- config
import config from "../shop.config";
import ProductItem from "./ProductItem.vue";
import ProductItemSkeleton from "./ProductItemSkeleton.vue";
import ProductFacet from "./ProductFacet.vue";
import ProductSort from "./ProductSort.vue";

// --- types
import type { Product } from "@upmind-automation/headless";
import type { ProductsProps } from "./types";
import { ProductSortType } from "./types";
import type { ComputedRef } from "vue";

const DEBOUNCE_DELAY = 300;
const DEFAULT_SKELETON_COUNT = 9;
const PRODUCTS_PER_PAGE = 9;

const props = defineProps<ProductsProps>();

const emit = defineEmits<{
  "facet-category-select": [id: string | null];
  "sort-change": [sort: string];
  "search-change": [search: string];
}>();

const { t } = useI18n();

const searchQuery = computed({
  get: () => props.searchQuery || "",
  set: (value: string) => emit("search-change", value)
});
const currentSort = computed(() => props.sortValue || ProductSortType.DEFAULT);

const { uiMeta } = useBrand();

const { data, meta, pagination, filters, sort, nextPage, prevPage } =
  useProductCatalogue({
    pagination: {
      limit: PRODUCTS_PER_PAGE
    }
  });

const lastProductCount = ref(DEFAULT_SKELETON_COUNT);

const skeletonCount = computed(() => {
  return lastProductCount.value;
});

watch(
  data,
  newData => {
    if (newData && Array.isArray(newData) && newData.length > 0) {
      lastProductCount.value = newData.length;
    }
  },
  { immediate: true }
);

const handleFacetCategorySelect = (id: string | null) => {
  emit("facet-category-select", id);
  const effectiveCategory = id || props.categoryId;
  filters.productCategory(effectiveCategory || undefined);
};

const debouncedSearch = debounce((value: string) => {
  filters.query(value);
  emit("search-change", value);
}, DEBOUNCE_DELAY);

const handleSearch = () => {
  debouncedSearch(searchQuery.value);
};

const handleSortChange = (sortValue: string) => {
  emit("sort-change", sortValue);
};

watch(
  [() => props.categoryId, () => props.facetCategoryId],
  () => {
    const effectiveCategory = props.facetCategoryId || props.categoryId;
    filters.productCategory(effectiveCategory || undefined);
  },
  { immediate: true }
);

watch(
  () => props.searchQuery,
  newSearchQuery => {
    if (newSearchQuery !== searchQuery.value) {
      filters.query(newSearchQuery || "");
    }
  },
  { immediate: true }
);

watch(
  () => props.sortValue,
  newSortValue => {
    if (!newSortValue || newSortValue === ProductSortType.DEFAULT) {
      sort.clear();
    } else {
      sort.set(newSortValue, RequestSortDirection.ASC);
    }
  },
  { immediate: true }
);

const styles = useStyles(
  [
    "products",
    "products.main",
    "products.main.grid",
    "products.main.emptyState"
  ],
  {},
  config
) as ComputedRef<{
  products: {
    root: string;
    main: {
      root: string;
      controls: string;
      searchInput: string;
      searchIcon: string;
      grid: {
        root: string;
        container: string;
      };
      emptyState: {
        root: string;
        icon: string;
        title: string;
        description: string;
      };
    };
  };
}>;
</script>
