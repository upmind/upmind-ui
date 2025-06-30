<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <ButtonRoot
    :as="props.as"
    :class="cn(styles.button, props.class)"
    :disabled="props.disabled || props.loading"
    :loading="props.loading"
    :type="props.type || 'button'"
    :tabindex="props.focusable ? '0' : '-1'"
    :data-testid="`button-${kebabCase(label ?? 'default')}`"
  >
    <slot name="prepend"></slot>

    <slot>
      <span
        v-if="label"
        class="truncate"
        :class="{ 'sr-only': props.iconOnly, truncate: truncate }"
        >{{ label }}</span
      >
    </slot>

    <slot name="append"></slot>

    <span
      v-if="props.loading && props.spinner"
      class="spinner absolute inset-0 flex items-center justify-center"
    >
      <Spinner size="sm" />
    </span>
  </ButtonRoot>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { kebabCase } from "lodash-es";

// --- internal
import config from "./button.config";
import { useStyles, cn } from "../../utils";

// --- components
import ButtonRoot from "./Button.vue";
import { Spinner } from "../spinner";

// --- types
import type { ComputedRef } from "vue";
import type { ButtonProps } from "./types";
// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<ButtonProps>(), {
  // --- props
  disabled: false,
  loading: false,
  iconOnly: false,
  spinner: true,
  type: "button",
  // --- styles
  size: "md",
  color: "base",
  variant: "flat",
  block: false,
  focusable: true,
  truncate: true,
  // --- styles
  uiConfig: () => ({ button: [] }),
  class: "",
  contentClass: ""
});

const meta = computed(() => ({
  size: props.size,
  variant: props.variant,
  color: props.color,
  block: props.block,
  disabled: props.disabled,
  loading: props.loading,
  focusable: props.focusable
}));

const styles = useStyles(
  ["button"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{ button: string }>;
</script>
