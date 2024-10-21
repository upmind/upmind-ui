<template>
  <ListboxItem
    v-bind="forwardedProps"
    as="button"
    :class="
      cn(
        'group relative !m-0 flex w-full select-none items-start rounded pl-10 text-start leading-none outline-none'
      )
    "
  >
    <span
      :class="
        cn(
          'absolute left-0 top-0 flex aspect-square h-4 w-4 items-center justify-center rounded-sm border border-control bg-base text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group-disabled:cursor-not-allowed group-disabled:opacity-50',
          props.class
        )
      "
    >
      <ListboxItemIndicator>
        <Square class="h-3 w-3 fill-current text-current" />
      </ListboxItemIndicator>
    </span>

    <slot />
  </ListboxItem>
</template>

<script setup lang="ts">
import { cn } from "../../utils";
import { Square } from "lucide-vue-next";
import {
  ListboxItem,
  ListboxItemIndicator,
  type ListboxItemProps,
  useForwardProps,
} from "radix-vue";

import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
  ListboxItemProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>
