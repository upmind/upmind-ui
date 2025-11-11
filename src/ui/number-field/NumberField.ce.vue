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
import { NUMBER_FIELD_VARIANTS } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<NumberFieldProps>(), {
  // -- styles
  width: "full",
  variant: NUMBER_FIELD_VARIANTS.FLAT,
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
  return {
    size: props.size,
    width: getWidth.value,
    variant: props.variant,
    isDisabled: props.disabled
  };
});

const getWidth = computed(() => {
  const digits = internalValue.value?.toString().length || 1;
  const count = Math.min(digits, 10);

  if (props.variant === NUMBER_FIELD_VARIANTS.FLAT) {
    return props.width;
  }

  if (count <= 2) {
    return "xs";
  } else if (count <= 4) {
    return "sm";
  } else if (count <= 5) {
    return "md";
  } else if (count <= 7) {
    return "lg";
  } else if (count <= 9) {
    return "xl";
  }

  return "2xl";
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
