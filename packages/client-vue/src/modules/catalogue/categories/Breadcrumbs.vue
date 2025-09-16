<template>
  <Breadcrumb :items="items" size="lg" />
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  ROUTE,
  useProductCategories,
  type ProductCategory
} from "@upmind-automation/headless";
import config from "../catalogue.config";

// --- components
import { Breadcrumb, useStyles } from "@upmind-automation/upmind-ui";

// --- types
import type { CategoriesProps } from "./types";
import type { ComputedRef } from "vue";
import { map } from "lodash-es";

// -----------------------------------------------------------------------------
const props = defineProps<Omit<CategoriesProps, "modelValue">>();
const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");

// -----------------------------------------------------------------------------

const { t } = useI18n();

const { getPath } = useProductCategories();

const items = computed(() => {
  const paths = getPath(modelValue.value);

  const items = [
    // include "root" option
    {
      label: t("product.shop"),
      current: !modelValue.value,
      to: {
        name: ROUTE.CATALOGUE,
        query: {
          sort: props.sort,
          direction: props.direction,
          catid: undefined
        }
      }
    },
    ...map(paths, (category: ProductCategory) => ({
      label: category.title,
      current: category.id === modelValue.value,
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

const styles = useStyles(
  ["categories", "categories.controls"],
  {},
  config
) as ComputedRef<{
  categories: {
    controls: {
      root: string;
      shareContainer: string;
      shareIcon: string;
    };
  };
}>;
</script>
