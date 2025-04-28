<template>
  <NumberField
    v-bind="delegatedProps"
    v-model:modelValue="modelValue"
    :class="cn(styles.numberField.root, props.class)"
  >
    <NumberFieldContent>
      <NumberFieldDecrement
        class="rounded-l-lg"
        :class="styles.numberField.input"
      />
      <NumberFieldInput
        :class="cn(styles.numberField.field, props.classField)"
        data-testid="quantity-input"
      />
      <NumberFieldIncrement
        class="rounded-r-lg"
        :class="styles.numberField.input"
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
  // -- styles
  width: "full",
  variant: "flat",
  // --- styles
  uiConfig: () => ({ numberField: [] }),
  class: "",
  classField: "",
});

const emits = defineEmits<{
  (e: "update:modelValue", payload: number): void;
}>();

const delegatedProps = computed(() =>
  omit(props, ["class", "uiConfig", "modelValue", "size", "width", "variant"])
);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.modelValue,
});

const meta = computed(() => ({
  // size: props.size,
  width: props.width,
  variant: props.variant,
  height: props.height,
}));

const styles = useStyles(
  ["numberField"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  numberField: {
    root: string;
    input: string;
    field: string;
  };
}>;
</script>
