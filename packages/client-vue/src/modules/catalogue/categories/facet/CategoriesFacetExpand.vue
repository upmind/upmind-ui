<template>
  <Button
    :as="RouterLink"
    v-for="(category, index) in items"
    :key="`category-${index}`"
    :to="category.to"
    variant="ghost"
    :class="
      cn([
        styles.products.facet.expand.button,
        category.current && 'bg-control-active-muted'
      ])
    "
    @click="category.handler"
    :label="category.label"
    block
  >
    <template #append>
      <Icon icon="chevron-down" size="2xs" />
    </template>
  </Button>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { RouterLink } from "vue-router";

// --- internal
import { ROUTE, useProductCategories } from "@upmind-automation/headless";
import config from "../../catalogue.config";

// --- components
import { Icon, Button, cn, useStyles } from "@upmind-automation/upmind-ui";

// --- utils
import { map } from "lodash-es";

// --- types
import type { ProductCategory } from "@upmind-automation/headless";
import type { CategoriesProps } from "../types";
import type { ComputedRef } from "vue";
import type { CategoriesFacetProps } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<CategoriesFacetProps>();
const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");

const { filter, getChildren, getPath } = useProductCategories();

const styles = useStyles(
  ["products.facet.drillDown"],
  {},
  config
) as ComputedRef<{
  products: {
    facet: {
      expand: {
        button: string;
      };
    };
  };
}>;

// -----------------------------------------------------------------------------

const filteredCategories = computed((): ProductCategory[] => {
  if (!props.query) return getChildren(modelValue.value);

  return filter(props.query, modelValue.value);
});

const items = computed(() => {
  const paths = getPath(modelValue.value);

  const items = [
    // include "root" option
    // {
    //   id: 0,
    //   label: t("product.category.all"),
    //   current: !modelValue.value,
    //   open: false,
    //   count: 0,
    //   handler: () => {
    //     modelValue.value = undefined;
    //   },
    //   to: {
    //     name: ROUTE.CATALOGUE,
    //     query: {
    //       sort: props.sort,
    //       direction: props.direction,
    //       catid: undefined
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
        name: ROUTE.CATALOGUE,
        query: {
          sort: props.sort,
          direction: props.direction,
          catid: parentCategory.id
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
        name: ROUTE.CATALOGUE,
        query: {
          sort: props.sort,
          direction: props.direction,
          catid: category.id
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
