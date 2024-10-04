<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <ButtonRoot
    :as="props.as"
    :class="cn(variants.button, props.class)"
    :disabled="props.disabled || props.loading"
    :loading="props.loading"
  >
    <template v-if="!props.loading">
      <slot name="prepend"></slot>

      <slot>
        <span class="truncate">{{ label }}</span>
      </slot>

      <slot name="append"></slot>
    </template>

    <template v-else>
      <UpwSpinner size="xs" />
    </template>
  </ButtonRoot>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- internal
import config from "./button.config";
import {
  useStyles,
  cn,
  //stylesheet
} from "../../utils";

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
  "button",
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ button: string }>;
</script>
