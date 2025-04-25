<template>
  <ToggleGroupItem
    v-bind="forwardedProps"
    :key="index"
    :class="
      cn(
        'group relative !m-0 flex w-full select-none items-start rounded-sm pl-10 text-start leading-none outline-none',
        props.noInput ? 'pl-6' : '',
        props.itemClass
      )
    "
  >
    <span
      :class="
        cn(
          'focus-visible:ring-ring absolute left-0 top-0 flex aspect-square h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-control bg-control text-control-foreground ring-offset-background focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 group-disabled:cursor-not-allowed group-disabled:opacity-50',
          '[button[data-state=on]_&]:text-control-active-foreground [button[data-state=off]_&]:text-transparent [button[data-state=on]_&]:bg-control-active',
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
  type ToggleGroupItemProps,
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
