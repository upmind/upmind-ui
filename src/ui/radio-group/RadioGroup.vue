<script setup lang="ts">
import {
  RadioGroupRoot,
  type RadioGroupRootEmits,
  type RadioGroupRootProps
} from "radix-vue";
import { computed, type HTMLAttributes } from "vue";
import { cn, useForwardPropsEmitsTests } from "../../utils";

const props = defineProps<
  RadioGroupRootProps & { class?: HTMLAttributes["class"] }
>();
const emits = defineEmits<RadioGroupRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmitsTests(delegatedProps, emits, {
  key: "radio-card-group"
});
</script>

<template>
  <RadioGroupRoot :class="cn('grid gap-2', props.class)" v-bind="forwarded">
    <slot />
  </RadioGroupRoot>
</template>
