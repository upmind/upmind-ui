<template>
  <Breadcrumb
    :more-label="t('text.more')"
    v-if="breadcrumbItems.length"
    :items="breadcrumbItems"
    separator="/"
  >
    <template #item="{ crumb }">
      <Link
        v-if="(!crumb.to && !crumb.href) || crumb.current"
        class="hover:text-muted! text-faint cursor-default no-underline hover:opacity-100!"
        size="md"
        tabindex="-1"
        ><Icon :icon="crumb.icon" /> {{ crumb.label }}</Link
      >
      <Link
        v-else
        :to="crumb.to"
        :href="crumb.href"
        :size="crumb.icon ? 'sm' : 'md'"
        color="muted"
        @click="onCrumbSelect(crumb, $event)"
        ><Icon :icon="crumb.icon" /> {{ crumb.label }}</Link
      >
    </template>
  </Breadcrumb>
</template>

<script setup lang="ts">
import { inject } from "vue";
import { useI18n } from "vue-i18n";
import { useConfig } from "@upmind-automation/headless";
import { Link } from "@upmind/ui";
import { Breadcrumb } from "@upmind/ui";
import { Icon } from "../../../components/icon";
import { useBreadcrumbs } from "../../../composables/useBreadcrumbs";
import type { CategoriesProps } from "./types";
import type { UseProductCategories } from "@upmind-automation/headless";
import type { BreadcrumbVariant } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const props = defineProps<Omit<CategoriesProps, "modelValue">>();
const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");
// -----------------------------------------------------------------------------

const useProductCategories = inject<UseProductCategories>(
  "useProductCategories"
);

const { ui } = useConfig().with({
  category: () => useProductCategories?.getOne(modelValue.value ?? "")
});

const { items: breadcrumbItems } = useBreadcrumbs({
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

// Category crumbs select via the composable's handler (sets modelValue, which is
// the catid route query). Prevent the Link's own :to push so it can't clobber
// that with a different query key; crumbs without a handler (Shop) navigate via :to.
function onCrumbSelect(item: { handler?: () => void }, event: Event) {
  if (item.handler) {
    event.preventDefault();
    item.handler();
  }
}
</script>
