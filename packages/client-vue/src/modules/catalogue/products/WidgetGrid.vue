<template>
  <div
    :class="styles.products.main.root"
    role="main"
    aria-label="Product listing"
    data-testid="widget-grid"
    ref="container"
  >
    <!-- Search and controls -->
    <div :class="styles.products.main.controls">
      <Input
        :model-value="query"
        :class="[styles.products.main.searchInput, 'flex-1']"
        :placeholder="t('form.product_name_search.placeholder')"
        :auto-focus="false"
        aria-label="Search products"
        data-testid="product-search"
        @update:model-value="doQuery"
        icon="search-md"
        class="max-w-full lg:max-w-xl"
      />

      <div class="w-full shrink-0 md:w-auto">
        <ProductSort v-model:property="sortBy" v-model:direction="direction" />
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
        <ProductCard
          v-if="!meta.isLoading"
          v-for="product in data"
          :disabled="processing"
          :key="product.id"
          v-bind="product"
          :preserve-promotion="preservePromotions"
          :configure-route="props.configureRoute"
          @resolve="processing = true"
        />

        <ProductCardSkeleton
          v-else
          v-for="n in lastProductCount"
          :key="`skeleton-${n}`"
        />
      </div>

      <Pagination
        v-if="meta.hasPages"
        v-bind="pagination"
        :meta="meta"
        @next="doNextPage"
        @prev="doPrevPage"
        :pagination-info="
          t('text.pagination_info', {
            page: '{page}',
            pages: '{pages}'
          })
        "
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
        icon="search-md"
        size="md"
        :class="styles.products.main.emptyState.icon"
      />
      <div>
        <h3 :class="styles.products.main.emptyState.title">
          {{ t("text.products_not_found") }}
        </h3>
        <p :class="styles.products.main.emptyState.description">
          {{ t("text.adjust_search_filters_msg") }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// --- external
import { watch, ref, computed, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { useUrlSearchParams } from "@vueuse/core";

// --- internal
import {
  useProductCatalogue,
  RequestSortDirection,
  ProductSortableProperties,
  DEBOUNCE_DELAY,
  useBasket
} from "@upmind-automation/headless";
import config from "../catalogue.config";

// --- components
import {
  Input,
  Icon,
  Pagination,
  useStyles
} from "@upmind-automation/upmind-ui";
import {
  ProductCard,
  ProductCardSkeleton
} from "../../product/components/card";
import ProductSort from "./components/ProductSort.vue";

// --- utils
import { debounce, isArray, isEmpty, some } from "lodash-es";

// --- types
import type { Product } from "@upmind-automation/headless";
import type { ProductSortProps, ProductsProps } from "./types";
import type { ComputedRef } from "vue";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    limit?: number;
    configureRoute: RouteLocationAsRelativeGeneric;
  }>(),
  { limit: 9 }
);

const processing = ref(false);
const { meta: basketMeta } = useBasket();

const container = useTemplateRef<HTMLDivElement>("container");

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

const urlParams = useUrlSearchParams("history");
const urlPage = computed(() => Math.max(Number(urlParams.page), 1));

const { data, meta, pagination, filters, sort, nextPage, prevPage } =
  useProductCatalogue({
    // infinite: !!uiCart.value?.catalogue?.infinite, // TODO
    pagination: {
      limit: props.limit,
      offset: (urlPage.value - 1) * props.limit
    }
  });

// --- context
const lastProductCount = ref(props.limit);

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

const doQuery = debounce((value: string | number | undefined) => {
  query.value = value?.toString().trim() || undefined;
}, DEBOUNCE_DELAY);

function doNextPage() {
  nextPage();
  container.value?.scrollIntoView({ behavior: "smooth" });
}

function doPrevPage() {
  prevPage();
  container.value?.scrollIntoView({ behavior: "smooth" });
}

const preservePromotions = computed(() =>
  some(data.value, (p: Product) => p.meta?.discounted === true)
);

//  --- side effects
watch(basketMeta, newMeta => {
  processing.value = newMeta.isProcessing ? processing.value : false;
});
watch(
  data,
  newData => {
    if (isArray(newData) && !isEmpty(newData)) {
      lastProductCount.value = newData.length;
    } else {
      lastProductCount.value = props.limit;
    }
  },
  { immediate: true }
);

// watch our props and update filters accordingly
watch(categoryId, filters.productCategory, { immediate: true });
watch(query, filters.query, { immediate: true });
watch(sortBy, value => sort(value, direction.value), { immediate: true });
watch(direction, value => sort(sortBy.value, value), { immediate: true });

// Sync Pagination -> URL (when a user clicks next/prev)
watch(
  () => pagination.value.page,
  newPage => {
    if (newPage !== urlPage.value) {
      urlParams.page = String(newPage);
    }
  }
);
</script>
