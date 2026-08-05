<script lang="ts" setup>
import { StepperTrigger, useForwardProps } from "radix-vue";
import { computed } from "vue";
import { cn } from "../../utils";
import type { StepperTriggerProps } from "radix-vue";
import type { HTMLAttributes } from "vue";

const props = defineProps<
  StepperTriggerProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <StepperTrigger v-bind="forwarded" :class="cn(props.class)">
    <slot />
  </StepperTrigger>
</template>
