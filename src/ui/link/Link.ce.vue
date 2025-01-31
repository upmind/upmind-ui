<template>
  <!-- Router link -->
  <component
    :is="to ? 'router-link' : 'a'"
    :to="to"
    tabindex="0"
    :class="styles.link.root"
    :aria-disabled="disabled"
    :data-disabled="disabled"
    @click="handleClick"
  >
    <slot name="prepend"></slot>
    <slot
      ><strong>{{ label }}</strong></slot
    >
    <slot name="append"></slot>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import config from "./link.config";
import { useStyles } from "../../utils";

// --- types
import type { ComputedRef } from "vue";
import type { LinkProps } from "./types";
// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<LinkProps>(), {
  // --- states
  disabled: false,
  loading: false,
  // --- styles
  size: "inherit",
  color: "base",
  variant: "flat",
  // --- styles
  uiConfig: () => ({ link: {} }),
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
  if (props.disabled) {
    event.preventDefault();
    return;
  }
  emit("click", event);
};
</script>
