<template>
  <div :class="cn(styles.root, props.class)">
    <slot />
  </div>
</template>

<script lang="ts" setup>
// --- external
import type { HTMLAttributes, ComputedRef } from "vue";

// --- internal
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./root.config";

// --- types

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const styles = useStyles(["root"], {}, config) as ComputedRef<{
  root: string;
}>;
</script>
