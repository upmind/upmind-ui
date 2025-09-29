<template>
  <component
    :is="useInputGroup ? RadioGroup : 'div'"
    :model-value="modelValue"
    :required="props.required"
    :disabled="props.disabled"
    :class="cn(styles.radioCards.root, props.class)"
    data-testid="radio-card-group"
    @update:model-value="onChange"
  >
    <template v-for="(option, index) in items" :key="option.id || index">
      <RadioCardItem
        :item="option.item"
        :index="option.index || overrideIndex || index"
        :name="props.name"
        :label="option?.label"
        :sublabel="option?.sublabel"
        :required="props.required"
        :disabled="props.disabled"
        :model-value="modelValue"
        :width="props.width"
        :value="option.value"
        :class="props.radioClass"
        :list="props.list"
        data-testid="radio-card-item"
        :uiConfig="props.uiConfig"
        @keydown.enter="onChange(option.value)"
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
import { computed } from "vue";
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
  overrideIndex: 0,
  useInputGroup: true,
  // -- variants
  width: 12,
  list: false,
  // --- styles
  class: "",
  radioClass: ""
});

const emits = defineEmits(["update:modelValue"]);
const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue
});

const meta = computed(() => ({
  isList: props.list,
  width: props.width
}));

const styles = useStyles(
  "radioCards",
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

const onChange = (value: any) => {
  if (!props.required && value === modelValue.value) {
    modelValue.value = undefined;
  } else {
    modelValue.value = value;
  }
};
</script>
