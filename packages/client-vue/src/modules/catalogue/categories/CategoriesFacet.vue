<template>
  <div :class="styles.categories.header.root" v-auto-animate>
    <h1 v-if="title" :class="styles.categories.header.title">
      {{ name }}
    </h1>
  </div>
</template>

<script setup lang="ts">
// --- external
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { useBrand, type ProductCategory } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../catalogue.config";

// --- types
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

defineProps<ProductCategory>();

const { name } = useBrand();

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
