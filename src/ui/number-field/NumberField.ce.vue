<template>
  <NumberField
    v-bind="delegatedProps"
    :model-value="pendingValue ?? modelValue"
    @update:model-value="onUpdate"
    @pointerup.capture="pressed = false"
    :class="cn(styles.numberField.root, props.class)"
  >
    <NumberFieldContent>
      <NumberFieldDecrement
        :size="props.size"
        :class="styles.numberField.inputLeft"
      >
        <NumberFieldIcon
          :icon="
            props.variant === NUMBER_FIELD_VARIANTS.FLAT
              ? 'minus'
              : 'minus-circle'
          "
          :variant="props.variant"
        />
      </NumberFieldDecrement>

      <NumberFieldInput
        @resize="handleResize"
        :class="cn(styles.numberField.field, props.classField)"
        data-testid="quantity-input"
      />
      <NumberFieldIncrement
        :size="props.size"
        :class="styles.numberField.inputRight"
      >
        <NumberFieldIcon
          :icon="
            props.variant === NUMBER_FIELD_VARIANTS.FLAT
              ? 'plus'
              : 'plus-circle'
          "
          :variant="props.variant"
        />
      </NumberFieldIncrement>
    </NumberFieldContent>
  </NumberField>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import config from "./numberField.config";
import NumberField from "./NumberField.vue";
import NumberFieldContent from "./NumberFieldContent.vue";
import NumberFieldDecrement from "./NumberFieldDecrement.vue";
import NumberFieldIcon from "./NumberFieldIcon.vue";
import NumberFieldIncrement from "./NumberFieldIncrement.vue";
import NumberFieldInput from "./NumberFieldInput.vue";
import { NUMBER_FIELD_VARIANTS } from "./types";
import { cn, useStyles } from "../../utils";
import { omit } from "lodash-es";
import type { NumberFieldProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<NumberFieldProps>(), {
  width: "full",
  variant: NUMBER_FIELD_VARIANTS.FLAT,
  singleStep: true,
  // --- styles
  uiConfig: () => ({ numberField: [] }),
  class: "",
  classField: ""
});

const modelValue = defineModel<number>();

// When singleStep is true, we only allow one update per pointer press.
// pendingValue displays the new value instantly while the parent's debounced update is pending.
const pendingValue = ref<number>();
let pressed = false;
watch(modelValue, () => (pendingValue.value = undefined));

function onUpdate(val: number) {
  if (props.singleStep && pressed) return;
  pressed = true;
  pendingValue.value = val;
  modelValue.value = val;
}

const delegatedProps = computed(() =>
  omit(props, [
    "class",
    "uiConfig",
    "modelValue",
    "size",
    "width",
    "variant",
    "singleStep"
  ])
);

// Track value ONLY for instant width calculation - not used for modelValue updates
const internalValue = ref(modelValue.value);

const handleResize = (value: number) => {
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
  } else if (count <= 3) {
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

const styles = useStyles(["numberField"], meta, config, props.uiConfig ?? {});
</script>
