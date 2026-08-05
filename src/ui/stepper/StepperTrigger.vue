<script lang="ts" setup>
import {
  StepperTrigger,
  type StepperTriggerProps,
  useForwardProps
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  StepperTriggerProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <StepperTrigger
    v-bind="forwardedProps"
    :class="
      cn(
        'flex flex-col items-center gap-2 rounded-lg p-2 text-center',
        props.class
      )
    "
  >
    <slot />
  </StepperTrigger>
</template>
