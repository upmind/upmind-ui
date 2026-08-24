<template>
  <div
    :class="productsMainRootVariants()"
    role="main"
    aria-label="Product listing"
    v-bind="widgetGridTestAttrs"
    ref="container"
  >
    <!-- Search and controls -->
    <div :class="productsMainControlsVariants()">
      <Input
        size="lg"
        id="product-search"
        :model-value="query"
        :class="[productsMainSearchInputVariants(), 'flex-1']"
        :placeholder="t('form.product_name_search.placeholder')"
        aria-label="Search products"
        data-test-key="input-product-search"
        @update:model-value="doQuery"
        class="max-w-full lg:max-w-xl"
      >
        <template #leading><Icon icon="search-md" /></template>
      </Input>

      <div class="w-full shrink-0 md:w-auto">
        <ProductSort v-model:property="sortBy" v-model:direction="direction" />
      </div>
    </div>

    <!-- Products grid -->
    <section
      v-if="!meta.isEmpty || meta.isLoading"
      :class="productsMainGridRootVariants()"
    >
      <div
        :class="
          productsMainGridContainerVariants({
            layout: ui.productListLayout.value
          })
        "
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
        :total="pagination.total"
        :items-per-page="pagination.limit"
        :page="pagination.page"
        @update:page="onPageChange"
      >
        <template #info>
          <span class="text-muted text-sm">
            {{
              t("text.pagination_info", {
                page: pagination.page,
                pages: pagination.pages
              })
            }}
          </span>
        </template>
      </Pagination>
    </section>

    <!-- Empty state -->
    <section
      v-else
      :class="productsMainEmptyStateRootVariants()"
      role="status"
      aria-live="polite"
    >
      <Icon
        icon="search-md"
        size="xl"
        :class="productsMainEmptyStateIconVariants()"
      />
      <div>
        <h3 :class="productsMainEmptyStateTitleVariants()">
          {{ t("text.products_not_found") }}
        </h3>
        <p :class="productsMainEmptyStateDescriptionVariants()">
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
import { useTestAttrs } from "@upmind/ui";
import { Input } from "@upmind/ui";
import { Pagination } from "@upmind/ui";
import { Icon } from "../../../components/icon";
import {
  ProductCard,
  ProductCardSkeleton
} from "../../product/components/card";
import {
  productsMainRootVariants,
  productsMainControlsVariants,
  productsMainSearchInputVariants,
  productsMainGridRootVariants,
  productsMainGridContainerVariants,
  productsMainEmptyStateRootVariants,
  productsMainEmptyStateIconVariants,
  productsMainEmptyStateTitleVariants,
  productsMainEmptyStateDescriptionVariants
} from "../variants";
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

// New headless Pagination emits a target page; only Prev/Next are rendered, so
// the delta is ±1 — map it onto the composable's next/prev navigation.
function onPageChange(newPage: number) {
  if (newPage > pagination.value.page) doNextPage();
  else if (newPage < pagination.value.page) doPrevPage();
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
