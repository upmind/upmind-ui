<template>
  <div :class="cn(styles.card, props.class)">
    <slot />
  </div>
</template>

<script lang="ts" setup>
// --- internal
import { cn, useStyles } from "@upmind-automation/upwind";
import config from "./config.cva";
// --- types
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    as?: string;
    class?: HTMLAttributes["class"];
  }>(),
  {
    as: "div",
  }
);

const styles = useStyles(["card"], {}, config);
</script>
