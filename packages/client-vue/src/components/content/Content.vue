<template>
  <div :class="cn(styles.content, props.class)">
    <slot />
  </div>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import { cn, useStyles } from "@upmind-automation/upwind";
import config from "./config.cva";
// --- types
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const styles = useStyles(["content"], {}, config);
</script>
