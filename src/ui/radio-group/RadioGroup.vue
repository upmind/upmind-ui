<script setup lang="ts">
import {
  RadioGroupRoot,
  type RadioGroupRootEmits,
  type RadioGroupRootProps,
  useForwardPropsEmits
} from "radix-vue";
import { computed, type HTMLAttributes } from "vue";
import { cn, useTestAttrs } from "../../utils";

const props = defineProps<
  RadioGroupRootProps & { class?: HTMLAttributes["class"] }
>();
const emits = defineEmits<RadioGroupRootEmits>();

const testAttrs = useTestAttrs({
  key: "radio-card-group"
});

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return { ...delegated, testAttrs };
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <RadioGroupRoot :class="cn('grid gap-2', props.class)" v-bind="forwarded">
    <slot />
  </RadioGroupRoot>
</template>
