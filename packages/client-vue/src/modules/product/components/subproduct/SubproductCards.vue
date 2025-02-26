<template>
  <FormField
    :id="subproduct.id"
    :name="subproduct.id"
    :class="styles.product.config.list.root"
    :required="subproduct.required"
    :disabled="props.disabled"
    :visible="props.visible"
    :dirty="blurred"
    :errors="props.errors"
    :label="subproduct.name"
    :tooltip="subproduct?.description"
    @blur="blurred = true"
  >
    <component
      :is="as"
      :id="subproduct.id"
      v-model="modelValue"
      :name="subproduct.id"
      :required="subproduct.required"
      :items="parsedValues"
      :disabled="props.disabled"
      :errors="errors"
      :none-text="t('product.select.none')"
      :placeholder="t('product.select.placeholder')"
      :multiple="subproduct.multiple"
      :size="subproduct.meta?.uischema?.options?.size"
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
  SelectCards,
} from "@upmind-automation/upmind-ui";
import CardSubproduct from "./SubproductCard.vue";

// --- utils
import { find, map, get } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const emit = defineEmits(["update:modelValue", "update:quantity"]);

const props = defineProps<{
  subproduct: any;
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
  passive: true,
  // defaultValue: null, //props.defaultValue,
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
  return mapComponent(props.subproduct.meta?.uischema?.control);
});

const mapComponent = (name: string) => {
  // TODO: Create a helper that reliably maps the component name to the component (with a soft comparison)
  switch (name) {
    case "select":
    case "selectcards":
    case "SelectCards":
      return SelectCards;
    default:
      return props.subproduct.multiple || props.subproduct.values?.length == 1
        ? CheckboxCards
        : RadioCards;
  }
};

const parsedValues = computed<any[]>(() => {
  return map(props.subproduct?.values, (subproduct, index) => ({
    id: subproduct.id,
    value: subproduct.id,
    sublabel: subproduct?.name ?? "",
    text: subproduct?.excerpt,
    values: subproduct.values,
    group: subproduct?.meta?.uischema?.group,
    item: subproduct,
    index,
    modelValue: modelValue.value,
  }));
});

function getSubproductValue(value: string) {
  const product = find(props.subproduct?.values, ["id", value]);
  return {
    ...product,
    quantity: get(props.quantities, value, 0),
    name: product?.meta?.uischema?.primary
      ? product?.meta?.uischema?.group
      : product?.name,
    icon: product?.meta?.uischema?.icon,
  };
}

const blurred = ref(false);

function doUpdateQuantity(value: any, quantity: number) {
  emit("update:quantity", value, quantity);
}
</script>
