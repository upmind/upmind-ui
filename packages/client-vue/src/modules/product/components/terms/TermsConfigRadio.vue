<template>
  <component
    :is="mapComponent(props.as)"
    v-if="hasItems"
    id="terms"
    name="terms"
    :class="styles.terms.radio.root"
    :label="props.label"
    :required="props.required"
    :disabled="props.disabled || props.processing"
    :visible="props.visible"
    :errors="props.errors"
    :tooltip="props.description"
  >
    <RadioCards
      id="terms"
      name="terms"
      :required="props.required"
      :items="parsedValues"
      :disabled="props.disabled || props.processing"
      :errors="props.errors"
      :none-text="t('text.none')"
      :placeholder="t('form.select_option.placeholder')"
      :class="styles.terms.radio.items"
      :model-value="props.modelValue?.toString()"
      @update:modelValue="doResolve"
      :columns="type === TERM_SELECTOR.RADIO_ROWS ? 1 : 0"
    >
      <template #item="{ item }">
        <CardTerm v-bind="item" :summary="summary" :overridden="overridden" />
      </template>
    </RadioCards>
  </component>

  <!-- <pre v-if="errors">{{ errors }}</pre> -->
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  TERM_SELECTOR,
  GRID_LAYOUT,
  type TermSelector,
  type GridLayout
} from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import { FormField, RadioCards } from "@upmind-automation/upmind-ui";
import CardTerm from "./TermCard.vue";
import config from "./terms.config";
import { isNil, map, toNumber } from "lodash-es";
import type { TermDetails } from "@upmind-automation/headless";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------
const emits = defineEmits(["update:modelValue"]);
const props = withDefaults(
  defineProps<{
    as?: string;
    type?: TermSelector;
    gridLayout?: GridLayout;
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

const { t } = useI18n();

const stylesMeta = computed(() => ({
  type: props.type,
  columns:
    props.type === TERM_SELECTOR.RADIO_ROWS
      ? GRID_LAYOUT.ONE_COL
      : props.columns,
  disabled: props.disabled
}));

const styles = useStyles(
  ["terms.radio", "terms.radio.item"],
  stylesMeta,
  config
);

const parsedValues = computed<RadioCardsItemProps[]>(() => {
  return map(props.items, (item: TermDetails, index: number) => {
    return {
      id: item.cycle,
      value: item.cycle?.toString(),
      label: item.title,
      item: item, // Ensure the `item` property is included
      index: index, // Add the `index` property
      modelValue: props.modelValue?.toString() // Add the `modelValue` property
    } as RadioCardsItemProps;
  });
});

const hasItems = computed(() => {
  return !isNil(props.modelValue) && !!props.items?.length;
});

function doResolve(value: string | number | undefined) {
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
