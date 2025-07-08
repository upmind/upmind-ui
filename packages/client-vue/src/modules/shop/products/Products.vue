<template>
  <div :class="styles.products.root">
    <nav :class="styles.products.facets.root" v-if="uiCart?.catalog?.facet">
      <CategoriesFacet v-model="categoryId" />
    </nav>
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
          v-model="query"
          :class="[styles.products.main.searchInput, 'flex-1']"
          :placeholder="t('product.search.placeholder')"
          :auto-focus="false"
          input-size="sm"
          aria-label="Search products"
          data-testid="product-search"
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
    </main>
  </div>
</template>

<script setup lang="ts">
// --- external
import { watch, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBrand,
  useProductCatalogue,
  RequestSortDirection,
  ProductSortableProperties
} from "@upmind-automation/headless";
import config from "../shop.config";

// --- components
import {
  InputExtended,
  Icon,
  Pagination,
  useStyles
} from "@upmind-automation/upmind-ui";
import ProductItem from "./ProductItem.vue";
import ProductItemSkeleton from "./ProductItemSkeleton.vue";
import ProductSort from "./ProductSort.vue";
import CategoriesFacet from "../categories/CategoriesFacet.vue";

// --- utils
import { isArray, isEmpty } from "lodash-es";

// --- types
import type { Product } from "@upmind-automation/headless";
import type { ProductSortProps, ProductsProps } from "./types";
import type { ComputedRef } from "vue";

const DEFAULT_SKELETON_COUNT = 9;
const PRODUCTS_PER_PAGE = 9;
// -----------------------------------------------------------------------------

const categoryId = defineModel<ProductsProps["categoryId"]>("categoryId");

const query = defineModel<ProductsProps["query"]>("query");

const sortBy = defineModel<ProductSortProps["property"]>("sort", {
  default: ProductSortableProperties.DEFAULT
});

const direction = defineModel<ProductSortProps["direction"]>("direction", {
  default: RequestSortDirection.ASC
});

// ---------------------------------------------------------------------------

const { t } = useI18n();

const { uiCart } = useBrand();

const { data, meta, pagination, filters, sort, nextPage, prevPage } =
  useProductCatalogue({
    // infinite: !!uiCart.value?.catalog?.infinite, // TODO
    pagination: {
      limit: PRODUCTS_PER_PAGE
    }
  });

// --- context
const lastProductCount = ref(DEFAULT_SKELETON_COUNT);

const styles = useStyles(
  [
    "products",
    "products.facets",
    "products.main",
    "products.main.grid",
    "products.main.emptyState"
  ],
  {},
  config
) as ComputedRef<{
  products: {
    root: string;
    facets: {
      root: string;
    };
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
