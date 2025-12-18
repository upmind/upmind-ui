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
    :tooltip="subproduct?.description"
    @blur="blurred = true"
    :optional-text="props.optionalText"
    :required-text="props.requiredText"
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
      :size="subproduct.uiMeta?.uischema?.options?.size"
    >
      <template #item="{ item: { id } }">
        <CardSubproduct
          v-bind="getSubproductValue(id)"
          :term="props.term"
          @update:quantity="doUpdateQuantity(id, $event)"
          :minimal="mapComponentName !== 'SelectCards'"
        />
      </template>
      <template #dropdown-item="{ item: { id } }">
        <CardSubproduct
          v-bind="getSubproductValue(id)"
          :term="props.term"
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
import { useVModel } from "@vueuse/core";
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
import type { ComputedRef } from "vue";
import type {
  SubproductDetails,
  SubproductValue
} from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const emit = defineEmits(["update:modelValue", "update:quantity"]);

const props = defineProps<{
  subproduct: SubproductDetails;
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
) as ComputedRef<{
  product: {
    config: {
      list: {
        root: string;
      };
    };
  };
}>;

const as = computed(() => {
  return mapComponent(props.subproduct.uiMeta?.uischema?.control);
});

const mapComponent = (name: string) => {
  const { multiple, required } = props.subproduct.meta;
  const hasMultiple = (props.subproduct?.values?.length || 0) > 1;
  switch (name) {
    case "select":
    case "selectcards":
    case "SelectCards":
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
  switch (props.subproduct.uiMeta?.uischema?.control) {
    case "select":
    case "selectcards":
    case "SelectCards":
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
      group: subproduct?.uiMeta?.uischema?.group,
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
    title: product?.uiMeta?.uischema?.primary
      ? product?.uiMeta?.uischema?.group || product?.title || ""
      : product?.title || ""
    // icon: product?.uiMeta?.uischema?.icon //Is this used?
  };
}

const blurred = ref(false);

function doUpdateQuantity(value: any, quantity: number) {
  emit("update:quantity", value, quantity);
}
</script>
