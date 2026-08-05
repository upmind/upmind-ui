<script lang="ts" setup>
import {
  StepperIndicator,
  type StepperIndicatorProps,
  useForwardProps
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  StepperIndicatorProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <StepperIndicator
    v-bind="forwardedProps"
    :class="
      cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200',
        'group-data-[disabled]:opacity-50',
        props.class
      )
    "
  >
    <slot />
  </StepperIndicator>
</template>
