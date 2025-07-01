<template>
  <div :class="styles.categories.header.root" v-auto-animate>
    <template v-if="!isLoading">
      <h1 :class="styles.categories.header.title">{{ title }}</h1>
      <p v-if="description" :class="styles.categories.header.description">
        {{ description }}
      </p>
    </template>
    <template v-else>
      <div :class="styles.categories.header.title" />
      <div :class="styles.categories.header.description" />

      <section class="h-56 w-full opacity-0" />
    </template>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useBrand } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- config
import config from "../shop.config";

// --- types
import type { CategoriesHeaderProps } from "./types";
import type { ComputedRef } from "vue";

const props = defineProps<CategoriesHeaderProps>();

const { name, uiMeta } = useBrand();

const isLoading = computed(() => {
  return (
    (props.categoryId && !props.category) || (!props.categoryId && !name.value)
  );
});

const title = computed(() => {
  return props.category?.name || uiMeta.value?.tagline || name.value;
});

const description = computed(() => {
  return props.category?.description || uiMeta.value?.description || "";
});

const styles = useStyles(
  ["categories", "categories.header"],
  {},
  config
) as ComputedRef<{
  categories: {
    header: {
      root: string;
      title: string;
      description: string;
    };
  };
}>;
</script>
