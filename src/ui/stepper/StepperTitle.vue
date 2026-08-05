<script lang="ts" setup>
import {
  StepperTitle,
  type StepperTitleProps,
  useForwardProps
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  StepperTitleProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <StepperTitle
    v-bind="forwardedProps"
    :class="cn('text-md font-semibold whitespace-nowrap', props.class)"
  >
    <slot />
  </StepperTitle>
</template>
