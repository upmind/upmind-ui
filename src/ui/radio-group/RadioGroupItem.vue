<template>
  <RadioGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        ringClasses,
        'ring-offset-background-control-surface',
        'shadow-border-border-control-default text-primary aspect-square h-4.5 w-4.5 rounded-full disabled:cursor-not-allowed disabled:opacity-50',
        'text-control-foreground data-[state=checked]:bg-background-control-checked shrink-0',
        props.class,
        props.noInput ? 'sr-only' : ''
      )
    "
    :data-focus="$attrs['data-focus']"
    :data-hover="$attrs['data-hover']"
  >
    <RadioGroupIndicator class="flex items-center justify-center">
      <Circle
        class="text-background-control-checked-contrast h-2 w-2 fill-current"
      />
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
import { ringClasses } from "../../assets/ring.styles";

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
