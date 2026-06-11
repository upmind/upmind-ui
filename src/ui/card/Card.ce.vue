<template>
  <component :is="as" :class="cn(styles.card.root, props.class)">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import config from "./card.config";
import { cn, useStyles } from "../../utils";
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
  size: props.size
}));

const styles = useStyles(["card"], meta, config);
</script>
