<template>
  <Collapsible v-model:open="open">
    <CollapsibleTrigger class="group w-full">
      <Button
        :color="props.color"
        :variant="props.variant"
        :class="cn(variants.radioSelect.trigger, props.class)"
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
      </Button>
    </CollapsibleTrigger>

    <CollapsibleContent>
      <RadioGroup
        v-model="modelValue"
        :default-value="defaultValue"
        :class="variants.radioSelect.items"
        @update:model-value="open = !open"
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

        <!-- Reset/Clear/None Item -->
        <div :class="cn(variants.radioSelect.item)">
          <RadioGroupItem
            :id="`${props.name}-none`"
            :value="undefined"
            :name="props.noneText"
            :class="variants.radioSelect.input"
          />

          <Label
            :for="`${props.name}-none`"
            :class="cn(variants.radioSelect.label)"
            v-if="noneText"
          >
            <slot
              name="none"
              v-bind="{ item: { value: null, label: props.noneText } }"
            >
              {{ props.noneText }}
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
  noneText: "None",
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
  width: props.width,
}));

const variants = useStyles(
  ["radioSelect"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  radioSelect: { trigger: string; content: string };
}>;

const selected = computed(() => find(props.items, { value: modelValue.value }));
</script>
