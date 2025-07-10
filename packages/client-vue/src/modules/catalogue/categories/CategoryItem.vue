<template>
  <Button
    as="router-link"
    :to="{
      name: ROUTE.CATALOGUE,
      params: {
        catid: id
      }
    }"
    variant="outlined"
    color="secondary"
    :class="styles.categories.item.root"
    :aria-label="t('product.category.select', { name })"
    @click="doSelect"
  >
    <Icon
      v-if="categoryIcon"
      :icon="categoryIcon"
      size="xs"
      :class="styles.categories.item.icon"
    />

    <div :class="styles.categories.item.content">
      <h3 :class="styles.categories.item.titleContainer">
        <span :class="styles.categories.item.title">{{ name }}</span>
        <Icon
          icon="arrow-right"
          size="xs"
          :class="styles.categories.item.arrowIcon"
        />
      </h3>

      <p v-if="description" :class="styles.categories.item.description">
        {{ description }}
      </p>
    </div>
  </Button>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import config from "../catalogue.config";

// --- components
import { Icon, Button, useStyles } from "@upmind-automation/upmind-ui";

// --- types
import { ROUTE, type ProductCategory } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";
import type { CategoriesProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<ProductCategory>();

const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");
// -----------------------------------------------------------------------------

const { t } = useI18n();

const categoryIcon = computed(() => {
  return props.uiMeta?.uischema?.icon;
});

const doSelect = () => {
  modelValue.value = props.id;
};

const meta = computed(() => {
  return {
    isSelected: modelValue.value === props.id
  };
});

const styles = useStyles(
  ["categories", "categories.item"],
  meta,
  config
) as ComputedRef<{
  categories: {
    item: {
      root: string;
      icon: string;
      content: string;
      titleContainer: string;
      title: string;
      arrowIcon: string;
      description: string;
    };
  };
}>;
</script>
