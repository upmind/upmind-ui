<template>
  <Breadcrumb :items="breadcrumbItems" :variant="breadcrumbVariant" size="lg" />
</template>

<script setup lang="ts">
// --- external
import { inject } from "vue";

// --- internal
import {
  useBrand,
  BreadcrumbVariant,
  type UseProductCategories
} from "@upmind-automation/headless";
import { useBreadcrumbs } from "../../../composables/useBreadcrumbs";

// --- components
import { Breadcrumb } from "@upmind-automation/upmind-ui";

// --- types
import type { CategoriesProps } from "./types";

// -----------------------------------------------------------------------------
const props = defineProps<Omit<CategoriesProps, "modelValue">>();
const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");
// -----------------------------------------------------------------------------

const useProductCategories = inject<UseProductCategories>(
  "useProductCategories"
);

const { uiCart } = useBrand();

const { items: breadcrumbItems, variant: breadcrumbVariant } = useBreadcrumbs({
  categories: () =>
    (useProductCategories?.getPath(modelValue.value) ?? []).map(c => ({
      id: c.id,
      label: c.title
    })),
  route: () => props.categoryRoute,
  variant: () =>
    useProductCategories?.getOne(modelValue.value ?? "")?.uiMeta?.uischema
      ?.config?.breadcrumbs ||
    uiCart.value?.ui?.uischema?.config?.breadcrumbs ||
    BreadcrumbVariant.VISIBLE,
  selectedId: modelValue,
  showLastCategory: false,
  queryParams: () => ({ sort: props.sort, direction: props.direction }),
  onSelect: category => {
    modelValue.value = category.id;
  }
});
</script>
