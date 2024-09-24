<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->
  <Badge :class="cn(variants.badge, props.class)">
    <slot name="prepend"></slot>
    <span>
      <slot> {{ label }}</slot>
    </span>
    <slot name="append"> </slot>
  </Badge>
</template>

<script setup lang="ts">
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
  // --- variants
  variant: "outline",
  color: "base",
  // --- styles
  upwindConfig: () => ({ badge: {} }),
  class: "",
});

const meta = computed(() => ({
  variant: props.variant,
  color: props.color,
}));

const variants = useStyles(
  "badge",
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ badge: string }>;
</script>
