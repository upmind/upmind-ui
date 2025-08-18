<template>
  <ListboxItem
    v-bind="forwardedProps"
    :key="index"
    :class="
      cn(
        'm-0! group flex w-full select-none items-start rounded-sm pl-10 text-start leading-none outline-none',
        props.noInput ? 'pl-6' : '',
        props.itemClass
      )
    "
  >
    <span
      :class="
        cn(
          'group-data-[state=checked]:text-control-active-foreground focus-visible:ring-ring border-control bg-control-background text-control-foreground ring-offset-background group-data-[state=checked]:bg-control-active absolute left-0 top-0 flex aspect-square h-4 w-4 shrink-0 items-center justify-center rounded-sm border focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 group-disabled:cursor-not-allowed group-disabled:opacity-50',
          props.class,
          props.noInput ? 'sr-only' : ''
        )
      "
    >
      <ListboxItemIndicator>
        <Check class="h-3 w-3" />
      </ListboxItemIndicator>
    </span>

    <slot />
  </ListboxItem>
</template>

<script setup lang="ts">
import { cn } from "../../utils";
import { Check } from "lucide-vue-next";
import {
  ListboxItem,
  ListboxItemIndicator,
  type ListboxItemProps,
  useForwardProps
} from "radix-vue";

import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
  ListboxItemProps & {
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
