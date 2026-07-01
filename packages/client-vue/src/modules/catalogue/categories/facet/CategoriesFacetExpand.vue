<template>
  <Button
    v-for="(category, index) in items"
    :key="`category-${index}`"
    :to="category.to"
    variant="ghost"
    size="lg"
    :class="
      cn([
        styles.products.facet.expand.button,
        category.current && 'bg-control-active-muted'
      ])
    "
    @click="category.handler"
    :label="category.label"
    block
    icon-append="chevron-down"
  />
</template>

<script setup lang="ts">
import { computed, inject } from "vue";
import { QUERY_PARAMS } from "@upmind-automation/headless";
import { Button, cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "../../catalogue.config";
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

const styles = useStyles(["products.facet.drillDown"], {}, config);

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
