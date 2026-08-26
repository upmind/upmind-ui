<template>
  <section :class="productsFacetRootVariants()">
    <Input
      v-model="query"
      :class="productsFacetSearchInputVariants()"
      :placeholder="t('form.category_search.placeholder')"
      size="lg"
    >
      <template #leading><Icon icon="search-md" /></template>
    </Input>

    <nav :class="productsFacetListRootVariants()">
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
import { Input } from "@upmind/ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "../../../../components/icon";
import {
  productsFacetRootVariants,
  productsFacetSearchInputVariants,
  productsFacetListRootVariants
} from "../../variants";
import CategoriesFacetDrillDown from "./CategoriesFacetDrillDown.vue";
import type { CategoriesProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<Omit<CategoriesProps, "modelValue">>();
const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");

// -----------------------------------------------------------------------------

const { t } = useI18n();

const query = ref("");
</script>
