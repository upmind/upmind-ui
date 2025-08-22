<template>
  <span
    v-bind="forwardedProps"
    :class="
      cn(
        'size-lh focus-visible:ring-ring shadow-border data-[state=checked]:border-control-active-background text-primary ring-offset-background flex aspect-square h-4.5 w-4.5 items-center justify-center rounded-full focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',

        'data-[state=checked]:text-control-active-foreground bg-base-background text-control-foreground focus-within:ring-control-active active:ring-control-active data-[state=checked]:bg-control-active-background shrink-0 leading-normal ring-offset-2 outline-hidden [transition:border-color_200ms_ease-in-out] focus-within:ring-2 focus-within:ring-offset-2 focus-within:outline-hidden active:ring-2 active:ring-offset-2',
        props.class,
        props.noInput ? 'sr-only' : ''
      )
    "
  >
    <SelectItemIndicator class="">
      <Circle class="h-2 w-2 fill-current text-current text-white" />
    </SelectItemIndicator>
  </span>
</template>

<script setup lang="ts">
import { cn } from "../../utils";
import { Circle } from "lucide-vue-next";
import {
  SelectItem,
  SelectItemIndicator,
  type SelectItemProps,
  SelectItemText,
  useForwardProps
} from "radix-vue";

import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
  SelectItemProps & { class?: HTMLAttributes["class"]; noInput?: boolean }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<style scoped>
svg {
  /* Forces Safari to create a new stacking context, fixing SVG centering issues specific to Safari */
  transform: scale(1);
}
</style>
