<template>
  <component :is="as" :class="cn(styles.card.root, props.class)">
    <slot />
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./card.config";

// --- types
import type { HTMLAttributes, ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    as?: string;
    class?: HTMLAttributes["class"];
    disabled?: boolean;
    width?: "app" | "full";
    spacious?: boolean;
  }>(),
  {
    as: "div",
    width: "full"
  }
);

const meta = computed(() => ({
  isDisabled: props.disabled,
  width: props.width,
  spacious: props.spacious
}));

const styles = useStyles(["card"], meta, config);
</script>
