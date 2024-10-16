<template>
  <RadioGroup
    v-model="modelValue"
    :default-value="defaultValue"
    :class="cn(variants.radioCards.root, props.class)"
    @update:model-value="open = !open"
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
    <!-- Reset/Clear/None Item -->
    <div :class="cn(variants.radioCards.item)">
      <RadioGroupItem
        :id="`${props.name}-none`"
        :value="undefined"
        :name="props.noneText"
        :class="variants.radioCards.input"
      />

      <Label
        :for="`${props.name}-none`"
        :class="cn(variants.radioCards.label)"
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
</template>

<script setup lang="ts">
// ---external
import { ref, computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./radioCards.config";

// --- components
import { RadioGroup, RadioGroupItem } from "../radio-group";

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
  ["radioCards"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  radioCards: { trigger: string; content: string };
}>;

const selected = computed(() => find(props.items, { value: modelValue.value }));
</script>
