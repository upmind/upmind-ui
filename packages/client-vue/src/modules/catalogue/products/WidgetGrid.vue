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
          :configure-route="catalogueConfigureRoute"
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
import { watch, ref, computed, useTemplateRef, inject } from "vue";
import { useI18n } from "vue-i18n";
import { useUrlSearchParams } from "@vueuse/core";
import { useRouter } from "vue-router";

// --- internal
import {
  useProductCatalogue,
  useProductCategories,
  RequestSortDirection,
  ProductSortableProperties,
  DEBOUNCE_DELAY,
  useBasket,
  useBrand,
  type UseProductCategories
} from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";
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
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

const props = defineProps<{
  configureRoute: RouteLocationAsRelativeGeneric;
}>();

const processing = ref(false);
const { meta: basketMeta } = useBasket();

const categoryInstance =
  inject<UseProductCategories>("useProductCategories") ??
  useProductCategories();

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
const { uiCart } = useBrand();
const router = useRouter();

const category = computed(() =>
  categoryId.value ? categoryInstance.getOne(categoryId.value) : undefined
);

const { ui } = useConfig().with({ category });

const catalogueConfigureRoute = computed(() => ({
  ...props.configureRoute,
  query: {
    ...props.configureRoute?.query,
    ...(uiCart.value?.catalogue?.inSitu
      ? { returnUrl: router.currentRoute.value.fullPath }
      : {})
  }
}));

// Determine limit based on layout columns (4-col = 12, 3-col = 9, 2-col = 8, 1-col = 6)
const LAYOUT_LIMITS: Record<string, number> = {
  "4-col": 12,
  "3-col": 9,
  "2-col": 8,
  "1-col": 6
};
const limit = computed(() => LAYOUT_LIMITS[ui.productListLayout.value] ?? 9);

const urlParams = useUrlSearchParams("history");
const urlPage = computed(() => Math.max(Number(urlParams.page), 1));

const { data, meta, pagination, filters, sort, nextPage, prevPage } =
  useProductCatalogue({
    // infinite: !!uiCart.value?.catalogue?.infinite, // TODO
    pagination: {
      limit: limit.value,
      offset: (urlPage.value - 1) * limit.value
    }
  });

// --- context
const lastProductCount = ref(limit.value);

const stylesMeta = computed(() => ({
  layout: ui.productListLayout.value
}));

const styles = useStyles(
  [
    "products",
    "products.main",
    "products.main.grid",
    "products.main.emptyState"
  ],
  stylesMeta,
  config
);

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
      lastProductCount.value = limit.value;
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
