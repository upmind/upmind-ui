<template>
  <component
    :is="useInputGroup ? RadioGroup : 'div'"
    :model-value="modelValue"
    :required="props.required"
    :disabled="props.disabled"
    :class="cn(styles.radioCards.root, props.class)"
    @update:model-value="onChange"
  >
    <template v-for="(item, index) in items" :key="item.id || index">
      <RadioCardItem
        :item="item"
        :index="overrideIndex || index"
        :name="props.name"
        :label="item?.label"
        :required="props.required"
        :disabled="props.disabled"
        :model-value="modelValue"
        :data-state="modelValue === item.value ? 'checked' : 'unchecked'"
        :width="props.width"
        @keydown.enter="onChange(item.value)"
      >
        <template #item="slotProps">
          <slot name="item" v-bind="slotProps" />
        </template>
      </RadioCardItem>
    </template>
  </component>
</template>

<script setup lang="ts">
// ---external
import { computed, ref } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./radioCards.config";

// --- components
import { RadioGroup } from "../radio-group";
import RadioCardItem from "./RadioCardItem.vue";

// --- types
import type { RadioCardsProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<RadioCardsProps>(), {
  // --- props
  placeholder: "Select an option",
  overrideIndex: 0,
  useInputGroup: true,
  // -- variants
  width: 12,
  // --- styles
  class: "",
  radioClass: "",
});

const emits = defineEmits(["update:modelValue"]);
const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const meta = computed(() => ({
  width: props.width,
}));

const styles = useStyles(
  ["radioCards"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  radioCards: {
    trigger: string;
    root: string;
    item: string;
    radio: string;
    input: string;
    label: string;
  };
}>;

const handleFocus = (value: any) => {
  onChange(value);
};

const onChange = (value: any) => {
  if (!props.required && value === modelValue.value) {
    modelValue.value = undefined;
  } else {
    modelValue.value = value;
  }
};
</script>
