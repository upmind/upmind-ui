<template>
  <Layout>
    <template v-if="categoryId" #controls>
      <CategoriesControls
        v-model="categoryId"
        @update:model-value="doCategory"
      />
    </template>
    <template #header>
      <Categories v-model="categoryId" @update:model-value="doCategory" />
    </template>

    <template #content>
      <Products
        v-model:category-id="categoryId"
        v-model:sort="sort"
        v-model:query="query"
        @update:category-id="doCategory"
        @update:sort="doSort"
        @update:query="doSearch"
      />
    </template>
  </Layout>
</template>

<script setup lang="ts">
// --- external
import { ref } from "vue";
import {
  useRoutingEngine,
  ROUTE,
  ProductSortableProperties,
  RequestSortDirection
} from "@upmind-automation/headless";
import { useUrlSearchParams } from "@vueuse/core";

// --- components
import CategoriesControls from "./categories/CategoriesControls.vue";
import Categories from "./categories/Categories.vue";
import Products from "./products/Products.vue";
import Layout from "../../components/layout/Layout.vue";
import type { ProductSortProps } from "./products/types";

// -----------------------------------------------------------------------------
const { isReady, isResolved } = useRoutingEngine();

const params = useUrlSearchParams("history", {
  writeMode: "push"
});

await isReady();
await isResolved(ROUTE.PRODUCT_ADD);

// --- state

const categoryId = ref<string | undefined>(params.catid as string);

const sort = ref<ProductSortProps | undefined>({
  property:
    (params.sort as ProductSortableProperties) ??
    ProductSortableProperties.DEFAULT,
  direction:
    (params.direction as RequestSortDirection) ?? RequestSortDirection.ASC
});

const query = ref<string | undefined>(params.search as string);

// ---

const doCategory = (value?: string) => {
  categoryId.value = value;
  params.catid = value ?? "";
  query.value = "";
  params.search = "";
};

const doSort = (value?: ProductSortProps) => {
  sort.value = value;
  params.sort = value?.property ?? ProductSortableProperties.DEFAULT;
  params.direction = value?.direction ?? RequestSortDirection.ASC;
};

const doSearch = (value?: string) => {
  query.value = value;
  params.search = value ?? "";
};

window.onpopstate = function () {
  categoryId.value = params.catid as string;
  sort.value = {
    property:
      (params.sort as ProductSortableProperties) ??
      ProductSortableProperties.DEFAULT,
    direction:
      (params.direction as RequestSortDirection) ?? RequestSortDirection.ASC
  };
  query.value = params.search as string;
};
</script>
