<template>
  <RadioGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        'focus-visible:ring-ring shadow-border-border-control text-primary ring-offset-background aspect-square h-4.5 w-4.5 rounded-full border-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:text-control-active-foreground bg-base-background text-control-foreground data-[state=checked]:bg-control-active data-[state=checked]:shadow-border-none shrink-0',
        groupRingClasses,
        props.class,
        props.noInput ? 'sr-only' : ''
      )
    "
  >
    <RadioGroupIndicator class="flex items-center justify-center">
      <Circle class="h-2 w-2 fill-current text-current" />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>

<script setup lang="ts">
import { cn } from "../../utils";
import { Circle } from "lucide-vue-next";
import {
  RadioGroupIndicator,
  RadioGroupItem,
  type RadioGroupItemProps,
  useForwardProps
} from "radix-vue";
import { groupRingClasses } from "../../assets/ring.styles";

import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
  RadioGroupItemProps & { class?: HTMLAttributes["class"]; noInput?: boolean }
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
