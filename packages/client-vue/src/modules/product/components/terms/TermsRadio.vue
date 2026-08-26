<template>
  <component
    :is="mapComponent(props.as)"
    v-if="hasItems"
    id="terms"
    name="terms"
    :label="props.label"
    :required="props.required"
    :disabled="props.disabled || props.processing"
    :visible="props.visible"
    :errors="props.errors"
    :tooltip="props.description"
  >
    <OptionTileGroup
      name="terms"
      mode="single"
      :model-value="props.modelValue?.toString()"
      :layout="layout"
      :min-tile-width="minTileWidth"
      :columns="columns"
      :required="props.required"
      :disabled="props.disabled || props.processing"
      @update:model-value="doResolve"
    >
      <TermTile
        v-for="term in props.items"
        :key="term.cycle"
        v-bind="term"
        :summary="summary"
        :overridden="overridden"
      />
    </OptionTileGroup>
  </component>
</template>

<script lang="ts" setup>
import { OptionTileGroup } from "@upmind/ui";
import { computed } from "vue";
import { TERM_SELECTOR, type TermSelector } from "@upmind-automation/headless";
import { FormField } from "../../../../components/form";
import TermTile from "./TermTile.vue";
import { isNil, toNumber } from "lodash-es";
import type { TermDetails } from "@upmind-automation/headless";
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------
const emits = defineEmits(["update:modelValue"]);
const props = withDefaults(
  defineProps<{
    as?: string;
    type?: TermSelector;
    items: TermDetails[];
    modelValue?: string | number;
    errors?: string | string[];
    columns?: number;
    // ---
    label?: string;
    description?: string;
    summary: boolean;
    /** `true` when an active option/category overrides product price — hides price/promo in term cards. */
    overridden?: boolean;
    // --- state
    required?: boolean;
    disabled?: boolean;
    loading?: boolean;
    processing?: boolean;
    visible?: boolean;
    // ---
    class?: HTMLAttributes["class"];
  }>(),
  {
    as: "FormField",
    required: true,
    disabled: false,
    loading: false,
    processing: false,
    visible: true,
    summary: true
  }
);

const isRows = computed(() => props.type === TERM_SELECTOR.RADIO_ROWS);

const layout = computed(() => {
  if (isRows.value) return "stack";
  return "grid";
});
const minTileWidth = computed(() => "16rem");

// The configured count caps the group's auto-fill grid rather than pinning it,
// so a term card still gets a whole row to itself on a phone. Rows take no cap.
const columns = computed(() => {
  if (isRows.value) return undefined;
  return props.columns;
});

const hasItems = computed(() => {
  return !isNil(props.modelValue) && !!props.items?.length;
});

function doResolve(value: unknown) {
  if (props.disabled) return;
  emits("update:modelValue", toNumber(value));
}

const mapComponent = (as: string) => {
  switch (as.toLowerCase()) {
    case "formfield":
      return FormField;
    default:
      return as;
  }
};
</script>
