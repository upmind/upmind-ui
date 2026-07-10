<template>
  <div
    :class="styles.products.main.root"
    role="main"
    aria-label="Product listing"
    v-bind="widgetGridTestAttrs"
    ref="container"
  >
    <!-- Search and controls -->
    <div :class="styles.products.main.controls">
      <Input
        id="product-search"
        :model-value="query"
        :class="[styles.products.main.searchInput, 'flex-1']"
        :placeholder="t('form.product_name_search.placeholder')"
        :auto-focus="false"
        aria-label="Search products"
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
        v-bind="productsGridTestAttrs"
      >
        <!-- TODO: OR `loading` and `disabled` with the global `isNavigating`
             signal (sibling branch) to cover the click-to-route gap —
             basket-RPC settles before navigation lands, leaving a momentary
             spinner-off blip. -->
        <ProductCard
          v-if="!meta.isLoading"
          v-for="product in data"
          :loading="pendingMeta.isProcessing(product.id)"
          :disabled="pendingMeta.isProcessing()"
          :in-basket="pendingMeta.isInBasket(product.id)"
          :key="product.id"
          v-bind="product"
          :in-situ="keepsUserInSitu"
          :preserve-promotion="preservePromotions"
          :configure-route="catalogueConfigureRoute"
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
import { useUrlSearchParams } from "@vueuse/core";
import { watch, ref, computed, useTemplateRef, inject } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import {
  useProductCatalogue,
  useProductCategories,
  RequestSortDirection,
  ProductSortableProperties,
  DEBOUNCE_DELAY,
  useBasketProductsPending,
  useBrand,
  type UseProductCategories
} from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";
import {
  Input,
  Icon,
  Pagination,
  useStyles,
  useTestAttrs
} from "@upmind-automation/upmind-ui";
import {
  ProductCard,
  ProductCardSkeleton
} from "../../product/components/card";
import config from "../catalogue.config";
import ProductSort from "./components/ProductSort.vue";
import { debounce, isArray, isEmpty, merge, some } from "lodash-es";
import type { ProductSortProps, ProductsProps } from "./types";
import type { Product } from "@upmind-automation/headless";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

const props = defineProps<{
  configureRoute: RouteLocationAsRelativeGeneric;
}>();

const { meta: pendingMeta } = useBasketProductsPending();

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
const { keepsUserInSitu } = useBrand();
const router = useRouter();

const category = computed(() =>
  categoryId.value ? categoryInstance.getOne(categoryId.value) : undefined
);

const { ui } = useConfig().with({ category });

const catalogueConfigureRoute = computed(() => {
  if (!keepsUserInSitu.value) return props.configureRoute;
  return merge({}, props.configureRoute, {
    query: { returnUrl: router.currentRoute.value.fullPath }
  });
});

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

const { data, meta, pagination, nextPage, prevPage } = useProductCatalogue({
  // infinite: !!uiCart.value?.catalogue?.infinite, // TODO
  categoryId,
  search: query,
  sortBy,
  direction,
  pagination: {
    limit: limit.value,
    offset: (urlPage.value - 1) * limit.value
  }
});

// --- context
const widgetGridTestAttrs = useTestAttrs({ key: "widget-grid" });
const productsGridTestAttrs = useTestAttrs({ key: "products-grid" });

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
