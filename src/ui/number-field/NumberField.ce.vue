<template>
  <NumberField
    v-bind="delegatedProps"
    v-model:modelValue="modelValue"
    :class="cn(styles.numberField.root, props.class)"
  >
    <NumberFieldContent>
      <NumberFieldDecrement
        class="rounded-l-lg"
        :size="props.size"
        :class="styles.numberField.input"
      >
        <NumberFieldIcon icon="minus" :variant="props.variant" />
      </NumberFieldDecrement>

      <NumberFieldInput
        @input="handleInputForWidth"
        :class="cn(styles.numberField.field, props.classField)"
        data-testid="quantity-input"
      />
      <NumberFieldIncrement
        class="rounded-r-lg"
        :size="props.size"
        :class="styles.numberField.input"
      >
        <NumberFieldIcon icon="plus" :variant="props.variant" />
      </NumberFieldIncrement>
    </NumberFieldContent>
  </NumberField>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./numberField.config";

// --- components
import NumberField from "./NumberField.vue";
import NumberFieldContent from "./NumberFieldContent.vue";
import NumberFieldDecrement from "./NumberFieldDecrement.vue";
import NumberFieldInput from "./NumberFieldInput.vue";
import NumberFieldIncrement from "./NumberFieldIncrement.vue";
import NumberFieldIcon from "./NumberFieldIcon.vue";

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
  classField: ""
});

const modelValue = defineModel<number>();

const delegatedProps = computed(() =>
  omit(props, ["class", "uiConfig", "modelValue", "size", "width", "variant"])
);

// Track value ONLY for instant width calculation - not used for modelValue updates
const internalValue = ref(modelValue.value);

const handleInputForWidth = (value: number) => {
  internalValue.value = value;
};

const meta = computed(() => {
  const digits = internalValue.value?.toString().length || 1;
  const count = Math.min(digits, 10).toString();

  return {
    size: props.size,
    width: props.width,
    count: count,
    variant: props.variant,
    isDisabled: props.disabled
  };
});

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
