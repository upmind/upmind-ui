<template>
  <SelectRoot
    class="w-full gap-0 rounded-md border-control shadow-sm"
    v-model="modelValue"
    :default-value="defaultValue"
    :required="props.required"
    :disabled="props.disabled"
    @update:model-value="onChange"
  >
    <SelectTrigger
      :class="cn(variants.select, props.class)"
      class="flex items-center px-4 py-3"
    >
      <slot name="item" v-bind="{ item: selected, index: 0 }">
        {{ selected?.label }}
      </slot>
    </SelectTrigger>
    <SelectContent
      class="z-50 max-h-96 overflow-y-scroll border bg-white shadow"
    >
      <SelectGroup>
        <SelectItem
          v-for="(item, index) in items"
          :key="index"
          :value="item.value"
          class="p-4"
        >
          <slot name="item" v-bind="{ item, index }">
            {{ item.label }}
          </slot>
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </SelectRoot>
</template>

<script setup lang="ts">
// ---external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./selectCards.config";

// --- components
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
} from "radix-vue";

// --- utils
import { find } from "lodash-es";

// --- types
import type { SelectCardsProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<SelectCardsProps>(), {
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
  ["select"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  select: [];
}>;

const selected = computed(() => find(props.items, { value: modelValue.value }));

// allow for toggle of selected item
function onChange(value: any) {
  console.log("onChange", value);
  modelValue.value = value;
}
</script>
