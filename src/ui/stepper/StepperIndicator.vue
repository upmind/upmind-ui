<script lang="ts" setup>
import { StepperIndicator, useForwardProps } from "radix-vue";
import { computed } from "vue";
import { cn } from "../../utils";
import type { StepperIndicatorProps } from "radix-vue";
import type { HTMLAttributes } from "vue";

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
  <StepperIndicator v-bind="forwarded" :class="cn(props.class)">
    <slot />
  </StepperIndicator>
</template>
