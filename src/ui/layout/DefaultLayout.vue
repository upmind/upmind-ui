<template>
  <article :class="cn(styles.default.root, props.class)">
    <slot />
  </article>
</template>

<script lang="ts" setup>
// --- internal
import { cn, useStyles } from "../../utils";
import config from "./layout.config";

// --- types
import type { HTMLAttributes, ComputedRef } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  uiConfig?: Record<string, any>;
}>();

const styles = useStyles(
  ["default"],
  {},
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  default: {
    root: string;
  };
}>;
</script>
