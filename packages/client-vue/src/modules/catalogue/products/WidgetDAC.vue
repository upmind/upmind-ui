<template>
  <div
    :class="styles.products.main.root"
    role="main"
    aria-label="Product listing"
  >
    <Dac
      :id="`dac-${type}`"
      :key="`dac-${type}`"
      :complete="meta.showSelected"
      :disabled="!meta.isValid"
      :loading="meta.isSearching"
      :model-value="selected"
      :items="available"
      :selected="model"
      :more="meta.hasMoreSearchResults"
      :offset="pagination.offset"
      :processing="meta.isSyncing"
      @search="search"
      @search:more="searchMore"
      @update:selected="toggle"
      @remove="remove"
      @resolve="doResolve"
      @reject="reset"
      @reset="reset"
      :query="meta.showSelected ? selected : query"
      :type="type"
    />
  </div>
</template>

<script setup lang="ts">
// --- external

// --- internal
import {
  useDomain,
  RequestSortDirection,
  DomainTypes,
  useRoutingEngine,
  ROUTE
} from "@upmind-automation/headless";
import config from "../catalogue.config";

// --- components
import { useStyles } from "@upmind-automation/upmind-ui";

import Dac from "../../domain/components/Dac.vue";

// --- utils

// --- types
import type { ProductSortProps } from "./types";
import type { ComputedRef } from "vue";
import { isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------

// const categoryId = defineModel<ProductsProps["categoryId"]>("categoryId");

// const query = defineModel<ProductsProps["query"]>("query");

const direction = defineModel<ProductSortProps["direction"]>("direction", {
  default: RequestSortDirection.ASC
});

const { navigate } = useRoutingEngine();

const {
  type,
  selected,
  model,
  query,
  available,
  // ---
  meta,
  pagination,
  // ---
  search,
  searchMore,
  toggle,
  reset,
  addToBasket,
  remove
} = useDomain([], { type: DomainTypes.register });

// ---------------------------------------------------------------------------

// --- context

const styles = useStyles(
  [
    "products",
    "products.facets",
    "products.main",
    "products.main.grid",
    "products.main.emptyState"
  ],
  {},
  config
) as ComputedRef<{
  products: {
    root: string;
    facets: {
      root: string;
    };
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

//  --- side effects

// watch our props and update filters accordingly

// watch(query, filters.query, { immediate: true });

function doResolve() {
  if (!isEmpty(selected.value)) {
    addToBasket().then(() => {
      navigate(ROUTE.BASKET);
    });
  }
}
</script>
