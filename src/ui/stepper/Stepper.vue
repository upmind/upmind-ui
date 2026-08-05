<script lang="ts" setup>
import {
  StepperRoot,
  type StepperRootEmits,
  type StepperRootProps,
  useForwardPropsEmits
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  StepperRootProps & { class?: HTMLAttributes["class"] }
>();
const emits = defineEmits<StepperRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <StepperRoot
    v-slot="slotProps"
    v-bind="forwarded"
    :class="cn('flex gap-2', props.class)"
  >
    <slot v-bind="slotProps" />
  </StepperRoot>
</template>
