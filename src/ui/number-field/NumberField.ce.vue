<template>
  <NumberField
    v-bind="delegatedProps"
    v-model:modelValue="modelValue"
    :class="cn(variants.numberField.root, props.class)"
  >
    <NumberFieldContent>
      <NumberFieldDecrement
        class="rounded-l-lg"
        :class="variants.numberField.input"
      />
      <NumberFieldInput
        :class="cn(variants.numberField.field, props.classField)"
      />
      <NumberFieldIncrement
        class="rounded-r-lg"
        :class="variants.numberField.input"
      />
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
  width: "full",
  variant: "flat",
  // --- styles
  upwindConfig: () => ({ numberField: {} }),
  class: "",
  classField: "",
});

const emits = defineEmits<{
  (e: "update:modelValue", payload: number): void;
}>();

const delegatedProps = computed(() =>
  omit(props, [
    "class",
    "upwindConfig",
    "modelValue",
    "size",
    "width",
    "variant",
  ])
);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.modelValue,
});

const meta = computed(() => ({
  size: props.size,
  width: props.width,
  variant: props.variant,
  height: props.height,
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
    field: string;
  };
}>;
</script>
