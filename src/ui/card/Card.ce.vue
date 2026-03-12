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
import type { CardProps } from "./types";
// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<CardProps>(), {
  as: "div",
  width: "full",
  size: "md"
});

const meta = computed(() => ({
  isDisabled: props.disabled,
  width: props.width,
  padding: props.padding
}));

const styles = useStyles(["card"], meta, config);
</script>
