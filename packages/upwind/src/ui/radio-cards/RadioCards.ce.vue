<template>
  <RadioGroup
    :model-value="modelValue"
    :default-value="defaultValue"
    :required="props.required"
    :disabled="props.disabled"
    :class="cn(variants.radioCards.root, props.class)"
    @update:model-value="onChange"
  >
    <template v-for="(item, index) in items" :key="item.id || index">
      <RadioCardItemExpandable
        v-if="item.values"
        :item="item"
        :name="props.name"
        :model-value="modelValue"
        :variants="variants"
      >
        <template #item="slotProps">
          <slot name="item" v-bind="slotProps" />
        </template>
      </RadioCardItemExpandable>

      <RadioCardItem
        v-else
        :item="item"
        :index="index"
        :name="props.name"
        :required="props.required"
        :disabled="props.disabled"
        :radio-class="props.radioClass"
        :model-value="modelValue"
        :variants="variants"
      >
        <template #item="slotProps">
          <slot name="item" v-bind="slotProps" />
        </template>
      </RadioCardItem>
    </template>
  </RadioGroup>
</template>

<script setup lang="ts">
// ---external
import { computed, ref } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./radioCards.config";

// --- components
import { RadioGroup, RadioGroupItem } from "../radio-group";
import { Label } from "../label";
import RadioCardItemExpandable from "./RadioCardItemExpandable.vue";
import RadioCardItem from "./RadioCardItem.vue";

// --- utils
import { find } from "lodash-es";

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
  ring: true,
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
  color: props.color,
  layout: props.layout,
  variant: props.variant,
  ring: props.ring,
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

// Add isExpanded state
const isExpanded = ref(false);
</script>
