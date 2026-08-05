<script lang="ts" setup>
import {
  ContextMenuItem,
  type ContextMenuItemProps,
  useForwardProps
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  ContextMenuItemProps & { class?: HTMLAttributes["class"]; inset?: boolean }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <ContextMenuItem
    v-bind="forwardedProps"
    :class="
      cn(
        'relative flex cursor-default items-center rounded-xs px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50',
        inset && 'pl-8',
        props.class
      )
    "
  >
    <slot />
  </ContextMenuItem>
</template>
