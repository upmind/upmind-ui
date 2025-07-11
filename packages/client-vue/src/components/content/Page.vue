<template>
  <main :class="cn(styles.page, props.class)">
    <slot />
  </main>
</template>

<script lang="ts" setup>
// --- internal
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./content.config";

// --- types
import type { HTMLAttributes, ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const styles = useStyles(["page"], {}, config) as ComputedRef<{
  page: string;
}>;
</script>
