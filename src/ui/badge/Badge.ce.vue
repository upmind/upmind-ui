<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->
  <Badge :class="cn(styles.badge, props.class)">
    <slot name="prepend">
      <Icon v-if="icon" :icon="icon" class="[&>svg]:size-3.5" />
    </slot>
    <span class="px-1">
      <slot>{{ label }}</slot>
    </span>
    <slot name="append">
      <Icon v-if="appendIcon" :icon="appendIcon" size="2xs" />
    </slot>
  </Badge>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import config from "./badge.config";

import {
  useStyles,
  cn
  //stylesheet
} from "../../utils";

// --- components
import Badge from "./Badge.vue";
import { Icon } from "../icon";

// --- types
import type { ComputedRef } from "vue";
import type { BadgeProps } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<BadgeProps>(), {
  // --- props
  label: "",
  // --- styles
  variant: "flat",
  color: "base",
  size: "md",
  // --- styles
  uiConfig: () => ({ badge: [] }),
  class: ""
});

const meta = computed(() => ({
  variant: props.variant,
  color: props.color,
  size: props.size
}));

const styles = useStyles(
  "badge",
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{ badge: string }>;
</script>
