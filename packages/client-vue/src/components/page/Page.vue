<template>
  <div :class="cn(styles.page, props.class)">
    <slot />
  </div>
</template>

<script lang="ts" setup>
// --- internal
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./page.config";

// --- types
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const styles = useStyles(["page"], {}, config);
</script>
