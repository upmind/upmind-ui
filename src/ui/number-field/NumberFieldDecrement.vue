<script setup lang="ts">
import { Minus } from "lucide-vue-next";
import { NumberFieldDecrement } from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn, useForwardPropsTests } from "../../utils";
import type { NumberFieldDecrementProps } from "radix-vue";

const props = defineProps<
  NumberFieldDecrementProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsTests(delegatedProps, {
  key: "number-field-decrement"
});
</script>

<template>
  <NumberFieldDecrement
    data-slot="decrement"
    v-bind="forwarded"
    :class="
      cn(
        'absolute top-1/2 left-0 flex -translate-y-1/2 cursor-pointer items-center justify-center p-3 disabled:cursor-not-allowed disabled:opacity-20',
        props.class
      )
    "
  >
    <slot>
      <Minus class="h-4 w-4" />
    </slot>
  </NumberFieldDecrement>
</template>
