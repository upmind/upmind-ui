<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->
  <Badge :class="cn(styles.badge, props.class)">
    <slot name="prepend"></slot>
    <span>
      <slot> {{ label }}</slot>
    </span>
    <slot name="append"> </slot>
  </Badge>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import config from "./badge.config";

import {
  useStyles,
  cn,
  //stylesheet
} from "../../utils";

// --- components
import Badge from "./Badge.vue";

// --- types
import type { ComputedRef } from "vue";
import type { BadgeProps } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<BadgeProps>(), {
  // --- props
  label: "",
  // --- styles
  variant: "outline",
  color: "base",
  size: "md",
  // --- styles
  uiConfig: () => ({ badge: [] }),
  class: "",
});

const meta = computed(() => ({
  variant: props.variant,
  color: props.color,
  size: props.size,
}));

const styles = useStyles(
  "badge",
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{ badge: string }>;
</script>
