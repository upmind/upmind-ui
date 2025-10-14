<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->
  <Badge :class="cn(styles.badge.root, props.class)">
    <slot name="prepend">
      <Icon v-if="icon" :icon="icon" size="nano" :class="styles.badge.icon" />
    </slot>
    <span :class="styles.badge.label">
      <slot>{{ label }}</slot>
    </span>
    <slot name="append">
      <Icon
        v-if="appendIcon"
        :icon="appendIcon"
        size="nano"
        :class="styles.badge.icon"
      />
      <Icon
        v-else-if="props.close"
        icon="x"
        :class="styles.badge.close"
        @click="handleClose"
      />
    </slot>
  </Badge>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import config from "./badge.config";

import { useStyles, cn } from "../../utils";

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
  variant: "solid",
  color: "primary",
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
) as ComputedRef<{
  badge: {
    root: string;
    icon: string;
    label: string;
    close: string;
  };
}>;

const emit = defineEmits<{
  close: [];
}>();

function handleClose() {
  emit("close");
}
</script>
