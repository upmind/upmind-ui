<template>
  <Breadcrumb :items="breadcrumbItems" :variant="breadcrumbVariant" size="lg" />
</template>

<script setup lang="ts">
import { inject } from "vue";
import { useConfig } from "@upmind-automation/headless";
import { Breadcrumb } from "@upmind-automation/upmind-ui";
import { useBreadcrumbs } from "../../../composables/useBreadcrumbs";
import type { CategoriesProps } from "./types";
import type { UseProductCategories } from "@upmind-automation/headless";
import type { BreadcrumbVariant } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
const props = defineProps<Omit<CategoriesProps, "modelValue">>();
const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");
// -----------------------------------------------------------------------------

const useProductCategories = inject<UseProductCategories>(
  "useProductCategories"
);

const { ui } = useConfig().with({
  category: () => useProductCategories?.getOne(modelValue.value ?? "")
});

const { items: breadcrumbItems, variant: breadcrumbVariant } = useBreadcrumbs({
  categories: () =>
    (useProductCategories?.getPath(modelValue.value) ?? []).map(c => ({
      id: c.id,
      label: c.title
    })),
  route: () => props.categoryRoute,
  variant: () => ui.breadcrumbs.value as BreadcrumbVariant,
  selectedId: modelValue,
  showLastCategory: false,
  queryParams: () => ({ sort: props.sort, direction: props.direction }),
  onSelect: category => {
    modelValue.value = category.id;
  }
});
</script>
