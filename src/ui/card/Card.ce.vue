<template>
  <component :is="as" :class="cn(styles.card.root, props.class)">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import config from "./card.config";
import { cn, useStyles } from "../../utils";
import type { HTMLAttributes } from "vue";
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
