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
        'text-muted-foreground/50 inline-flex h-10 w-10 items-center justify-center rounded-full',
        'group-data-[disabled]:text-muted-foreground group-data-[disabled]:opacity-50',
        'group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground',
        'group-data-[state=completed]:bg-accent group-data-[state=completed]:text-accent-foreground',
        props.class
      )
    "
  >
    <slot />
  </StepperIndicator>
</template>
