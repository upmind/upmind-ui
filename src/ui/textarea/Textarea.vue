<script setup lang="ts">
import { useVModel } from "@vueuse/core";
import { cn } from "../../utils";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  defaultValue?: string | number;
  modelValue?: string | number;
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
  <textarea
    v-model="modelValue"
    :class="
      cn(
        'placeholder:text-muted-foreground flex min-h-20 w-full bg-transparent px-3 py-2 text-sm focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
  />
</template>
