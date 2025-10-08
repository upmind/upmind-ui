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
  defaultValue: props.defaultValue
});
</script>

<template>
  <div
    :class="
      cn(
        'focus-within:ring-ring border-input bg-background ring-offset-core-canvas placeholder:text-muted-foreground flex w-full overflow-hidden rounded border text-sm transition-[box-shadow,transform,opacity] duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-within:ring-2 focus-within:ring-offset-2 focus-within:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
    data-testid="input-extended"
  >
    <slot name="prepend" />
    <input
      v-model="modelValue"
      :class="cn(props.inputClass, 'w-full focus:ring-0 focus:outline-none')"
      v-bind="$attrs"
      data-testid="text-input"
    />
    <slot name="append" />
  </div>
</template>
