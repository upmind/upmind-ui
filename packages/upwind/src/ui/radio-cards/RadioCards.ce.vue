<template>
  <RadioGroup
    :model-value="modelValue"
    :default-value="defaultValue"
    :required="props.required"
    :disabled="props.disabled"
    :class="cn(variants.radioCards.root, props.class)"
    @update:model-value="onChange"
  >
    <div
      v-for="(item, index) in items"
      :key="item.id || index"
      :class="cn(variants.radioCards.item)"
    >
      <RadioGroupItem
        :id="`${props.name}-${index}`"
        :value="item.value"
        :name="props.name"
        :required="props.required"
        :disabled="props.disabled"
        :class="variants.radioCards.input"
      />
      <Label
        :for="`${props.name}-${index}`"
        :class="cn(variants.radioCards.label)"
      >
        <slot name="item" v-bind="{ item, index }">
          {{ item.label }}
        </slot>
      </Label>
    </div>
  </RadioGroup>
</template>

<script setup lang="ts">
// ---external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./radioCards.config";

// --- components
import { RadioGroup, RadioGroupItem } from "../radio-group";
import { Label } from "../label";

// --- utils
import { find, first } from "lodash-es";

// --- types
import type { RadioCardsProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<RadioCardsProps>(), {
  // --- props
  loading: false,
  placeholder: "Select an option",
  required: false,
  // -- variants
  color: "base",
  variant: "control",
  layout: "list",
  // --- styles
  class: "",
});

const emits = defineEmits(["update:modelValue"]);
const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const meta = computed(() => ({
  color: props.color,
  layout: props.layout,
  variant: props.variant,
}));

const variants = useStyles(
  ["radioCards"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  radioCards: {
    trigger: string;
    root: string;
    item: string;
    input: string;
    label: string;
  };
}>;

const selected = computed(() => find(props.items, { value: modelValue.value }));

// allow for toggle of selected item
function onChange(value: any) {
  if (!props.required && modelValue.value == value)
    modelValue.value = undefined;
  else modelValue.value = value;
}

// TODO: Fix the issue where validation breaks if we don't wait 1ms
// setTimeout(() => {
//   if (props.required && !modelValue.value) {
//     const value = first(props.items)?.value;
//     if (value) emits("update:modelValue", value);
//   }
// }, 1);
</script>
