<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(variants.spinner, props.class)"
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
  //  --- variants
  size: "auto",
  // --- styles
  upwindConfig: () => ({ spinner: {} }),
  class: "",
});

const meta = computed(() => ({
  size: props.size,
  // ---
}));

const variants = useStyles(
  "spinner",
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ spinner: string }>;
</script>
