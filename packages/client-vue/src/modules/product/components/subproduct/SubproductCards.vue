<template>
  <FormField
    :id="subproduct.id"
    :name="subproduct.id"
    :class="styles.product.config.list.root"
    :required="subproduct.meta.required"
    :disabled="props.disabled"
    :visible="props.visible"
    :dirty="blurred"
    :errors="props.errors"
    :label="subproduct.title"
    :tooltip="
      ui.optionGroupDescription.isTooltip ? subproduct?.description : ''
    "
    :description="
      ui.optionGroupDescription.isInline ? subproduct?.description : ''
    "
    @blur="blurred = true"
    :optional-text="props.optionalText"
    :required-text="props.requiredText"
    :icon="ui.optionSelectorIcons.isVisible ? '' : ''"
  >
    <component
      :is="as"
      :id="subproduct.id"
      v-model="modelValue"
      :name="subproduct.id"
      :required="subproduct.meta.required"
      :items="parsedValues"
      :disabled="props.disabled"
      :errors="errors"
      :none-text="t('text.none')"
      :placeholder="t('form.select_option.placeholder')"
      :multiple="subproduct.meta.multiple"
      :columns="
        ui.optionSelector.value === OPTION_SELECTOR.RADIO_GRID
          ? ui.optionSelectorGrid.asNumber
          : 1
      "
    >
      <template #item="{ item: { id } }">
        <CardSubproduct
          v-bind="getSubproductValue(id)"
          :meta="meta"
          :term="props.term"
          :product-meta="getSubproductValue(id).meta"
          @update:quantity="doUpdateQuantity(id, $event)"
          :minimal="mapComponentName !== 'SelectCards'"
        />
      </template>
      <template #dropdown-item="{ item: { id } }">
        <CardSubproduct
          v-bind="getSubproductValue(id)"
          :term="props.term"
          :meta="meta"
          :product-meta="getSubproductValue(id).meta"
          @update:quantity="doUpdateQuantity(id, $event)"
          :minimal="mapComponentName !== 'SelectCards'"
        />
      </template>
    </component>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../../product.config";

// --- components
import {
  RadioCards,
  CheckboxCards,
  FormField,
  SelectCards
} from "@upmind-automation/upmind-ui";
import CardSubproduct from "./SubproductCard.vue";

// --- utils
import { find, map, get, isArray, first } from "lodash-es";

// --- types
import type {
  SubproductDetails,
  SubproductValue,
  UseMetaResult
} from "@upmind-automation/headless";
import { OPTION_SELECTOR } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const emit = defineEmits(["update:modelValue", "update:quantity"]);

const props = defineProps<{
  subproduct: SubproductDetails;
  meta: UseMetaResult;
  modelValue?: string | string[];
  quantities?: Record<string, number>;
  errors?: string;
  term?: number;
  // --- state
  disabled?: boolean;
  loading?: boolean;
  processing?: boolean;
  visible?: boolean;
  size?: number;
  optionalText?: string;
  requiredText?: string;
}>();

const { ui } = props.meta.with({
  optionGroup: () => props.subproduct
});

// ---

function safeValue(value: any): string | string[] {
  const { multiple, required } = props.subproduct.meta;
  const hasMultiple = (props.subproduct?.values?.length || 0) > 1;
  const shouldBeSingle = !multiple || (required && !hasMultiple);
  const safeArray = ((!isArray(value) ? [value] : value) ?? []) as string[];
  const safeString = (isArray(value) ? first(value) : value) ?? "";
  // otherwise, return the value as-is
  return shouldBeSingle ? safeString : safeArray;
}

const modelValue = defineModel<string | string[] | any>("modelValue", {
  get(value) {
    return safeValue(value);
  },
  set(value) {
    return safeValue(value);
  }
});

// ---
const { t } = useI18n();

const styles = useStyles(
  ["product.config.list", "product.config.list.item"],
  props,
  config
);

const as = computed(() => {
  return mapComponent(ui.optionSelector.value ?? "default");
});

const mapComponent = (name: string) => {
  const { multiple, required } = props.subproduct.meta;
  const hasMultiple = (props.subproduct?.values?.length || 0) > 1;
  switch (name) {
    case "select":
    case "select-grouped":
      return !multiple || (required && !hasMultiple)
        ? SelectCards
        : CheckboxCards;

    default:
      return !multiple || (required && !hasMultiple)
        ? RadioCards
        : CheckboxCards;
  }
};

const mapComponentName = computed(() => {
  const { multiple, required } = props.subproduct.meta;
  const hasMultiple = (props.subproduct?.values?.length || 0) > 1;
  switch (ui.optionSelector.value) {
    case "select":
    case "select-grouped":
      return !multiple || (required && !hasMultiple)
        ? "SelectCards"
        : "CheckboxCards";

    default:
      return !multiple || (required && !hasMultiple)
        ? "RadioCards"
        : "CheckboxCards";
  }
});

const parsedValues = computed(() => {
  const values = map(props.subproduct?.values, (subproduct, index) => {
    return {
      id: subproduct.id,
      value: subproduct.id.toString(), // Ensure value is a string
      label: subproduct?.title ?? "", // Add the required label property
      sublabel: subproduct?.title ?? "",
      appendLabel: subproduct?.price?.currentPrice,
      text: subproduct?.excerpt,
      item: subproduct,
      index,
      modelValue: modelValue.value
    };
  });

  return values;
});

function getSubproductValue(value: string): SubproductValue {
  const product = find(props.subproduct?.values, [
    "id",
    value
  ]) as SubproductValue;

  return {
    ...product,
    quantity: get(props.quantities, value, 0),
    title: product?.title || ""
  };
}

const blurred = ref(false);

function doUpdateQuantity(value: any, quantity: number) {
  emit("update:quantity", value, quantity);
}
</script>
