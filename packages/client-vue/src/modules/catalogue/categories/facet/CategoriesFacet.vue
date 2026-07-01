<template>
  <section :class="styles.products.facet.root">
    <Input
      v-model="query"
      :class="styles.products.facet.search.input"
      :placeholder="t('form.category_search.placeholder')"
      :auto-focus="false"
      icon="search-md"
      size="lg"
    />

    <nav :class="styles.products.facet.list.root">
      <CategoriesFacetDrillDown
        v-model="modelValue"
        :query="query"
        :sort="props.sort"
        :direction="props.direction"
        :category-route="props.categoryRoute"
        :name="props.name"
      />
    </nav>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { Input, useStyles } from "@upmind-automation/upmind-ui";
import config from "../../catalogue.config";
import CategoriesFacetDrillDown from "./CategoriesFacetDrillDown.vue";
import type { CategoriesProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<Omit<CategoriesProps, "modelValue">>();
const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");

// -----------------------------------------------------------------------------

const { t } = useI18n();

const query = ref("");

const styles = useStyles(
  [
    "products",
    "products.facet",
    "products.facet.list",
    "products.facet.search"
  ],
  {},
  config
);
</script>
