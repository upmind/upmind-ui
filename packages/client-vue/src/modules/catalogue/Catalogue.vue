<template>
  <Layout :variant="uiCart?.layout" :minimal="isMinimal">
    <template #controls>
      <Breadcrumbs
        v-model="categoryId"
        :sort="params.sort"
        :direction="params.direction"
      />
    </template>

    <template #actions>
      <Share class="hidden md:flex" />
    </template>

    <template #header>
      <Categories
        v-model="categoryId"
        :sort="params.sort"
        :direction="params.direction"
        :description="description"
        v-bind="category"
      />
    </template>

    <div :class="styles.products.root">
      <aside :class="styles.products.facets.root" v-if="isFaceted">
        <CategoriesFacet
          v-model="categoryId"
          :sort="params.sort"
          :direction="params.direction"
        />
      </aside>

      <component
        :is="widget"
        v-model:categoryId="categoryId"
        v-model:sort="params.sort"
        v-model:direction="params.direction"
        v-model:query="params.query"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useRouteQuery } from "@vueuse/router";
import { useUrlSearchParams } from "@vueuse/core";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useProductCategories,
  useBrand,
  useRoutingEngine,
  ROUTE,
  ProductSortableProperties,
  RequestSortDirection
} from "@upmind-automation/headless";
import config from "./catalogue.config";

// --- components
import { Layout, useStyles } from "@upmind-automation/upmind-ui";
import Breadcrumbs from "./categories/Breadcrumbs.vue";
import Share from "../../components/navigation/Share.vue";
import CategoriesFacet from "./categories/facet/CategoriesFacet.vue";
import Categories from "./categories/Categories.vue";
import WidgetGrid from "./products/WidgetGrid.vue";
import WidgetDAC from "./products/WidgetDAC.vue";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { ProductCategory } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
const { isReady, isResolved } = useRoutingEngine();
const { uiCart } = useBrand();
const { findOne, getOne } = useProductCategories();

await isReady();
await isResolved(ROUTE.PRODUCT_ADD);

const { t } = useI18n();

// --- state
const isFaceted = computed(() => {
  return !!uiCart.value?.catalogue?.facet;
});

const isMinimal = computed(() => {
  return !description.value;
});

const categoryId = useRouteQuery<string | undefined>("catid", undefined, {
  mode: "push"
});

const params = useUrlSearchParams<{
  sort?: ProductSortableProperties;
  direction?: RequestSortDirection;
  query?: string;
}>("history", {
  removeNullishValues: true,
  removeFalsyValues: true
});

// --- category logic moved from Categories
const category = computed((): ProductCategory => {
  const category = categoryId.value ? getOne(categoryId.value) : undefined;
  return category || { id: "", name: "", title: t("product.category.all") };
});

const description = computed(() => {
  return (
    category.value.description ||
    (isEmpty(categoryId.value) && uiCart.value?.description) ||
    ""
  );
});

// --- context

const widget = computed(() => {
  //  if we have a category, we need to check its uiMeta to determine the widget to use
  if (categoryId.value) {
    const category = findOne({ id: categoryId.value });
    if (category?.uiMeta?.widgets?.dac) return WidgetDAC;
  }

  // our default widget
  return WidgetGrid;
});

const styles = useStyles(
  ["products", "products.facets"],
  {},
  config
) as ComputedRef<{
  products: {
    root: string;
    facets: {
      root: string;
    };
  };
}>;
</script>
