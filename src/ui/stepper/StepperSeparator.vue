<script lang="ts" setup>
import { StepperSeparator, useForwardProps } from "radix-vue";
import { computed } from "vue";
import { cn } from "../../utils";
import type { StepperSeparatorProps } from "radix-vue";
import type { HTMLAttributes } from "vue";

const props = defineProps<
  StepperSeparatorProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <StepperSeparator v-bind="forwarded" :class="cn(props.class)" />
</template>
