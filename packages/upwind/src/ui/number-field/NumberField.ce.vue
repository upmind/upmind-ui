<template>
  <NumberField
    v-bind="delegatedProps"
    v-model:modelValue="modelValue"
    :class="variants.numberField.root"
  >
    <NumberFieldContent>
      <NumberFieldDecrement />
      <NumberFieldInput :class="cn(variants.numberField.input, props.class)" />
      <NumberFieldIncrement />
    </NumberFieldContent>
  </NumberField>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./numberField.config";

// --- components
import NumberField from "./NumberField.vue";
import NumberFieldContent from "./NumberFieldContent.vue";
import NumberFieldDecrement from "./NumberFieldDecrement.vue";
import NumberFieldInput from "./NumberFieldInput.vue";
import NumberFieldIncrement from "./NumberFieldIncrement.vue";

// --- utils
import { omit } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { NumberFieldProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<NumberFieldProps>(), {
  // -- variants
  size: "md",
  width: "full",
  // --- styles
  upwindConfig: () => ({ numberField: {} }),
  class: "",
});

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const delegatedProps = computed(() =>
  omit(props, ["class", "upwindConfig", "modelValue", "size", "width"])
);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.modelValue,
});

const meta = computed(() => ({
  size: props.size,
  width: props.width,
}));

const variants = useStyles(
  ["numberField"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  numberField: {
    root: string;
    input: string;
  };
}>;
</script>
