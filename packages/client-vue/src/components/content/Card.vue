<template>
  <div :class="cn(styles.card, props.class)">
    <slot />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./content.config";

// --- types
import type { HTMLAttributes, ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    as?: string;
    class?: HTMLAttributes["class"];
    disabled?: boolean;
  }>(),
  {
    as: "div",
  }
);

const meta = computed(() => ({
  isDisabled: props.disabled,
}));

const styles = useStyles(["card"], meta, config) as ComputedRef<{
  card: string;
}>;
</script>
