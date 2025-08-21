<template>
  <Button
    :as="RouterLink"
    variant="outline"
    color="base"
    :class="styles.categories.item.root"
    :aria-label="t('product.category.select', { name })"
    :to="{
      name: ROUTE.CATALOGUE,
      query: {
        catid: id,
        sort: props.sort,
        direction: props.direction
      }
    }"
    :focusable="false"
    tabindex="-1"
  >
    <Icon
      v-if="categoryIcon"
      :icon="categoryIcon"
      size="sm"
      :class="styles.categories.item.icon"
    />

    <section :class="styles.categories.item.action">
      <header :class="styles.categories.item.titleContainer">
        <Button
          :as="RouterLink"
          size="lg"
          variant="link"
          :to="{
            name: ROUTE.CATALOGUE,
            query: {
              catid: id,
              sort: props.sort,
              direction: props.direction
            }
          }"
          >{{ name }}</Button
        >
        <Icon
          icon="arrow-right"
          size="2xs"
          :class="styles.categories.item.arrowIcon"
        />
      </header>

      <p v-if="description" :class="styles.categories.item.description">
        {{ description }}
      </p>
    </section>
  </Button>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";

// --- internal
import config from "../catalogue.config";

// --- components
import { Icon, Button, useStyles } from "@upmind-automation/upmind-ui";

// --- types
import { ROUTE, type ProductCategory } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";
import type { CategoriesProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<
  ProductCategory & Omit<CategoriesProps, "modelValue">
>();

const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");
// -----------------------------------------------------------------------------

const { t } = useI18n();

const categoryIcon = computed(() => {
  return props.uiMeta?.uischema?.icon;
});

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
      action: string;
      titleContainer: string;
      title: string;
      arrowIcon: string;
      description: string;
    };
  };
}>;
</script>
