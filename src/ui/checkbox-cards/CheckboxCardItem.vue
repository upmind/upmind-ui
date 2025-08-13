<template>
  <ToggleGroupItem
    v-bind="forwardedProps"
    :key="index"
    :class="
      cn(
        'group relative m-0! flex w-full items-start rounded-xs pl-10 text-start leading-none outline-hidden select-none',
        props.noInput ? 'pl-6' : '',
        props.itemClass
      )
    "
  >
    <span
      :class="
        cn(
          'focus-visible:ring-ring border-control bg-control text-control-foreground ring-offset-background absolute top-0 left-0 flex aspect-square h-4 w-4 shrink-0 items-center justify-center rounded-xs border group-disabled:cursor-not-allowed group-disabled:opacity-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden',
          '[button[data-state=on]_&]:text-control-active-foreground [button[data-state=on]_&]:bg-control-active [button[data-state=off]_&]:text-transparent',
          props.class,
          props.noInput ? 'sr-only' : ''
        )
      "
    >
      <Check class="h-3 w-3" />
    </span>

    <slot />
  </ToggleGroupItem>
</template>

<script setup lang="ts">
import { cn } from "../../utils";
import { Check } from "lucide-vue-next";
import {
  ToggleGroupItem,
  useForwardProps,
  type ToggleGroupItemProps
} from "radix-vue";

import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
  ToggleGroupItemProps & {
    index?: number;
    class?: HTMLAttributes["class"];
    itemClass?: HTMLAttributes["class"];
    noInput?: boolean;
  }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>
