<template>
  <div :class="styles.categories.root" v-auto-animate>
    <CategoriesHeader :category-id="categoryId" :category="currentCategory" />

    <section
      v-if="hasCategories"
      :class="styles.categories.grid"
      role="region"
      aria-label="Product categories"
      v-auto-animate
    >
      <CategoryItem
        v-for="category in displayCategories"
        :key="category.id"
        v-bind="category"
        :is-selected="category.id === categoryId"
        @category-selected="handleCategorySelect"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useProductCategories } from "@upmind-automation/headless";
import { isEmpty } from "lodash-es";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- config
import config from "../shop.config";

// --- types
import CategoriesHeader from "./CategoriesHeader.vue";
import CategoryItem from "./CategoryItem.vue";
import type { CategoriesProps } from "./types";
import type { ComputedRef } from "vue";

const props = defineProps<CategoriesProps>();
const emit = defineEmits<{
  select: [categoryId: string];
}>();

const { data, meta, getOne } = useProductCategories();

const displayCategories = computed(() => {
  if (!data.value) return [];

  if (!props.categoryId) {
    return data.value;
  }

  const parentCategory = getOne(props.categoryId);
  return parentCategory?.categories || [];
});

const currentCategory = computed(() => {
  return props.categoryId ? getOne(props.categoryId) : undefined;
});

const hasCategories = computed(() => {
  return !isEmpty(displayCategories.value) && !meta.value.isLoading;
});

const handleCategorySelect = (categoryId: string) => {
  emit("select", categoryId);
};

const styles = useStyles(["categories"], {}, config) as ComputedRef<{
  categories: {
    root: string;
    grid: string;
  };
}>;
</script>
