<template>
  <component
    :is="component"
    v-bind="isRouterLink ? { to } : { href }"
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
      {{ label }}
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
import { kebabCase, isEmpty } from "lodash-es";

// --- internal
import { useStyles, cn } from "../../utils";
import config from "./link.config";

// --- components
import { RouterLink } from "vue-router";
import LinkItems from "./LinkItems.vue";

// -- types
import type { ComputedRef } from "vue";
import type { LinkProps } from "./types";

const props = withDefaults(defineProps<LinkProps>(), {
  size: "md",
  color: "default",
  focusable: true,
  ring: "focus-visible",
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

const isRouterLink = computed(() => component.value === RouterLink);

const meta = computed(() => ({
  color: props.color,
  size: props.size,
  isDisabled: props.disabled,
  isFocusable: props.focusable,
  hasRing: props.ring === "focus-visible" && !props.disabled && props.focusable,
  hasFocusRing: props.ring === "focus" && !props.disabled && props.focusable,
  hasIcon:
    !isEmpty(props.icon) ||
    !isEmpty(props.iconAppend) ||
    !isEmpty(slots.prepend) ||
    !isEmpty(slots.append)
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
