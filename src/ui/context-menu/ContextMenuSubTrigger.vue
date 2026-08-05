<script lang="ts" setup>
import {
  ContextMenuSubTrigger,
  type ContextMenuSubTriggerProps,
  useForwardProps
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { Icon } from "../icon";
import { cn } from "../../utils";

const props = defineProps<
  ContextMenuSubTriggerProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <ContextMenuSubTrigger
    v-bind="forwardedProps"
    :class="
      cn(
        'data-highlighted:bg-button-ghost-hover data-[state=open]:bg-button-ghost-hover control-radius flex cursor-default items-center px-2 py-1.5 text-sm outline-hidden select-none',
        props.class
      )
    "
  >
    <slot />
    <Icon icon="chevron-right" class="ml-auto h-4 w-4" />
  </ContextMenuSubTrigger>
</template>
