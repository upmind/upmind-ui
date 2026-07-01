<template>
  <div :class="cn(styles.page, props.class)">
    <div :class="styles.content">
      <slot />
    </div>
    <slot name="footer" />
  </div>
</template>

<script lang="ts" setup>
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./page.config";
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const styles = useStyles(["page", "content"], {}, config);
</script>
