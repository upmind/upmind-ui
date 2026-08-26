<template>
  <section :class="productsFacetDrillDownItemsVariants()">
    <Button
      v-for="(category, index) in items"
      :key="`category-${index}`"
      as-child
      variant="ghost"
      size="lg"
      :class="
        cn([
          productsFacetDrillDownActionVariants(),
          category.current && 'bg-control-active-muted'
        ])
      "
    >
      <RouterLink :to="category.to" @click="category.handler">
        {{ category.label }}
        <Icon icon="chevron-right" />
      </RouterLink>
    </Button>
  </section>

  <Button
    v-if="parentCategory"
    as-child
    variant="outline"
    size="lg"
    :class="productsFacetDrillDownBackVariants()"
  >
    <RouterLink :to="parentCategory.to">
      <Icon icon="arrow-left" />
      {{ parentCategory.label }}
    </RouterLink>
  </Button>
</template>

<script setup lang="ts">
import { cn } from "@upmind/ui";
import { Button } from "@upmind/ui";
import { computed, inject } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
import { QUERY_PARAMS } from "@upmind-automation/headless";
import { Icon } from "../../../../components/icon";
import {
  productsFacetDrillDownItemsVariants,
  productsFacetDrillDownActionVariants,
  productsFacetDrillDownBackVariants
} from "../../variants";
import { map } from "lodash-es";
import type { CategoriesProps } from "../types";
import type { CategoriesFacetProps } from "../types";
import type {
  ProductCategory,
  UseProductCategories
} from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<CategoriesFacetProps>();
const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");

const useProductCategories = inject<UseProductCategories>(
  "useProductCategories"
);

const { t } = useI18n();

// -----------------------------------------------------------------------------

const filteredCategories = computed((): ProductCategory[] => {
  if (!props.query)
    return useProductCategories?.getChildren(modelValue.value) ?? [];

  return useProductCategories?.filter(props.query) ?? [];
});

const currentCategory = computed(() => {
  return useProductCategories?.getOne(modelValue.value ?? "");
});

const parentCategory = computed(() => {
  if (!modelValue.value) return;

  const parentId = useProductCategories?.getParent(modelValue.value);

  return {
    id: parentId,
    label: t("action.back"),
    to: {
      ...props.categoryRoute,
      query: {
        sort: props.sort,
        direction: props.direction,
        [QUERY_PARAMS.CATEGORY_ID]: parentId
      }
    }
  };
});

const createCategoryItem = (category: ProductCategory) => ({
  id: category.id,
  label: `${category.title} (${category.countDeep})`,
  current: category.id === modelValue.value,
  open: false,
  count: category.countDeep,
  to: {
    ...props.categoryRoute,
    query: {
      sort: props.sort,
      direction: props.direction,
      [QUERY_PARAMS.CATEGORY_ID]: category.id
    }
  },
  handler: () => {
    modelValue.value = category.id;
  }
});

const items = computed(() => {
  const items = map(filteredCategories.value, createCategoryItem);

  return currentCategory.value
    ? [createCategoryItem(currentCategory.value), ...items]
    : items;
});
</script>
