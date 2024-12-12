<template>
  <Select
    class="w-full gap-0 rounded-md border-control shadow-sm"
    v-model="modelValue"
    :default-value="defaultValue"
    :required="props.required"
    :disabled="props.disabled"
    @update:model-value="onChange"
  >
    <SelectTrigger :class="cn(variants.select, props.class)">
      <slot name="default" v-bind="{ item: selected }">
        <slot name="item" v-bind="{ item: selected }">
          {{ selected?.label }}
        </slot>
      </slot>
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem
          v-for="(item, index) in items"
          :key="index"
          :value="item.value"
        >
          <div>
            <slot name="default" v-bind="{ item, index }">
              <slot name="item" v-bind="{ item, index }">
                {{ item.label }}
              </slot>
            </slot>
          </div>
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
// ---external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./selectCards.config";

// --- components
import Select from "../select/Select.vue";
import SelectTrigger from "../select/SelectTrigger.vue";
import SelectContent from "../select/SelectContent.vue";
import SelectGroup from "../select/SelectGroup.vue";
import SelectItem from "../select/SelectItem.vue";

import Icon from "../icon/Icon.ce.vue";

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
