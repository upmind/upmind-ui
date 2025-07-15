<template>
  <Button
    as="router-link"
    v-for="(category, index) in items"
    :key="`category-${index}`"
    :to="category.to"
    variant="ghost"
    size="sm"
    :class="
      cn([
        styles.products.facet.drillDown.button,
        category.current && 'bg-control-active-muted'
      ])
    "
    @click="category.handler"
    :label="category.label"
    block
  >
    <template #append>
      <Icon icon="chevron-right" size="2xs" />
    </template>
  </Button>

  <p v-if="isEmpty(items)" class="text-emphasis-medium p-4 text-center text-sm">
    {{ t("product.category.empty") }}
  </p>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { ROUTE, useProductCategories } from "@upmind-automation/headless";
import config from "../../catalogue.config";

// --- components
import { Icon, Button, cn, useStyles } from "@upmind-automation/upmind-ui";

// --- utils
import { isEmpty, map } from "lodash-es";

// --- types
import type { ProductCategory } from "@upmind-automation/headless";
import type { CategoriesProps } from "../types";
import type { ComputedRef } from "vue";
import type { CategoriesFacetProps } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<CategoriesFacetProps>();
const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");

const { filter, getChildren } = useProductCategories();

const { t } = useI18n();

const styles = useStyles(
  ["products.facet.drillDown"],
  {},
  config
) as ComputedRef<{
  products: {
    facet: {
      drillDown: {
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
  return map(filteredCategories.value, (category: ProductCategory) => ({
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
  }));
});
</script>
