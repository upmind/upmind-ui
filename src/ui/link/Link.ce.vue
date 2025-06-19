<template>
  <!-- Router link -->
  <component
    :is="to ? 'router-link' : 'a'"
    :to="to"
    :href="href"
    :tabindex="props.focusable ? 0 : -1"
    :class="cn(styles.link.root, props.class)"
    :aria-disabled="disabled"
    :data-disabled="disabled"
    @click="handleClick"
    @keydown.enter="handleClick"
    data-testid="link"
  >
    <slot name="prepend"></slot>
    <slot
      ><component :is="as">{{ label }}</component></slot
    >
    <slot name="append"></slot>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import config from "./link.config";
import { useStyles, cn } from "../../utils";

// --- types
import type { ComputedRef } from "vue";
import type { LinkProps } from "./types";
// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<LinkProps>(), {
  // --- states
  disabled: false,
  loading: false,
  focusable: true,
  // --- styles
  size: "inherit",
  color: "base",
  variant: "flat",
  as: "strong",
  // --- styles
  uiConfig: () => ({ link: [] }),
});

const meta = computed(() => ({
  variant: props.variant,
  color: props.color,
  size: props.size,
  offset: props.offset,
  disabled: props.disabled,
  loading: props.loading,
}));

const styles = useStyles(
  ["link"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  link: {
    root: string;
  };
}>;

const emit = defineEmits<{
  (e: "click", event: Event): void;
}>();

const handleClick = (event: Event) => {
  if (props.disabled || props.loading) {
    event.preventDefault();
  } else {
    emit("click", event);
  }
};
</script>
