<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { NumberFieldIncrement } from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn, useForwardPropsTests } from "../../utils";
import type { NumberFieldIncrementProps } from "radix-vue";

const props = defineProps<
  NumberFieldIncrementProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsTests(delegatedProps, {
  key: "number-field-increment"
});
</script>

<template>
  <NumberFieldIncrement
    data-slot="increment"
    v-bind="forwarded"
    :class="
      cn(
        'absolute top-1/2 right-0 flex -translate-y-1/2 cursor-pointer items-center justify-center p-3 disabled:cursor-not-allowed disabled:opacity-20',
        props.class
      )
    "
  >
    <slot>
      <Plus class="h-4 w-4" />
    </slot>
  </NumberFieldIncrement>
</template>
