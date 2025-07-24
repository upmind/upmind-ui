<template>
  <component
    :is="component"
    :to="to"
    :href="href"
    :type="type"
    :disabled="disabled || loading"
    :tabindex="focusable ? '0' : '-1'"
    :class="cn(styles.button, props.class)"
    :data-testid="`button-${kebabCase(label ?? 'default')}`"
    @click="$emit('click', $event)"
  >
    <slot name="prepend">
      <span
        v-if="icon || avatar"
        class="flex size-[1lh] items-center justify-center"
      >
        <Icon v-if="icon" :icon="icon" size="3xs" />
        <Avatar v-if="avatar" :icon="avatar" size="3xs" />
      </span>
    </slot>

    <slot>
      <span v-if="label" :class="{ 'sr-only': iconOnly }">{{ label }}</span>
    </slot>

    <slot name="append">
      <span
        v-if="iconAppend || avatarAppend"
        class="flex size-[1lh] items-center justify-center"
      >
        <Icon v-if="iconAppend" :icon="iconAppend" size="3xs" />
        <Avatar v-if="avatarAppend" :icon="avatarAppend" size="3xs" />
      </span>
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
import Icon from "../icon/Icon.ce.vue";
import Avatar from "../avatar/Avatar.ce.vue";
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
  block: props.block,
  disabled: props.disabled,
  loading: props.loading,
  focusable: props.focusable,
  pill: props.pill
}));

const styles = useStyles(
  ["button"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  button: string;
}>;
</script>
