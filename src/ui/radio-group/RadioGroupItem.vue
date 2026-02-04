<template>
  <RadioGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        ringClasses,
        'ring-offset-control-surface',
        'data-[state=unchecked]:shadow-control-default data-[state=checked]:shadow-control-checked text-primary aspect-square h-4 w-4 rounded-full disabled:cursor-not-allowed disabled:opacity-50',
        'text-control-foreground data-[state=checked]:bg-control-checked data-[state=unchecked]:hover:shadow-control-hover shrink-0 cursor-pointer transition-none duration-0',
        props.class,
        props.noInput ? 'sr-only' : ''
      )
    "
    :data-focus="props.dataFocus"
    :data-hover="props.dataHover"
  >
    <RadioGroupIndicator class="flex items-center justify-center">
      <Circle class="text-control-checked-contrast h-2 w-2 fill-current" />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>

<script setup lang="ts">
import { Circle } from "lucide-vue-next";
import {
  RadioGroupIndicator,
  RadioGroupItem,
  type RadioGroupItemProps,
  useForwardProps
} from "radix-vue";
import { computed, type HTMLAttributes } from "vue";
import { ringClasses } from "../../assets/styles";
import { cn } from "../../utils";

const props = defineProps<
  RadioGroupItemProps & {
    class?: HTMLAttributes["class"];
    noInput?: boolean;
    dataHover?: boolean;
    dataFocus?: boolean;
  }
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
