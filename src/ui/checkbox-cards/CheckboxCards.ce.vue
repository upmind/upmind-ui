<template>
  <CheckboxGroup
    :model-value="modelValue"
    :default-value="defaultValue"
    :required="props.required"
    :disabled="props.disabled"
    :class="cn(styles.checkboxCards.root, props.class)"
    @update:model-value="onChange"
  >
    <div
      v-for="(item, index) in items"
      :key="item.id || index"
      tabindex="0"
      @keydown.enter="onChange(item.value)"
      :class="styles.checkboxCards.item"
    >
      <CheckboxGroupItem
        :id="`${props.name}-${index}`"
        :value="item.value"
        :name="props.name"
        :required="props.required"
        :disabled="props.disabled"
        :no-input="props.noInput"
        :class="styles.checkboxCards.input"
      >
        <Label
          :for="`${props.name}-${index}`"
          :class="cn(styles.checkboxCards.label)"
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
import type { CheckboxCardsProps, CheckboxCardsItemProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<CheckboxCardsProps>(), {
  // --- props
  loading: false,
  placeholder: "Select an option",
  required: false,
  // -- styles
  color: "base",
  variant: "control",
  // layout: "list",
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
  // layout: props.layout,
  isList: props.list,
  noInput: props.noInput,
}));

const styles = useStyles(
  ["checkboxCards"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  checkboxCards: {
    trigger: string;
    root: string;
    item: string;
    input: string;
    label: string;
  };
}>;

// allow for toggle of selected item
function onChange(value: any) {
  if (modelValue.value == value || !value) {
    modelValue.value = undefined;
  } else {
    modelValue.value = value;
  }
}
</script>
