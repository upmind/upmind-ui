<template>
  <Layout no-default>
    <template v-if="categoryId" #controls>
      <CategoriesControls
        v-model="categoryId"
        @update:model-value="doCategory"
      />
    </template>
    <template #header>
      <Categories v-model="categoryId" @update:model-value="doCategory" />
    </template>

    <div :class="styles.products.root">
      <nav :class="styles.products.facets.root" v-if="uiCart?.catalogue?.facet">
        <CategoriesFacet
          v-model="categoryId"
          @update:model-value="doCategory"
        />
      </nav>

      <component
        :is="widget"
        v-model:category-id="categoryId"
        v-model:sort="sorting.property"
        v-model:direction="sorting.direction"
        v-model:query="query"
        @update:category-id="doCategory"
        @update:sort="doSort"
        @update:direction="doSort"
        @update:query="doSearch"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
// --- external
import { computed, ref, type ComputedRef } from "vue";
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
import { useStyles } from "@upmind-automation/upmind-ui";
import CategoriesControls from "./categories/CategoriesControls.vue";
import CategoriesFacet from "./categories/CategoriesFacet.vue";
import Categories from "./categories/Categories.vue";
import Layout from "../../components/layout/Layout.vue";
import WidgetGrid from "./products/WidgetGrid.vue";
import WidgetDAC from "./products/WidgetDAC.vue";

// --- types
import type { ProductSortProps } from "./products/types";

// -----------------------------------------------------------------------------
const { isReady, isResolved } = useRoutingEngine();
const { uiCart } = useBrand();
const { findOne } = useProductCategories();

const params = useUrlSearchParams("history", {
  writeMode: "push",
  removeFalsyValues: true,
  removeNullishValues: true
});

await isReady();
await isResolved(ROUTE.PRODUCT_ADD);

// --- state

const categoryId = ref<string | undefined>(params.catid as string);

const sorting = ref<ProductSortProps>({
  property:
    (params.sort as ProductSortableProperties) ??
    ProductSortableProperties.DEFAULT,
  direction:
    (params.direction as RequestSortDirection) ?? RequestSortDirection.ASC
});

const query = ref<string | undefined>(params.search as string);

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

// --- methods

function doCategory() {
  params.catid = categoryId.value ?? "";
  query.value = "";
  params.search = "";
}

function doSort() {
  params.sort = sorting.value.property ?? "";
  params.direction = sorting.value.direction ?? "";
}

function doSearch() {
  params.search = query.value ?? "";
}

// --- side effects

window.onpopstate = function () {
  categoryId.value = params.catid as string;
  sorting.value = {
    property:
      (params.sort as ProductSortableProperties) ??
      ProductSortableProperties.DEFAULT,
    direction:
      (params.direction as RequestSortDirection) ?? RequestSortDirection.ASC
  };
  query.value = params.search as string;
};
</script>
