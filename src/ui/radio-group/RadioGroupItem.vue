<template>
  <RadioGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        'focus-visible:ring-ring border-control text-primary ring-offset-background focus:outline-hidden aspect-square h-4 w-4 rounded-full border focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',

        'data-[state=checked]:text-control-active-foreground bg-control-background text-control-foreground data-[state=checked]:bg-control-active shrink-0',
        props.class,
        props.noInput ? 'sr-only' : ''
      )
    "
  >
    <RadioGroupIndicator class="flex items-center justify-center">
      <Circle class="h-2.5 w-2.5 fill-current text-current" />
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
