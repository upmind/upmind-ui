<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { useVModel } from "@vueuse/core";
import { cn } from "../../utils";

const props = defineProps<{
  defaultValue?: string | number;
  modelValue?: string | number;
  class?: HTMLAttributes["class"];
}>();

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue
});
</script>

<template>
  <input
    v-model="modelValue"
    :class="
      cn(
        'focus-visible:ring-ring border-input bg-background ring-offset-background placeholder:text-muted-foreground flex h-10 w-full rounded-lg border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
    data-testid="text-input"
  />
</template>
