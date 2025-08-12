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
      />
    </slot>

    <slot>
      <span v-if="label" :class="styles.button.label">
        {{ label }}
      </span>
    </slot>

    <slot name="append">
      <ButtonItems
        :icon="iconAppend"
        :avatar="avatarAppend"
        :checked="checked"
        :size="size"
        :variant="variant"
      />
    </slot>

    <Spinner v-if="loading && spinner" size="sm" class="absolute" />
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
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
  disabled: false,
  loading: false,
  iconOnly: false,
  spinner: true,
  type: "button",
  size: "md",
  color: "base",
  variant: "flat",
  block: false,
  focusable: true,
  truncate: true,
  uiConfig: () => ({ button: [] }),
  class: "",
  contentClass: ""
});

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
  color: props.color,
  isIconOnly: props.iconOnly,
  isPill: props.pill,
  isBlock: props.block,
  isDisabled: props.disabled,
  isLoading: props.loading,
  isFocusable: props.focusable
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
