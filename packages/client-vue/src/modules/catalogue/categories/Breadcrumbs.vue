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
  BreadcrumbVariant,
  QUERY_PARAMS
} from "@upmind-automation/headless";
import config from "../catalogue.config";

// --- components
import { Breadcrumb, useStyles } from "@upmind-automation/upmind-ui";

// --- types
import type { CategoriesProps } from "./types";
import type { ComputedRef } from "vue";
import { map, last } from "lodash-es";

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

  // Storefront (for visible and condensed, or category)
  items.push({
    label: t("text.shop"),
    current: !modelValue.value,
    to: {
      name: ROUTE.CATALOGUE,
      query: {
        sort: props.sort,
        direction: props.direction,
        [QUERY_PARAMS.CATEGORY_ID]: undefined
      }
    }
  });

  // For condensed, show ellipsis before the last category if there are multiple
  if (variant === BreadcrumbVariant.CONDENSED && paths.length > 1) {
    items.push({
      label: "..."
    });
  }

  // Categories: show all for VISIBLE, parent for CONDENSED, last for CATEGORY
  if (variant === BreadcrumbVariant.VISIBLE) {
    items.push(
      ...map(paths, (category: ProductCategory) => ({
        label: category.title,
        current: category.id === modelValue.value,
        to: {
          name: ROUTE.CATALOGUE,
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
    );
  } else if (variant === BreadcrumbVariant.CONDENSED && paths.length > 1) {
    // CONDENSED shows parent (or last if no parent), CATEGORY shows last
    const category =
      variant === BreadcrumbVariant.CONDENSED && paths.length > 1
        ? paths[paths.length - 2]
        : last(paths);

    if (category) {
      items.push({
        label: category.title,
        current: category.id === modelValue.value,
        to: {
          name: ROUTE.CATALOGUE,
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
    }
  }

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
