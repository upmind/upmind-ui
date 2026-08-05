<script lang="ts" setup>
import { StepperItem, type StepperItemProps, useForwardProps } from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  StepperItemProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <StepperItem
    v-slot="slotProps"
    v-bind="forwardedProps"
    :class="
      cn(
        'group flex items-center gap-2 data-[disabled]:pointer-events-none',
        props.class
      )
    "
  >
    <slot v-bind="slotProps" />
  </StepperItem>
</template>
