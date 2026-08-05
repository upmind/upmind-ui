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

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <StepperIndicator
    v-bind="forwarded"
    :class="
      cn(
        'text-muted/50 inline-flex h-10 w-10 items-center justify-center rounded-full',
        // Disabled
        'group-data-[disabled]:text-muted group-data-[disabled]:opacity-50',
        // Active
        'group-data-[state=active]:bg-control-checked group-data-[state=active]:text-control-checked-contrast',
        // Completed
        'group-data-[state=completed]:bg-control-checked group-data-[state=completed]:text-control-checked-contrast',
        props.class
      )
    "
  >
    <slot />
  </StepperIndicator>
</template>
