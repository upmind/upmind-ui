<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <ButtonRoot v-bind="forwarded" :class="cn(variants.button, props.class)">
    <slot name="prepend"></slot>

    <slot>
      <span class="truncate">{{ label }}</span>
    </slot>

    <slot name="append"></slot>
  </ButtonRoot>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useForwardProps } from "radix-vue";

// --- internal
import config from "./button.config";
import {
  useStyles,
  cn,
  //stylesheet
} from "../../utils";

// --- components
import ButtonRoot from "./Button.vue";

// --- types
import type { ComputedRef } from "vue";
import type { ButtonProps } from "./types";
import { size } from "lodash-es";

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

const forwarded = useForwardProps(props);

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
