<template>
  <div :class="styles.categories.root" v-auto-animate>
    <CategoriesHeader v-model="modelValue" v-bind="category" />

    <nav
      v-if="hasCategories && !uiCart?.catalog?.facet"
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
      />
    </nav>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import {
  useBrand,
  useProductCategories,
  type ProductCategory
} from "@upmind-automation/headless";
import { isEmpty } from "lodash-es";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../shop.config";

// --- components
import CategoriesHeader from "./CategoriesHeader.vue";
import CategoryItem from "./CategoryItem.vue";

// --- types
import type { CategoriesProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");
// -----------------------------------------------------------------------------

const { t } = useI18n();
const { uiCart } = useBrand();
const { data, meta, getOne } = useProductCategories();

const displayCategories = computed(() => {
  if (!data.value) return [];

  if (!modelValue.value) {
    return data.value;
  }

  const parentCategory = getOne(modelValue.value);
  return parentCategory?.categories || [];
});

const category = computed((): ProductCategory => {
  const category = modelValue.value ? getOne(modelValue.value) : undefined;
  return category || { id: "", name: "", title: t("product.category.all") };
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
