<template>
  <component
    :is="component"
    v-bind="componentProps"
    :disabled="meta.isDisabled || meta.isLoading"
    :tabindex="meta.isFocusable ? '0' : '-1'"
    :class="cn(styles.button.root, props.class)"
    :data-testid="`button-${kebabCase(label ?? 'default')}`"
    @click="$emit('click', $event)"
  >
    <slot name="prepend">
      <ButtonItems
        :icon="icon"
        :avatar="avatar"
        :checked="checked"
        :size="size"
        :variant="variant"
        :loading="loading"
      />
    </slot>

    <slot>
      <span v-if="label || slots.label" :class="styles.button.label">
        <slot name="label">{{ label }}</slot>
      </span>
    </slot>

    <slot name="append">
      <ButtonItems
        :icon="iconAppend"
        :avatar="avatarAppend"
        :checked="checked"
        :size="size"
        :variant="variant"
        :loading="loading"
      />
    </slot>

    <Spinner
      v-if="loading"
      size="sm"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    />
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed, useSlots } from "vue";
import { kebabCase } from "lodash-es";

// --- internal
import { useStyles, cn } from "../../utils";
import config from "./button.config";

// --- components
import { Spinner } from "../spinner";
import Button from "./Button.vue";
import ButtonItems from "./ButtonItems.vue";
import { RouterLink } from "vue-router";

// -- types
import type { ComputedRef } from "vue";
import type { ButtonProps } from "./types";

const props = withDefaults(defineProps<ButtonProps>(), {
  type: "button",
  size: "md",
  variant: "solid",
  color: "primary",
  align: "center",
  focusable: true,
  truncate: true,
  ring: true,
  uiConfig: () => ({ button: { root: [], label: [], items: [] } }),
  class: "",
  contentClass: ""
});

const slots = useSlots();

defineEmits<{
  click: [event: Event];
}>();

const component = computed(() => {
  if (props.is) return props.is;
  // NB  if we are disabled and we are a link, we render a button to prevent navigation
  if (!props.disabled && props.to) return RouterLink;
  if (!props.disabled && props.href) return "a";
  // default
  return Button;
});

const componentProps = computed(() => {
  if (props.to) return { to: props.to };
  if (props.href) return { href: props.href };
  return { type: props.type };
});

const meta = computed(() => ({
  size: props.size,
  variant: props.variant,
  color: props.color,
  align: props.align,
  isIconOnly: props.iconOnly,
  isBlock: props.block,
  isDisabled: props.disabled,
  isLoading: props.loading,
  isFocusable: props.focusable,
  hasRing: props.ring && !props.disabled && props.focusable
}));

const styles = useStyles(
  ["button"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  button: {
    root: string;
    label: string;
  };
}>;
</script>
