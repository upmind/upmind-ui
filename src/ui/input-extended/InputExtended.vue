<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { useVModel } from "@vueuse/core";
import { cn } from "../../utils";

const props = defineProps<{
  defaultValue?: string | number;
  modelValue?: string | number;
  class?: HTMLAttributes["class"];
  inputClass?: HTMLAttributes["class"];
}>();

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});
</script>

<template>
  <div
    :class="
      cn(
        'focus-within:ring-ring flex w-full overflow-hidden rounded-md border border-input bg-background text-sm ring-offset-background transition-[box-shadow,transform,opacity] duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
  >
    <slot name="prepend" />
    <input
      v-model="modelValue"
      :class="cn(props.inputClass, 'w-full focus:outline-none focus:ring-0')"
      v-bind="$attrs"
    />
    <slot name="append" />
  </div>
</template>
