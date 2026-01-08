<template>
  <div :class="styles.categories.header.root" v-auto-animate>
    <template v-if="!meta.isLoading">
      <slot name="prepend" />

      <h1
        v-if="title"
        :class="styles.categories.header.title"
        data-testid="title"
      >
        {{ title }}
      </h1>
      <p v-if="description" :class="styles.categories.header.description">
        {{ description }}
      </p>

      <slot name="append" />
    </template>
    <template v-else>
      <Skeleton class="h-5 w-16" />
      <Skeleton class="mt-3 h-12 w-96" />
    </template>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { useBrand, type ProductCategory } from "@upmind-automation/headless";
import { useStyles, Skeleton } from "@upmind-automation/upmind-ui";
import config from "../catalogue.config";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { CategoriesProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<ProductCategory>();

const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");

// -----------------------------------------------------------------------------

const { name, uiCart } = useBrand();

const meta = computed(() => {
  return {
    isLoading:
      (modelValue.value && !props.id) || (!modelValue.value && !name.value)
  };
});

const title = computed(() => {
  return props.name || (isEmpty(props.id) && uiCart.value?.tagline) || "";
});

const styles = useStyles(["categories", "categories.header"], meta, config);
</script>
