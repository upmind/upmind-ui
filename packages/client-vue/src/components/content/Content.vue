<template>
  <div :class="cn(styles.content, props.class)">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./content.config";
// --- types
import type { HTMLAttributes, ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const styles = useStyles(["content"], {}, config) as ComputedRef<{
  content: string;
}>;
</script>
