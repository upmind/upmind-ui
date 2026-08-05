<script lang="ts" setup>
import {
  StepperSeparator,
  type StepperSeparatorProps,
  useForwardProps
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  StepperSeparatorProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <StepperSeparator
    v-bind="forwardedProps"
    :class="
      cn(
        'bg-muted',
        'group-data-[disabled]:bg-muted group-data-[disabled]:opacity-50',
        'group-data-[state=completed]:bg-accent-foreground',
        props.class
      )
    "
  />
</template>
