<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { NumberFieldIncrement, useForwardProps } from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn, useTestAttrs } from "../../utils";
import type { NumberFieldIncrementProps } from "radix-vue";

const props = defineProps<
  NumberFieldIncrementProps & { class?: HTMLAttributes["class"] }
>();

const testAttrs = useTestAttrs({
  key: "number-field-increment"
});

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return { ...delegated, ...testAttrs };
});

const forwarded = useForwardProps(delegatedProps);
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
