<template>
  <component
    :is="popover ? Popover : Collapsible"
    v-model:open="open"
    :disabled="disabled"
    class="w-full"
  >
    <RadioGroup
      :disabled="disabled"
      :model-value="modelValue"
      :default-value="defaultValue"
      @update:model-value="onChange"
      :class="variants.radioSelect.group"
    >
      <component :is="popover ? PopoverTrigger : CollapsibleTrigger" as-child>
        <Button
          :loading="loading"
          :class="
            cn('group !w-full', variants.radioSelect.trigger, props.class)
          "
          :size="size"
          :aria-expanded="open"
          :color="color"
          :variant="variant"
          block
        >
          <RadioGroupItem
            v-if="radio"
            :id="manuallySelected ? manuallySelected.value : first(items).value"
            :value="
              manuallySelected ? manuallySelected.value : first(items).value
            "
            :name="props.name"
            :required="props.required"
            :disabled="props.disabled"
          />

          <slot v-if="selected" name="selected" v-bind="{ item: selected }">
            <slot name="selected" v-bind="{ item: selected }">
              {{ selected?.label || label }}
            </slot>
          </slot>

          <slot v-if="!selected" name="placeholder" v-bind="{ item: selected }">
            <span class="opacity-50">
              <slot name="placeholder">{{ placeholder }}</slot>
            </span>
          </slot>

          <template #append>
            <Icon
              class="ml-auto opacity-75 transition-all duration-200 group-aria-expanded:rotate-180"
              icon="arrow-down"
              size="xs"
            />
          </template>
        </Button>
      </component>

      <component
        :is="popover ? PopoverContent : CollapsibleContent"
        class="!w-[--radix-popover-trigger-width] p-0"
      >
        <div
          v-for="(item, index) in items"
          :key="item.id || index"
          :class="variants.radioSelect.item"
        >
          <!-- Required for the selector to work -->
          <RadioGroupItem
            :id="`${name}-${overrideIndex + index || index}`"
            :value="item.value"
            :name="name"
            :required="required"
            :disabled="disabled"
            class="hidden"
          />

          <Label
            :for="`${name}-${overrideIndex + index || index}`"
            :class="cn(variants.radioSelect.label)"
          >
            <slot name="item" v-bind="{ item, index }">
              {{ item.label }}
            </slot>
          </Label>
        </div>
      </component>
    </RadioGroup>
  </component>
</template>

<script lang="ts" setup>
// ---external
import { ref, computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./radioSelect.config";

// --- components
import { Icon } from "../icon";
import { Button } from "../button";
import { Label } from "../label";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../collapsible";

// --- components
import { Popover, PopoverTrigger, PopoverContent } from "../popover";

// --- utils
import { find, first } from "lodash-es";

// --- types
import type { RadioSelectProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<RadioSelectProps>(), {
  // --- props
  loading: false,
  placeholder: "Select an option",
  required: false,
  overrideIndex: 0,
  popover: true,
  radio: true,
  // -- variants
  color: "base",
  variant: "control",
  width: "full",
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
  popover: props.popover,
}));

const variants = useStyles(
  ["radioSelect"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  radioSelect: {
    root: string;
    trigger: string;
    items: string;
    item: string;
    input: string;
    label: string;
    group: string;
  };
}>;

const selected = computed(() => find(props.items, { value: modelValue.value }));
const manuallySelected = computed(() => {
  return selected.value && selected.value !== first(props.items)
    ? selected.value
    : undefined;
});

// allow for toggle of selected item
function onChange(value: any) {
  if (!props.required && modelValue.value == value)
    modelValue.value = undefined;
  else modelValue.value = value;

  open.value = false;
}

if (props.required && !modelValue.value) {
  emits("update:modelValue", first(props.items)?.value);
}
</script>
