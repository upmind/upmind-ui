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
      :none-text="t('product.select.none')"
      :placeholder="t('product.select.placeholder')"
      :multiple="subproduct.meta.multiple"
      :size="subproduct.uiMeta?.uischema?.options?.size"
    >
      <template #item="{ item: { value } }">
        <CardSubproduct
          v-bind="getSubproductValue(value)"
          @update:quantity="doUpdateQuantity(value, $event)"
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
import { find, map, get } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type {
  SelectCardsItemProps,
  RadioCardsItemProps,
  CheckboxCardsItemProps
} from "@upmind-automation/upmind-ui";
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
  // --- state
  disabled?: boolean;
  loading?: boolean;
  processing?: boolean;
  visible?: boolean;
  size?: number;
}>();

// ---

const modelValue = useVModel(props, "modelValue", emit, {
  passive: true
  // defaultValue: null, //props.defaultValue,
}) as any; // HACK : allows us to pass modle value to our dynamic component without typescript moaning

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
  // TODO: Create a helper that reliably maps the component name to the component (with a soft comparison)
  switch (name) {
    case "select":
    case "selectcards":
    case "SelectCards":
      return SelectCards;
    default:
      return props.subproduct.meta.multiple ||
        props.subproduct.values?.length == 1
        ? CheckboxCards
        : RadioCards;
  }
};

const parsedValues = computed(() => {
  const values = map(props.subproduct?.values, (subproduct, index) => {
    return {
      id: subproduct.id,
      value: subproduct.id.toString(), // Ensure value is a string
      label: subproduct?.title ?? "", // Add the required label property
      sublabel: subproduct?.title ?? "",
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
      ? product?.uiMeta?.uischema?.group
      : product?.title
    // icon: product?.uiMeta?.uischema?.icon, //Is this used?
  };
}

const blurred = ref(false);

function doUpdateQuantity(value: any, quantity: number) {
  emit("update:quantity", value, quantity);
}
</script>
