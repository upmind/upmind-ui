<template>
  <RadioGroup
    :model-value="modelValue"
    :default-value="defaultValue"
    :required="props.required"
    :disabled="props.disabled"
    :class="cn(variants.radioCards.root, props.class)"
    @update:model-value="onChange"
  >
    <div class="grid grid-cols-12 gap-x-3">
      <div
        v-for="(item, index) in items"
        :key="item.id || index"
        v-auto-animate
        class="col-span-12"
        :class="{
          [`mt-${props.gap}`]: !item.group || item.primary,
          [`md:col-span-${props.size}`]: props.size,
        }"
      >
        <RadioCardItemExpandable
          v-if="item.group"
          :item="item"
          :name="props.name || ''"
          :required="props.required"
          :disabled="props.disabled"
          :model-value="modelValue"
          :variants="variants"
          :expanded="expandedItems.has(item.group ?? '')"
          :is-last-in-group="isLastInGroup(item, index)"
          @expand="toggleExpanded(item.group)"
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
          :label="item?.label"
          :required="props.required"
          :disabled="props.disabled"
          :model-value="modelValue"
          :variants="variants"
          :expanded="expandedItems.has(item.group ?? '')"
        >
          <template #item="slotProps">
            <slot name="item" v-bind="slotProps" />
          </template>
        </RadioCardItem>
      </div>
    </div>
  </RadioGroup>
</template>

<script setup lang="ts">
// ---external
import { computed, ref } from "vue";
import { useVModel } from "@vueuse/core";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./radioCards.config";

// --- components
import { RadioGroup } from "../radio-group";
import RadioCardItemExpandable from "./RadioCardItemExpandable.vue";
import RadioCardItem from "./RadioCardItem.vue";

// --- utils
import { xor } from "lodash-es";

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
  size: 12,
  gap: 2,
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

function onChange(value: any) {
  if (!props.required && modelValue.value == value)
    modelValue.value = undefined;
  else modelValue.value = value;
}

const expandedItems = ref(new Set<string>());
function toggleExpanded(itemId: string) {
  expandedItems.value = new Set(xor([...expandedItems.value], [itemId]));
}

function isLastInGroup(currentItem: any, currentIndex: number) {
  if (!currentItem.group) return true;
  const nextItem = props.items[currentIndex + 1];
  return !nextItem || nextItem.group !== currentItem.group;
}
</script>
