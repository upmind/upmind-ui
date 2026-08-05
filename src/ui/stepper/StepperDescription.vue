<script lang="ts" setup>
import {
  StepperDescription,
  type StepperDescriptionProps,
  useForwardProps
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  StepperDescriptionProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <StepperDescription
    v-slot="slotProps"
    v-bind="forwardedProps"
    :class="cn('text-muted text-xs', props.class)"
  >
    <slot v-bind="slotProps" />
  </StepperDescription>
</template>
