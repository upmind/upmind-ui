<template>
  <Layout>
    <template #controls>
      <CategoriesControls
        v-model="categoryId"
        :sort="params.sort"
        :direction="params.direction"
      />
    </template>

    <template #header>
      <Categories
        v-model="categoryId"
        :sort="params.sort"
        :direction="params.direction"
      />
    </template>

    <div :class="styles.products.root">
      <nav :class="styles.products.facets.root" v-if="isFaceted">
        <CategoriesFacet
          v-model="categoryId"
          :sort="params.sort"
          :direction="params.direction"
        />
      </nav>

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
import CategoriesControls from "./categories/CategoriesControls.vue";
import CategoriesFacet from "./categories/facet/CategoriesFacet.vue";
import Categories from "./categories/Categories.vue";
import WidgetGrid from "./products/WidgetGrid.vue";
import WidgetDAC from "./products/WidgetDAC.vue";

// --- types
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const { isReady, isResolved } = useRoutingEngine();
const { uiCart } = useBrand();
const { findOne } = useProductCategories();

await isReady();
await isResolved(ROUTE.PRODUCT_ADD);

// --- state
const isFaceted = computed(() => {
  return !!uiCart.value?.catalogue?.facet;
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
