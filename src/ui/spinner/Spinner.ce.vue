<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(styles.spinner, props.class)"
    role="status"
    aria-label="animated loading icon"
  >
    <slot />
    <span class="sr-only">Loading...</span>
  </Primitive>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { Primitive } from "radix-vue";

// --- internal
import { useStyles, cn } from "../../utils";
import config from "./spinner.config";

// --- components

// --- utils

// --- types
import type { ComputedRef } from "vue";
import type { SpinnerProps } from ".";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<SpinnerProps>(), {
  // --- props
  as: "span",
  //  --- styles
  size: "auto",
  // --- styles
  uiConfig: () => ({ spinner: [] }),
  class: ""
});

const meta = computed(() => ({
  size: props.size
  // ---
}));

const styles = useStyles(
  "spinner",
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{ spinner: string }>;
</script>
