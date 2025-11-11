<script setup lang="ts">
import { NumberFieldInput } from "radix-vue";
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";
import { toNumber } from "lodash-es";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const emit = defineEmits<{
  (e: "resize", value: number): void;
}>();

const handleResize = (event: InputEvent) => {
  const input = event.target as HTMLInputElement;
  const numericValue = toNumber(input.value);
  if (!isNaN(numericValue)) {
    emit("resize", numericValue);
  }
};
</script>

<template>
  <NumberFieldInput
    data-slot="input"
    @input="handleResize"
    :class="
      cn(
        'border-input bg-background placeholder:text-muted-foreground flex h-10 w-full rounded-lg border py-2 text-center text-sm',
        props.class
      )
    "
  />
</template>
