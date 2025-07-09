<template>
  <div
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
        :model-value="query"
        :class="[styles.products.main.searchInput, 'flex-1']"
        :placeholder="t('product.search.placeholder')"
        :auto-focus="false"
        input-size="sm"
        aria-label="Search products"
        data-testid="product-search"
        @update:model-value="doQuery"
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
          items="Sortable"
          v-model:property="sortBy"
          v-model:direction="direction"
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
          v-for="n in lastProductCount"
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
  </div>
</template>

<script setup lang="ts">
// --- external
import { watch, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useProductCatalogue,
  RequestSortDirection,
  ProductSortableProperties,
  utils
} from "@upmind-automation/headless";
import config from "../catalogue.config";

// --- components
import {
  InputExtended,
  Icon,
  Pagination,
  useStyles
} from "@upmind-automation/upmind-ui";
import ProductItem from "./components/ProductItem.vue";
import ProductItemSkeleton from "./components/ProductItemSkeleton.vue";
import ProductSort from "./components/ProductSort.vue";

// --- utils
import { debounce, isArray, isEmpty } from "lodash-es";

// --- types
import type { Product } from "@upmind-automation/headless";
import type { ProductSortProps, ProductsProps } from "./types";
import type { ComputedRef } from "vue";
const { DEBOUNCE_DELAY } = utils;

const DEFAULT_SKELETON_COUNT = 9;
const PRODUCTS_PER_PAGE = 9;
// -----------------------------------------------------------------------------

const categoryId = defineModel<ProductsProps["categoryId"] | undefined>(
  "categoryId"
);

const query = defineModel<ProductsProps["query"] | undefined>("query");

const sortBy = defineModel<ProductSortProps["property"] | undefined>("sort", {
  default: ProductSortableProperties.DEFAULT
});

const direction = defineModel<ProductSortProps["direction"]>("direction", {
  default: RequestSortDirection.ASC
});

// ---------------------------------------------------------------------------

const { t } = useI18n();

const { data, meta, pagination, filters, sort, nextPage, prevPage } =
  useProductCatalogue({
    // infinite: !!uiCart.value?.catalogue?.infinite, // TODO
    pagination: {
      limit: PRODUCTS_PER_PAGE
    }
  });

// --- context
const lastProductCount = ref(DEFAULT_SKELETON_COUNT);

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

// --- methods

const doQuery = debounce((value: string | undefined) => {
  query.value = value?.trim() || undefined;
}, DEBOUNCE_DELAY);

//  --- side effects

watch(
  data,
  newData => {
    if (isArray(newData) && !isEmpty(newData)) {
      lastProductCount.value = newData.length;
    } else {
      lastProductCount.value = DEFAULT_SKELETON_COUNT;
    }
  },
  { immediate: true }
);

// watch our props and update filters accordingly

watch(categoryId, filters.productCategory, { immediate: true });

watch(query, filters.query, { immediate: true });

watch(sortBy, value => sort(value, direction.value), { immediate: true });

watch(direction, value => sort(sortBy.value, value), { immediate: true });
</script>
