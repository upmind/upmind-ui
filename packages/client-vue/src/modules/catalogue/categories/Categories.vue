<template>
  <div :class="styles.categories.root" v-auto-animate>
    <CategoriesHeader v-model="modelValue" v-bind="props" />

    <nav
      v-if="hasCategories && !uiCart?.catalogue?.facet"
      :class="styles.categories.grid"
      role="region"
      aria-label="Product categories"
      v-auto-animate
    >
      <CategoryItem
        v-for="category in displayCategories"
        :key="category.id"
        v-bind="category"
        v-model="modelValue"
        :sort="props.sort"
        :direction="props.direction"
      />
    </nav>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import {
  useBrand,
  useProductCategories,
  type ProductCategory
} from "@upmind-automation/headless";
import { isEmpty } from "lodash-es";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../catalogue.config";

// --- components
import CategoriesHeader from "./CategoriesHeader.vue";
import CategoryItem from "./CategoryItem.vue";

// --- types
import type { CategoriesProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps<
  Omit<CategoriesProps, "modelValue"> & ProductCategory
>();
const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");

// -----------------------------------------------------------------------------

const { uiCart } = useBrand();
const { getChildren, meta } = useProductCategories();

const displayCategories = computed(() => {
  return getChildren(modelValue.value);
});

const hasCategories = computed(() => {
  return !isEmpty(displayCategories.value) && !meta.value.isLoading;
});

const styles = useStyles(["categories"], {}, config) as ComputedRef<{
  categories: {
    root: string;
    grid: string;
  };
}>;
</script>
