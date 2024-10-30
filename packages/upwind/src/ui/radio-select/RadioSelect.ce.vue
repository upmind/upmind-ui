<template>
  <Collapsible
    v-model:open="open"
    :disabled="props.disabled"
    :class="variants.radioSelect.root"
  >
    <CollapsibleTrigger as-child>
      <Button
        :loading="props.loading"
        :class="cn('group w-full', variants.radioSelect.trigger, props.class)"
        :size="props.size"
        :aria-expanded="open"
        :color="props.color"
        :variant="props.variant"
      >
        <span v-if="selected" class="w-full">
          <slot name="selected" v-bind="{ item: selected }">
            {{ selected?.label || props.label }}
          </slot>
        </span>

        <span v-else class="opacity-50">
          <slot name="placeholder">{{ props.placeholder }}</slot>
        </span>

        <template #append>
          <Icon
            class="ml-auto opacity-75 transition-all duration-200 group-aria-expanded:rotate-180"
            icon="arrow-down"
            size="xs"
          />
        </template>
      </Button>
    </CollapsibleTrigger>

    <CollapsibleContent>
      <RadioGroup
        :disabled="props.disabled"
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
            :required="props.required"
            :disabled="props.disabled"
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
    root: string;
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

if (props.required && !modelValue.value) {
  emits("update:modelValue", first(props.items)?.value);
}
</script>
