<template>
  <section :class="styles.products.facet.drillDown.items">
    <Button
      :as="RouterLink"
      v-for="(category, index) in items"
      :key="`category-${index}`"
      :to="category.to"
      variant="ghost"
      size="sm"
      :class="
        cn([
          styles.products.facet.drillDown.action,
          category.current && 'bg-control-active-muted'
        ])
      "
      @click="category.handler"
      :label="category.label"
    >
      <template #append>
        <Icon icon="chevron-right" size="2xs" />
      </template>
    </Button>
  </section>

  <Button
    v-if="modelValue"
    variant="outline"
    color="base"
    size="sm"
    :class="styles.products.facet.drillDown.back"
    :label="'Back'"
    @click="back"
  >
    <template #prepend>
      <Icon icon="arrow-left" size="3xs" />
    </template>
  </Button>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
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

const { filter, getChildren, getOne, getParent } = useProductCategories();

const { t } = useI18n();

const styles = useStyles(
  ["products.facet.drillDown"],
  {},
  config
) as ComputedRef<{
  products: {
    facet: {
      drillDown: {
        action: string;
        back: string;
        items: string;
      };
    };
  };
}>;

// -----------------------------------------------------------------------------

const filteredCategories = computed((): ProductCategory[] => {
  if (!props.query) return getChildren(modelValue.value);

  return filter(props.query, modelValue.value);
});

const currentCategory = computed(() => {
  return getOne(modelValue.value ?? "");
});

const parentCategory = computed(() => {
  return getParent(modelValue.value ?? "");
});

const createCategoryItem = (category: ProductCategory) => ({
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
});

const items = computed(() => {
  const items = map(filteredCategories.value, createCategoryItem);

  return currentCategory.value
    ? [createCategoryItem(currentCategory.value), ...items]
    : items;
});

const back = () => {
  if (parentCategory.value) {
    modelValue.value = parentCategory.value;
  } else {
    modelValue.value = undefined;
  }
};
</script>
