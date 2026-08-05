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

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <StepperSeparator
    v-bind="forwarded"
    :class="
      cn(
        'bg-accent-neutral/20',
        // Disabled
        'group-data-[disabled]:bg-accent-neutral/20 group-data-[disabled]:opacity-50',
        // Completed
        'group-data-[state=completed]:bg-control-checked',
        props.class
      )
    "
  />
</template>
