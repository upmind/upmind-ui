<template>
  <component :is="as" :class="cn(styles.card.root, props.class)">
    <slot />
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
// --- internal
import config from "./card.config";
import { cn, useStyles } from "../../utils";
// --- types
import type { HTMLAttributes } from "vue";
// -----------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    as?: string;
    class?: HTMLAttributes["class"];
    disabled?: boolean;
    width?: "app" | "full";
    padding?: "md" | "lg";
  }>(),
  {
    as: "div",
    width: "full"
  }
);

const meta = computed(() => ({
  isDisabled: props.disabled,
  width: props.width,
  padding: props.padding
}));

const styles = useStyles(["card"], meta, config);
</script>
