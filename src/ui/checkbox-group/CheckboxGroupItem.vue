<template>
  <ListboxItem
    v-bind="forwardedProps"
    :key="index"
    :class="
      cn(
        'group m-0! flex w-full items-start rounded-sm pl-10 text-start leading-none outline-none select-none',
        props.noInput ? 'pl-6' : '',
        props.itemClass
      )
    "
  >
    <span
      :class="
        cn(
          'group-data-[state=checked]:text-control-active-foreground focus-visible:ring-ring shadow-border-control data-[state=checked]:shadow-border-none bg-background-control-surface text-control-foreground ring-offset-background group-data-[state=checked]:bg-control-active absolute top-0 left-0 flex aspect-square h-4 w-4 shrink-0 items-center justify-center rounded-sm border group-disabled:cursor-not-allowed group-disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
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
