<template>
  <component
    :is="component"
    :to="to"
    :href="href"
    :disabled="meta.isDisabled"
    :tabindex="meta.isFocusable ? '0' : '-1'"
    :class="cn(styles.link.root, props.class)"
    :data-testid="`link-${kebabCase(label ?? 'default')}`"
    @click="$emit('click', $event)"
  >
    <slot name="prepend">
      <LinkItems
        :icon="icon"
        :avatar="avatar"
        :checked="checked"
        :size="size"
        :color="color"
      />
    </slot>

    <slot>
      <span v-if="label || slots.label" :class="styles.link.label">
        <slot name="label">{{ label }}</slot>
      </span>
    </slot>

    <slot name="append">
      <LinkItems
        :icon="iconAppend"
        :avatar="avatarAppend"
        :checked="checked"
        :size="size"
        :color="color"
      />
    </slot>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed, useSlots } from "vue";
import { kebabCase } from "lodash-es";

// --- internal
import { useStyles, cn } from "../../utils";
import config from "./link.config";

// --- components
import Button from "../button/Button.vue";
import LinkItems from "./LinkItems.vue";
import { RouterLink } from "vue-router";

// -- types
import type { ComputedRef } from "vue";
import type { LinkProps } from "./types";

const props = withDefaults(defineProps<LinkProps>(), {
  size: "md",
  color: "inherit",
  focusable: true,
  uiConfig: () => ({ link: { root: [], label: [], items: [] } }),
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
  return "a";
});

const meta = computed(() => ({
  color: props.color,
  size: props.size,
  isDisabled: props.disabled,
  isFocusable: props.focusable,
  hasRing: !props.disabled && props.focusable
}));

const styles = useStyles(
  ["link"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  link: {
    root: string;
    label: string;
  };
}>;
</script>
