<template>
  <div :class="styles.categories.root" v-auto-animate>
    <CategoriesHeader
      v-bind="{ ...props, ...currentCategory }"
      :description="props.description"
      :badge="props.badge"
    >
      <template #prepend>
        <slot name="prepend" />
      </template>
      <template #append>
        <slot name="append" />
      </template>
    </CategoriesHeader>

    <nav
      v-if="!isFaceted && (hasCategories || meta.isLoading)"
      :class="styles.categories.grid"
      role="region"
      aria-label="Product categories"
    >
      <template v-if="meta.isLoading">
        <div
          v-for="n in 6"
          :key="`skeleton-${n}`"
          class="bg-core-surface before:border-surface relative z-10 flex flex-col gap-4 p-8 before:absolute before:-inset-px before:-z-10 before:border before:border-solid before:content-['']"
        >
          <div class="text-muted flex items-center justify-between gap-2">
            <Skeleton class="h-7 w-32" />
            <Icon icon="arrow-right" size="2xs" />
          </div>
          <div class="flex flex-col gap-2">
            <Skeleton class="h-4 w-3/4" />
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-5/6" />
          </div>
        </div>
      </template>
      <template v-else>
        <CategoryItem
          v-for="category in displayCategories"
          :key="category.id"
          v-bind="{ ...props, ...category }"
          :excerpt="ui.categoryExcerpt.isVisible ? category.excerpt : ''"
          :badge="ui.categoryBadge.isVisible ? data.categoryBadge : undefined"
          v-model="modelValue"
        />
      </template>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { vAutoAnimate } from "@formkit/auto-animate";
import { computed, inject, provide } from "vue";
import {
  useProductCategories,
  type UseProductCategories
} from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";
import { useStyles, Skeleton } from "@upmind-automation/upmind-ui";
import { Icon } from "@upmind-automation/upmind-ui";
import config from "../catalogue.config";
import CategoriesHeader from "./CategoriesHeader.vue";
import CategoryItem from "./CategoryItem.vue";
import { isEmpty } from "lodash-es";
import type { CategoriesProps, CategoriesItemProps } from "./types";

// -----------------------------------------------------------------------------
const props = defineProps<CategoriesItemProps>();
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

const { ui, data } = useConfig().with({ category: currentCategory });

const styles = useStyles(
  ["categories"],
  computed(() => ({ layout: ui.categoryListLayout.value })),
  config
);
</script>
