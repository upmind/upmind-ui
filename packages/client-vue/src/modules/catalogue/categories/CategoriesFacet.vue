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
        v-for="category in categoriesWithAll"
        :key="category.id || 'all'"
        variant="ghost"
        size="sm"
        :class="
          cn([
            styles.products.facet.list.button,
            modelValue === category.id && 'text-control-active'
          ])
        "
        @click="selectCategory(category.id)"
        :label="category.title"
      >
        <template #prepend>
          <Icon
            icon="chevron-right"
            :class="
              cn([
                styles.products.facet.list.icon,
                modelValue === category.id ? 'opacity-100' : 'opacity-0'
              ])
            "
          />
        </template>
        <template #append v-if="category.name != 'all'">
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

// -----------------------------------------------------------------------------

const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { data, getOne } = useProductCategories();

const query = ref("");

const categories = computed((): ProductCategory[] => {
  if (!data.value) return [];

  if (!modelValue.value) {
    return data.value;
  }

  return getOne(modelValue.value)?.categories || [];
});

const filteredCategories = computed((): ProductCategory[] => {
  if (!categories.value) return [];

  if (!query.value) return categories.value;

  return categories.value.filter(category =>
    category.title.toLowerCase().includes(query.value.toLowerCase())
  );
});

const categoriesWithAll = computed((): ProductCategory[] => {
  return [
    { id: "", name: "all", title: t("product.category.all") },
    ...filteredCategories.value
  ];
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
