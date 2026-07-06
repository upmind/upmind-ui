<template>
  <component
    :is="component"
    v-bind="componentProps"
    :aria-disabled="meta.isDisabled || undefined"
    :tabindex="meta.isFocusable ? '0' : '-1'"
    :class="cn(styles.link.root, props.class)"
    :data-test-key="
      props.dataAttrs?.['data-test-key'] ??
      `link-${kebabCase(label ?? 'default')}`
    "
    @click="onClick"
  >
    <slot name="prepend">
      <LinkItems
        :icon="icon"
        :avatar="avatar"
        :checked="checked"
        :size="size"
        :color="color"
        :uiConfig="uiConfig"
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
        :uiConfig="uiConfig"
      />
    </slot>
  </component>
</template>

<script lang="ts" setup>
import { computed, useSlots } from "vue";
import { RouterLink } from "vue-router";
import config from "./link.config";
import LinkItems from "./LinkItems.vue";
import { useStyles, cn, useDisabled } from "../../utils";
import { kebabCase, isEmpty } from "lodash-es";
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

const emit = defineEmits<{
  click: [event: Event];
}>();

const disabled = useDisabled(() => props.disabled || props.loading);

const component = computed(() => {
  // NB  if we are disabled and we are a link, we render a span to prevent navigation
  if (props.to && !disabled.value) return RouterLink;
  if (props.href && !disabled.value) return "a";
  return "span";
});

const componentProps = computed(() => {
  if (component.value === RouterLink)
    return { to: props.to, ...props.dataAttrs };
  if (component.value === "a") return { href: props.href, ...props.dataAttrs };
  return { ...props.dataAttrs };
});

function onClick(event: Event) {
  if (disabled.value) return;
  props.action?.(event);
  emit("click", event);
}

const meta = computed(() => ({
  color: props.color,
  size: props.size,
  isDisabled: disabled.value,
  isLoading: props.loading,
  isFocusable: props.focusable && !disabled.value,
  hasRing:
    props.ring === "focus-visible" && !disabled.value && props.focusable,
  hasFocusRing: props.ring === "focus" && !disabled.value && props.focusable,
  hasIcon:
    !isEmpty(props.icon) ||
    !isEmpty(props.iconAppend) ||
    !isEmpty(slots.prepend) ||
    !isEmpty(slots.append)
}));

const styles = useStyles(["link"], meta, config, props.uiConfig ?? {});
</script>
