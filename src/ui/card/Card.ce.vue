<template>
  <section :class="cn(styles.card.root, props.class)">
    <component :is="as" :class="styles.card.container">
      <slot />
    </component>
  </section>
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
  }>(),
  {
    as: "div",
    width: "full"
  }
);

const meta = computed(() => ({
  isDisabled: props.disabled,
  width: props.width
}));

const styles = useStyles(["card"], meta, config) as ComputedRef<{
  card: {
    root: string;
    container: string;
  };
}>;
</script>
