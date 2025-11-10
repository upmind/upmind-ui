<script setup lang="ts">
import { NumberFieldInput } from "radix-vue";
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const emit = defineEmits<{
  (e: "input", value: number): void;
}>();

const handleInput = (event: InputEvent) => {
  const input = event.target as HTMLInputElement;
  const cleanValue = input.value.replaceAll(",", "");
  const numericValue = Number(cleanValue);
  if (!isNaN(numericValue)) {
    emit("input", numericValue);
  }
};
</script>

<template>
  <NumberFieldInput
    data-slot="input"
    @input="handleInput"
    :class="
      cn(
        'border-input bg-background placeholder:text-muted-foreground flex h-10 w-full rounded-lg border py-2 text-center text-sm',
        props.class
      )
    "
  />
</template>
