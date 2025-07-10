<template>
  <Layout>
    <template #controls>
      <CategoriesControls v-model="categoryId" />
    </template>
    <template #header>
      <Categories v-model="categoryId" />
    </template>

    <div :class="styles.products.root">
      <nav :class="styles.products.facets.root" v-if="uiCart?.catalogue?.facet">
        <CategoriesFacet v-model="categoryId" />
      </nav>

      <component
        :is="widget"
        v-model:category-id="categoryId"
        v-model:sort="sortProperty"
        v-model:direction="sortDirection"
        v-model:query="query"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
// --- external
import { computed, type ComputedRef } from "vue";
import { useRouteQuery } from "@vueuse/router";
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
import { useStyles } from "@upmind-automation/upmind-ui";
import CategoriesControls from "./categories/CategoriesControls.vue";
import CategoriesFacet from "./categories/CategoriesFacet.vue";
import Categories from "./categories/Categories.vue";
import Layout from "../../components/layout/Layout.vue";
import WidgetGrid from "./products/WidgetGrid.vue";
import WidgetDAC from "./products/WidgetDAC.vue";

// --- types

// -----------------------------------------------------------------------------
const { isReady, isResolved } = useRoutingEngine();
const { uiCart } = useBrand();
const { findOne, dataFlattened } = useProductCategories();

await isReady();
await isResolved(ROUTE.PRODUCT_ADD);

// --- state

const categoryId = useRouteQuery<string | undefined>("catid", undefined, {
  mode: "push"
});

const sortProperty = useRouteQuery<ProductSortableProperties>(
  "sort",
  ProductSortableProperties.DEFAULT,
  { mode: "push" }
);
const sortDirection = useRouteQuery<RequestSortDirection | undefined>(
  "direction",
  RequestSortDirection.ASC,
  { mode: "push" }
);

const query = useRouteQuery<string | undefined>("search", undefined, {
  mode: "push"
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
