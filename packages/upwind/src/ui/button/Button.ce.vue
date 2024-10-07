<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <ButtonRoot
    :as="props.as"
    :class="cn(variants.button, props.class)"
    :disabled="props.disabled || props.loading"
    :loading="props.loading"
  >
    <span :class="variants.content">
      <slot name="prepend"></slot>

      <slot>
        <span class="truncate">{{ label }}</span>
      </slot>

      <slot name="append"></slot>
    </span>

    <span
      v-if="props.loading"
      class="absolute bottom-0 top-0 m-auto flex items-center justify-center"
    >
      <UpwSpinner size="auto" />
    </span>
  </ButtonRoot>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- internal
import config from "./button.config";
import { useStyles, cn } from "../../utils";

// --- components
import ButtonRoot from "./Button.vue";
import { UpwSpinner } from "@upmind/upwind";

// --- types
import type { ComputedRef } from "vue";
import type { ButtonProps } from "./types";
// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<ButtonProps>(), {
  // --- props
  disabled: false,
  loading: false,
  // --- variants
  size: "md",
  color: "base",
  variant: "flat",
  block: false,
  // --- styles
  upwindConfig: () => ({ button: {} }),
  class: "",
});

const meta = computed(() => ({
  size: props.size,
  variant: props.variant,
  color: props.color,
  block: props.block,
  disabled: props.disabled,
  loading: props.loading,
}));

const variants = useStyles(
  ["button", "content"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ button: string; content: string }>;
</script>
