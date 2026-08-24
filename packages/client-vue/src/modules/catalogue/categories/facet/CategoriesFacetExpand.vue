<template>
  <Button
    v-for="(category, index) in items"
    :key="`category-${index}`"
    as-child
    variant="ghost"
    size="lg"
    :class="
      cn([
        productsFacetExpandButtonVariants(),
        category.current && 'bg-control-active-muted'
      ])
    "
    block
  >
    <RouterLink :to="category.to" @click="category.handler">
      {{ category.label }}
      <Icon icon="chevron-down" />
    </RouterLink>
  </Button>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";
import { RouterLink } from "vue-router";
import { QUERY_PARAMS } from "@upmind-automation/headless";
import { cn } from "@upmind/ui";
import { Button } from "@upmind/ui";
import { Icon } from "../../../../components/icon";
import { productsFacetExpandButtonVariants } from "../../variants";
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

// -----------------------------------------------------------------------------

const filteredCategories = computed((): ProductCategory[] => {
  if (!props.query)
    return useProductCategories?.getChildren(modelValue.value) ?? [];

  return useProductCategories?.filter(props.query, modelValue.value) ?? [];
});

const items = computed(() => {
  const paths = useProductCategories?.getPath(modelValue.value);

  const items = [
    // include "root" option
    // {
    //   id: 0,
    //   label: t("text.categories"),
    //   current: !modelValue.value,
    //   open: false,
    //   count: 0,
    //   handler: () => {
    //     modelValue.value = undefined;
    //   },
    //   to: {
    //     ...props.categoryRoute,
    //     query: {
    //       sort: props.sort,
    //       direction: props.direction,
    //       [QUERY_PARAMS.CATEGORY_ID]: undefined
    //     }
    //   }
    // },
    // include parent categories
    ...map(paths, (parentCategory: ProductCategory) => ({
      label: `${parentCategory.title} (${parentCategory.countDeep})`,
      current: parentCategory.id === modelValue.value,
      open: parentCategory.id !== modelValue.value,
      count: parentCategory.countDeep,
      to: {
        ...props.categoryRoute,
        query: {
          sort: props.sort,
          direction: props.direction,
          [QUERY_PARAMS.CATEGORY_ID]: parentCategory.id
        }
      },
      handler: () => {
        modelValue.value = parentCategory.id;
      }
    })),
    // include current category and its children
    ...map(filteredCategories.value, (category: ProductCategory) => ({
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
    }))
  ];

  return items;
});
</script>
