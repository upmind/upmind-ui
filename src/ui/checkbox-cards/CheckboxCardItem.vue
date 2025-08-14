<template>
  <ToggleGroupItem
    v-bind="forwardedProps"
    :key="index"
    :class="
      cn(
        'group text-md m-0! flex w-full items-start rounded-sm text-start leading-none outline-none select-none',
        props.noInput ? 'pl-6' : '',
        props.itemClass
      )
    "
  >
    <span
      class="size-lh flex items-center justify-center"
      :class="props.noInput ? 'sr-only' : ''"
    >
      <span
        :class="
          cn(
            'focus-visible:ring-ring border-control bg-control-backgroundtext-control-foreground ring-offset-background flex aspect-square h-4 w-4 shrink-0 items-center justify-center rounded-sm border group-disabled:cursor-not-allowed group-disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            '[button[data-state=on]_&]:text-control-active-foreground [button[data-state=on]_&]:bg-control-active [button[data-state=off]_&]:text-transparent',
            props.class
          )
        "
      >
        <Check class="h-3 w-3" />
      </span>
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
