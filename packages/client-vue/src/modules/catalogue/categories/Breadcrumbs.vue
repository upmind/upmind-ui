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
  useBrand,
  useProductCategories,
  type ProductCategory,
  BreadcrumbVariant
} from "@upmind-automation/headless";
import config from "../catalogue.config";

// --- components
import { Breadcrumb, useStyles } from "@upmind-automation/upmind-ui";

// --- types
import type { CategoriesProps } from "./types";
import type { ComputedRef } from "vue";
import { map, compact, last } from "lodash-es";

// -----------------------------------------------------------------------------
const props = defineProps<Omit<CategoriesProps, "modelValue">>();
const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");

// -----------------------------------------------------------------------------

const { t } = useI18n();

const { getPath, getOne } = useProductCategories();
const { uiCart } = useBrand();

const items = computed(() => {
  const items: any[] = [];
  const paths = getPath(modelValue.value);
  const currentCategory = getOne(modelValue.value ?? "");
  const variant =
    currentCategory?.uiMeta?.uischema?.config?.breadcrumbs ||
    uiCart.value?.ui?.uischema?.config?.breadcrumbs ||
    BreadcrumbVariant.VISIBLE;

  if (variant === BreadcrumbVariant.HIDDEN) {
    return items;
  }

  // Storefront (for visible and condensed)
  if (variant !== BreadcrumbVariant.CATEGORY) {
    items.push({
      label: t("text.shop"),
      current: !modelValue.value,
      to: {
        name: ROUTE.CATALOGUE,
        query: {
          sort: props.sort,
          direction: props.direction,
          catid: undefined
        }
      }
    });
  }

  // For condensed, show ellipsis before the last category if there are multiple
  if (variant === BreadcrumbVariant.CONDENSED && paths.length > 1) {
    items.push({
      label: "..."
    });
  }

  // Categories
  const onlyLastCategory =
    variant === BreadcrumbVariant.CONDENSED ||
    variant === BreadcrumbVariant.CATEGORY;
  const categories = compact(onlyLastCategory ? [last(paths)] : paths);

  // Add category items
  items.push(
    ...map(categories, (category: ProductCategory) => ({
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
  );

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
