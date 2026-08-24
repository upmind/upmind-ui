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
    <Select
      name="terms"
      :model-value="props.modelValue?.toString()"
      :items="termOptions"
      :disabled="props.disabled || props.processing"
      :aria-invalid="hasErrors || undefined"
      size="lg"
      class="w-full"
      :ui="{ content: 'max-h-74' }"
      @update:model-value="doResolve"
    >
      <template #value>
        <TermRow
          v-if="selectedTerm"
          v-bind="selectedTerm"
          :overridden="overridden"
        />
        <span v-else class="text-muted">{{
          t("form.select_option.placeholder")
        }}</span>
      </template>
      <template #item="{ option }">
        <TermRow v-bind="option.term" :overridden="overridden" />
      </template>
    </Select>
  </component>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Select } from "@upmind/ui";
import { FormField } from "../../../../components/form";
import TermRow from "./TermRow.vue";
import { isArray, isNil, toNumber } from "lodash-es";
import type { TermDetails } from "@upmind-automation/headless";
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------
const emits = defineEmits(["update:modelValue"]);
const props = withDefaults(
  defineProps<{
    as?: string;
    items: TermDetails[];
    modelValue?: string | number;
    errors?: string | string[];
    // ---
    label?: string;
    description?: string;
    /** `true` when an active option/category overrides product price — hides price/promo in term cards. */
    overridden?: boolean;
    // --- state
    required?: boolean;
    disabled?: boolean;
    loading?: boolean;
    processing?: boolean;
    visible?: boolean;
    touched?: boolean;
    // ---
    class?: HTMLAttributes["class"];
  }>(),
  {
    as: "FormField",
    required: true,
    disabled: false,
    loading: false,
    processing: false,
    visible: true
  }
);

const { t } = useI18n();

const hasItems = computed(() => {
  return !isNil(props.modelValue) && !!props.items?.length;
});

const hasErrors = computed(() => {
  if (isArray(props.errors)) return props.errors.length > 0;
  return !!props.errors;
});

// The selected term, rendered in the trigger as the same row as the dropdown
// options (label + badges + price) — not just its label.
const termOptions = computed(() =>
  (props.items ?? []).map(term => ({
    value: term.cycle?.toString() ?? "",
    term
  }))
);

const selectedTerm = computed(() =>
  props.items?.find(
    term => term.cycle?.toString() === props.modelValue?.toString()
  )
);

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
