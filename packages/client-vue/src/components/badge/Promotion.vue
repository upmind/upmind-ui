<template>
  <Badge v-if="meta.showBadge" v-bind="props">
    <slot />
  </Badge>
</template>

<script setup lang="ts">
// --- imports
import { computed, useSlots } from "vue";
import { Badge } from "@upmind-automation/upmind-ui";

// --- types
import type { PromotionBadgeProps } from "./types";

const props = withDefaults(defineProps<PromotionBadgeProps>(), {
  size: "sm",
  variant: "tonal",
  color: "promotion",
});

const slots = useSlots();

const meta = computed(() => ({
  showBadge: props.amount && (props.label || slots.default),
}));
</script>
