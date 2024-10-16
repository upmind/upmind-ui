<template>
  <Collapsible v-model:open="open">
    <CollapsibleTrigger
      :as="Button"
      type="button"
      :color="props.color"
      :variant="props.variant"
      :class="cn('group w-full', variants.radioSelect.trigger, props.class)"
      block
      size="sm"
    >
      <span v-if="selected">
        <slot name="selected" v-bind="{ item: selected }">
          {{ selected?.label || props.label }}
        </slot>
      </span>

      <span v-else class="opacity-50">
        <slot name="placeholder">{{ props.placeholder }}</slot>
      </span>
    </CollapsibleTrigger>

    <CollapsibleContent>
      <RadioGroup
        :model-value="modelValue"
        :default-value="defaultValue"
        :class="variants.radioSelect.items"
        @update:model-value="onChange"
      >
        <div
          v-for="(item, index) in items"
          :key="item.id || index"
          :class="variants.radioSelect.item"
        >
          <RadioGroupItem
            :id="`${props.name}-${index}`"
            :value="item.value"
            :name="props.name"
            :class="variants.radioSelect.input"
          />

          <Label
            :for="`${props.name}-${index}`"
            :class="cn(variants.radioSelect.label)"
          >
            <slot name="item" v-bind="{ item, index }">
              {{ item.label }}
            </slot>
          </Label>
        </div>
      </RadioGroup>
    </CollapsibleContent>
  </Collapsible>
</template>

<script setup lang="ts">
// ---external
import { ref, computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./radioSelect.config";

// --- components
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../collapsible";
import { Button } from "../button";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import { Label } from "../label";
// --- utils
import { find } from "lodash-es";

// --- types
import type { RadioSelectProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<RadioSelectProps>(), {
  // --- props
  loading: false,
  placeholder: "Select an option",
  required: false,
  // -- variants
  color: "base",
  variant: "control",
  // --- styles
  class: "",
});

const emits = defineEmits(["update:modelValue"]);
const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const open = ref(false);

const meta = computed(() => ({
  color: props.color,
}));

const variants = useStyles(
  ["radioSelect"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  radioSelect: {
    trigger: string;
    items: string;
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

  open.value = false;
}
</script>
