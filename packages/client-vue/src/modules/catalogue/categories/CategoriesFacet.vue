<template>
  <section :class="styles.products.facet.root">
    <InputExtended
      v-model="query"
      :class="styles.products.facet.search.input"
      :placeholder="t('product.category.search')"
      input-size="sm"
      :auto-focus="false"
    >
      <template #prepend>
        <Icon
          icon="search"
          size="2xs"
          :class="styles.products.facet.search.icon"
        />
      </template>
    </InputExtended>

    <div :class="styles.products.facet.list">
      <Button
        v-for="(category, index) in items"
        :key="`category-${index}`"
        variant="ghost"
        size="sm"
        :class="
          cn([
            styles.products.facet.list.button,
            category.current && 'text-control-active'
          ])
        "
        @click="category.handler"
        :label="category.label"
      >
        <template #prepend>
          <Icon
            icon="chevron-right"
            :class="
              cn([
                styles.products.facet.list.icon,
                category.current || category.open ? 'opacity-100' : 'opacity-0',
                category.open ? '-rotate-90' : ''
              ])
            "
          />
        </template>
        <template #append v-if="category.count">
          ({{ category.count }})
        </template>
      </Button>
    </div>
  </section>
</template>

<script setup lang="ts">
// --- external
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  ROUTE,
  useProductCategories,
  type ProductCategory
} from "@upmind-automation/headless";
import config from "../catalogue.config";

// --- components
import {
  InputExtended,
  Icon,
  Button,
  useStyles,
  cn
} from "@upmind-automation/upmind-ui";

// --- types
import type { CategoriesProps } from "./types";
import type { ComputedRef } from "vue";
import { map } from "lodash-es";

// -----------------------------------------------------------------------------

const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { filter, getChildren, getPath } = useProductCategories();

const query = ref("");

const displayCategories = computed(() => {
  return getChildren(modelValue.value);
});

const items = computed(() => {
  const paths = getPath(modelValue.value);

  const items = [
    // include "All" option
    {
      id: 0,
      label: t("product.category.all"),
      current: !modelValue.value,
      open: false,
      count: 0,
      handler: () => {
        modelValue.value = undefined;
      },
      to: {
        name: ROUTE.CATALOGUE
      }
    },
    // include parent categories
    ...map(paths, (parentCategory: ProductCategory) => ({
      label: parentCategory.title,
      current: parentCategory.id === modelValue.value,
      open: parentCategory.id !== modelValue.value,
      count: parentCategory.countDeep,
      to: {
        name: ROUTE.CATALOGUE,
        query: { catId: parentCategory.id }
      },
      handler: () => {
        modelValue.value = parentCategory.id;
      }
    })),
    // include current category and its children
    ...map(filteredCategories.value, (category: ProductCategory) => ({
      id: category.id,
      label: category.title,
      current: category.id === modelValue.value,
      open: false,
      count: category.countDeep,
      to: {
        name: ROUTE.CATALOGUE,
        query: { catId: category.id }
      },
      handler: () => {
        modelValue.value = category.id;
      }
    }))
  ];

  return items;
});

const filteredCategories = computed((): ProductCategory[] => {
  if (!query.value) return displayCategories.value;

  return filter(query.value, modelValue.value);
});

const styles = useStyles(
  [
    "products",
    "products.facet",
    "products.facet.list",
    "products.facet.search"
  ],
  {},
  config
) as ComputedRef<{
  products: {
    facet: {
      root: string;
      search: {
        input: string;
        icon: string;
      };
      list: {
        root: string;
        button: string;
        icon: string;
      };
    };
  };
}>;

// --- methods
function selectCategory(value: string) {
  modelValue.value = value;
}
</script>
