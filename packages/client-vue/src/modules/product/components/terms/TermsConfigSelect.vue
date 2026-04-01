<template>
  <component
    :is="mapComponent(props.as)"
    v-if="hasItems"
    id="terms"
    name="terms"
    :class="styles.terms.select.root"
    :label="props.label"
    :required="props.required"
    :disabled="props.disabled || props.processing"
    :visible="props.visible"
    :errors="props.errors"
    :tooltip="props.description"
  >
    <SelectCards
      id="terms"
      name="terms"
      :required="props.required"
      :items="parsedValues"
      :disabled="props.disabled || props.processing"
      :errors="props.errors"
      :touched="props.touched"
      :placeholder="t('form.select_option.placeholder')"
      :model-value="props.modelValue?.toString()"
      content-class="max-h-74!"
      @update:modelValue="doResolve"
    >
      <template #item="slotProps">
        <slot name="item" v-bind="slotProps">
          <CardTerm
            v-bind="slotProps.item"
            :class="props.class"
            layout="inline"
            :summary="false"
          />
        </slot>
      </template>
      <template #dropdown-item="slotProps">
        <slot name="dropdown" v-bind="slotProps">
          <CardTerm
            v-bind="slotProps.item"
            :class="props.class"
            layout="inline"
            :summary="false"
          />
        </slot>
      </template>
    </SelectCards>
  </component>

  <!-- <pre v-if="errors">{{ errors }}</pre> -->
</template>

<script lang="ts" setup>
// --- external
import { computed, toRefs } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./terms.config";

// --- components
import { FormField, SelectCards } from "@upmind-automation/upmind-ui";
import CardTerm from "./TermCard.vue";

// --- utils
import { isNil, map, toNumber } from "lodash-es";

// --- types
import type { HTMLAttributes } from "vue";
import type { SelectCardsItemProps } from "@upmind-automation/upmind-ui";
import type { TermDetails } from "@upmind-automation/headless";

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

const styles = useStyles(["terms.select"], toRefs(props), config);

const parsedValues = computed<SelectCardsItemProps[]>(() => {
  return map(props.items, (item: TermDetails, index: number) => {
    return {
      id: item.cycle,
      value: item.cycle?.toString(),
      label: item.title,
      item: item, // Ensure the `item` property is included
      index: index, // Add the `index` property
      modelValue: props.modelValue?.toString() // Add the `modelValue` property
    } as SelectCardsItemProps;
  });
});

const hasItems = computed(() => {
  return !isNil(props.modelValue) && !!props.items?.length;
});

function doResolve(value: string | number) {
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
