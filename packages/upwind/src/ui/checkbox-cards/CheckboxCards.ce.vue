<template>
  <CheckboxGroup
    :model-value="modelValue"
    :default-value="defaultValue"
    :required="props.required"
    :disabled="props.disabled"
    :class="cn(variants.checkboxCards.root, props.class)"
    @update:model-value="onChange"
  >
    <div
      v-for="(item, index) in items"
      :key="item.id || index"
      :class="cn(variants.checkboxCards.item)"
    >
      <CheckboxGroupItem
        :id="`${props.name}-${index}`"
        :value="item.value"
        :name="props.name"
        :required="props.required"
        :disabled="props.disabled"
        :class="variants.checkboxCards.input"
        :no-input="props.noInput"
      >
        <Label
          :for="`${props.name}-${index}`"
          :class="cn(variants.checkboxCards.label)"
        >
          <slot name="item" v-bind="{ item, index }">
            {{ item.label }}
          </slot>
        </Label>
      </CheckboxGroupItem>
    </div>
  </CheckboxGroup>
</template>

<script setup lang="ts">
// ---external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./checkboxCards.config";

// --- components
import { CheckboxGroup, CheckboxGroupItem } from "../checkbox-group";
import { Label } from "../label";

// --- utils
import { find } from "lodash-es";

// --- types
import type { CheckboxCardsProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<CheckboxCardsProps>(), {
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
  noInput: props.noInput,
}));

const variants = useStyles(
  ["checkboxCards"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  checkboxCards: {
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
</script>
