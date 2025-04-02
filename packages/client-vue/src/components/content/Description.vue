<template>
  <component :is="as" :class="styles.description">
    <slot />
  </component>
</template>

<script setup lang="ts">
// --- external
import { useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./content.config";

// --- types
import type { ComputedRef } from "vue";
const styles = useStyles("description", {}, config) as ComputedRef<{
  description: string;
}>;

withDefaults(
  defineProps<{
    as?: "span" | "p";
  }>(),
  {
    as: "p",
  }
);
</script>
