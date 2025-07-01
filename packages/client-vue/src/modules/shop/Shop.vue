<template>
  <Layout>
    <template v-if="categoryId" #controls>
      <CategoriesControls
        :category-id="categoryId"
        @navigate="selectCategory"
      />
    </template>
    <template #header>
      <Categories :category-id="categoryId" @select="selectCategory" />
    </template>

    <template #content>
      <Products
        :category-id="categoryId"
        :facet-category-id="facetCategoryId"
        :sort-value="sortValue"
        :search-query="searchQuery"
        @facet-category-select="handleFacetCategorySelect"
        @sort-change="handleSortChange"
        @search-change="handleSearchChange"
      />
    </template>
  </Layout>
</template>

<script setup lang="ts">
// --- external
import { ref } from "vue";
import { useRoutingEngine, ROUTE } from "@upmind-automation/headless";
import { useUrlSearchParams } from "@vueuse/core";

// --- components
import CategoriesControls from "./categories/CategoriesControls.vue";
import Categories from "./categories/Categories.vue";
import Products from "./products/Products.vue";
import Layout from "../../components/layout/Layout.vue";
import { ProductSortType } from "./products/types";

const params = useUrlSearchParams("history");
const categoryId = ref<string>((params.catid as string) || "");
const facetCategoryId = ref<string | null>((params.fcatid as string) || null);
const sortValue = ref<string>(
  (params.sort as string) || ProductSortType.DEFAULT
);
const searchQuery = ref<string>((params.search as string) || "");

const { isReady, isResolved } = useRoutingEngine();
await isReady();
await isResolved(ROUTE.PRODUCT_ADD);

const selectCategory = (id?: string) => {
  const newId = id || "";
  categoryId.value = newId;

  params.catid = newId || (null as any);

  facetCategoryId.value = null;
  params.fcatid = null as any;

  searchQuery.value = "";
  params.search = null as any;
};

const handleFacetCategorySelect = (id: string | null) => {
  facetCategoryId.value = id;
  params.fcatid = id || (null as any);
};

const handleSortChange = (sort: string) => {
  sortValue.value = sort;
  params.sort = sort || (null as any);
};

const handleSearchChange = (search: string) => {
  searchQuery.value = search;
  params.search = search || (null as any);
};
</script>
