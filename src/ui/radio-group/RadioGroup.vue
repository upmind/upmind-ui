<script setup lang="ts">
import {
  RadioGroupRoot,
  type RadioGroupRootEmits,
  type RadioGroupRootProps,
  useForwardPropsEmits
} from "radix-vue";
import { computed, type HTMLAttributes } from "vue";
import { assign } from "lodash-es";
import { cn, useDisabled } from "../../utils";

const props = defineProps<
  RadioGroupRootProps & { class?: HTMLAttributes["class"] }
>();
const emits = defineEmits<RadioGroupRootEmits>();

const isDisabled = useDisabled(() => props.disabled);

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return assign(delegated, { disabled: isDisabled.value });
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <RadioGroupRoot
    :class="cn('grid gap-2', props.class)"
    v-bind="forwarded"
    data-test-key="radio-card-group"
  >
    <slot />
  </RadioGroupRoot>
</template>
