<template>
  <component
    :is="meta.isCollapsible ? Collapsible : Dropdown"
    v-bind="props"
    v-model="modelValue"
  >
    <template #placeholder>
      <slot name="placeholder" />
    </template>
    <template #item="{ item }">
      <slot name="item" :item="item" />
    </template>
    <template #dropdown-item="{ item }">
      <slot name="dropdown-item" :item="item" />
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Collapsible from "./Collapsible.vue";
import Dropdown from "./Dropdown.vue";
import type { SelectCardsProps } from "./types";
import { useVModel } from "@vueuse/core";

const props = withDefaults(defineProps<SelectCardsProps>(), {
  variant: "dropdown",
  loading: false,
  placeholder: "Select an option",
  required: false,
  overrideIndex: 0,
  useInputGroup: true,
  width: "full",
  separate: false,
  class: "",
  contentClass: "",
});

const emits = defineEmits(["update:modelValue"]);
const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const meta = computed(() => ({
  isCollapsible: props.variant === "collapsible",
}));
</script>
