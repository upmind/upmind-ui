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

    <div :class="styles.products.facet.list.root">
      <CategoriesFacetDrillDown v-model="modelValue" :query="query" />
    </div>
  </section>
</template>

<script setup lang="ts">
// --- external
import { ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import config from "../../catalogue.config";

// --- components
import { InputExtended, Icon, useStyles } from "@upmind-automation/upmind-ui";
import CategoriesFacetDrillDown from "./CategoriesFacetDrillDown.vue";

// --- types
import type { CategoriesProps } from "../types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
defineProps<Omit<CategoriesProps, "modelValue">>();
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
</script>
