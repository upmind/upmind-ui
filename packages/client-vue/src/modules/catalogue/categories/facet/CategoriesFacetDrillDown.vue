<template>
  <section :class="styles.products.facet.drillDown.items">
    <Button
      v-for="(category, index) in items"
      :key="`category-${index}`"
      v-bind="category"
      variant="ghost"
      size="lg"
      :class="
        cn([
          styles.products.facet.drillDown.action,
          category.current && 'bg-control-active-muted'
        ])
      "
      @click="category.handler"
      :label="category.label"
      icon-append="chevron-right"
    />
  </section>

  <Button
    v-if="parentCategory"
    v-bind="parentCategory"
    variant="outline"
    size="lg"
    :class="styles.products.facet.drillDown.back"
    icon="arrow-left"
  >
  </Button>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";
import { useI18n } from "vue-i18n";
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

const { t } = useI18n();

const styles = useStyles(["products.facet.drillDown"], {}, config);

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
