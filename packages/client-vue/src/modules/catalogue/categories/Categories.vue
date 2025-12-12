<template>
  <div :class="styles.categories.root" v-auto-animate>
    <CategoriesHeader
      v-model="modelValue"
      v-bind="{ ...props, ...currentCategory }"
    >
      <template #prepend>
        <slot name="prepend" />
      </template>
      <template #append>
        <slot name="append" />
      </template>
    </CategoriesHeader>

    <nav
      v-if="!isFaceted && hasCategories"
      :class="styles.categories.grid"
      role="region"
      aria-label="Product categories"
      v-auto-animate
    >
      <CategoryItem
        v-for="category in displayCategories"
        :key="category.id"
        v-bind="{ ...props, ...category }"
        v-model="modelValue"
      />
    </nav>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed, inject, provide } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import {
  useProductCategories,
  type ProductCategory,
  type UseProductCategories
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
  Omit<CategoriesProps, "modelValue"> & ProductCategory & { isFaceted: boolean }
>();
const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");

// -----------------------------------------------------------------------------
const instance =
  inject<UseProductCategories>("useProductCategories") ??
  useProductCategories(); // in case we dont have a provided instance, create one

provide("useProductCategories", instance);
const { getChildren, getOne, meta } = instance;

const currentCategory = computed(() => {
  return modelValue.value ? getOne(modelValue.value) : props;
});

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
