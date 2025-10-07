<template>
  <span
    v-bind="forwardedProps"
    :class="
      cn(
        'focus-visible:ring-ring shadow-control-default text-primary ring-offset-bg-canvas flex aspect-square h-4.5 w-4.5 items-center justify-center rounded-full border-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',

        'bg-base-background text-control-foreground data-[state=checked]:bg-control-checked shrink-0 data-[state=checked]:shadow-none',
        props.class,
        props.noInput ? 'sr-only' : ''
      )
    "
  >
    <SelectItemIndicator class="">
      <Circle class="text-control-checked-contrast h-2 w-2 fill-current" />
    </SelectItemIndicator>
  </span>
</template>

<script setup lang="ts">
import { cn } from "../../utils";
import { Circle } from "lucide-vue-next";
import {
  SelectItemIndicator,
  type SelectItemProps,
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
