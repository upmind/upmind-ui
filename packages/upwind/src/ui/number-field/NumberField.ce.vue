<template>
  <NumberField v-bind="delegatedProps" v-model:modelValue="modelValue">
    <NumberFieldContent>
      <NumberFieldDecrement />
      <NumberFieldInput :class="cn(variants.numberField, props.class)" />
      <NumberFieldIncrement />
    </NumberFieldContent>
  </NumberField>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- components
import NumberField from "./NumberField.vue";

// --- internal
import config from "./number-field.config";
import { useStyles, cn } from "../../utils";

// --- utils
import { omit } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { NumberFieldProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<NumberFieldProps>(), {
  upwindConfig: () => ({ numberField: {} }),
  class: "",
});

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const delegatedProps = computed(() =>
  omit(props, ["class", "upwindConfig", "modelValue", "modelValue"])
);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.modelValue,
});

const meta = computed(() => ({
  size: props.size,
}));

const variants = useStyles(
  ["numberField"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ numberField: string }>;
</script>
