<template>
  <component
    :is="component"
    :to="to"
    :href="href"
    :type="type"
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
  variant: "primary",
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
  if (props.to) return RouterLink;
  if (props.href) return "a";
  return Button;
});

const meta = computed(() => ({
  size: props.size,
  variant: props.variant,
  align: props.align,
  isIconOnly: props.iconOnly,
  isPill: props.pill,
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
