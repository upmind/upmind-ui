<script lang="ts" setup>
import { type HTMLAttributes, computed } from "vue";
import {
  DropdownMenuItem,
  type DropdownMenuItemProps,
  useForwardProps
} from "radix-vue";

import { cn } from "../../utils";

const props = defineProps<
  DropdownMenuItemProps & { class?: HTMLAttributes["class"]; inset?: boolean }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DropdownMenuItem
    v-bind="forwardedProps"
    :class="
      cn(
        'rounded-xs outline-hidden data-disabled:pointer-events-none data-disabled:opacity-50 relative flex cursor-default select-none items-center px-2 py-1.5 text-sm transition-colors',
        inset && 'pl-8',
        props.class
      )
    "
  >
    <slot />
  </DropdownMenuItem>
</template>
