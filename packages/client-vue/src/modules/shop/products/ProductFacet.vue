<template>
  <section :class="styles.products.facet.root">
    <InputExtended
      v-model="searchQuery"
      :class="styles.products.facet.searchInput"
      :placeholder="t('product.category.search')"
      input-size="sm"
      :auto-focus="false"
    >
      <template #prepend>
        <Icon
          icon="search"
          size="2xs"
          :class="styles.products.facet.searchIcon"
        />
      </template>
    </InputExtended>

    <div :class="styles.products.facet.categoryList">
      <Button
        v-for="category in categoriesWithAll"
        :key="category.id || 'all'"
        variant="ghost"
        size="sm"
        :class="
          cn([
            styles.products.facet.categoryButton,
            selectedCategoryId === category.id && 'text-control-active'
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
                styles.products.facet.categoryIcon,
                selectedCategoryId === category.id ? 'opacity-100' : 'opacity-0'
              ])
            "
          />
        </template>
      </Button>
    </div>
  </section>
</template>

<script setup lang="ts">
// --- external
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useProductCategories } from "@upmind-automation/headless";

// --- components
import {
  InputExtended,
  Icon,
  Button,
  useStyles,
  cn
} from "@upmind-automation/upmind-ui";

// --- config
import config from "../shop.config";

// --- types
import type { FacetProps } from "./types";
import type { ComputedRef } from "vue";

const props = defineProps<FacetProps>();

const emit = defineEmits<{
  categorySelected: [categoryId: string | null];
}>();

const { t } = useI18n();

const searchQuery = ref("");

const selectedCategoryId = computed({
  get: () => props.selectedCategoryId || null,
  set: value => {
    emit("categorySelected", value);
  }
});

const { data, getOne } = useProductCategories();

const categories = computed(() => {
  if (!data.value) return [];

  if (!props.categoryId) {
    return data.value;
  }

  return getOne(props.categoryId)?.categories || [];
});

const filteredCategories = computed(() => {
  if (!categories.value) return [];

  if (!searchQuery.value) return categories.value;

  return categories.value.filter(category =>
    category.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const categoriesWithAll = computed(() => {
  return [
    { id: null, title: t("product.category.all") },
    ...filteredCategories.value
  ];
});

const selectCategory = (categoryId: string | null) => {
  selectedCategoryId.value = categoryId;
};

const styles = useStyles(
  ["products", "products.facet"],
  {},
  config
) as ComputedRef<{
  products: {
    facet: {
      root: string;
      searchInput: string;
      searchIcon: string;
      categoryList: string;
      categoryButton: string;
      categoryIcon: string;
    };
  };
}>;
</script>
