<template>
  <FormField
    :id="subproduct.id"
    :name="subproduct.id"
    :class="styles.product.config.list.root"
    :required="subproduct.required"
    :disabled="props.disabled || props.processing"
    :visible="props.visible"
    :dirty="blurred"
    :errors="props.errors"
    :label="subproduct.name"
    :tooltip="subproduct?.description"
    @blur="blurred = true"
  >
    <component
      :is="
        subproduct.multiple || subproduct.values?.length == 1
          ? CheckboxCards
          : RadioCards
      "
      :id="subproduct.id"
      :name="subproduct.id"
      :required="subproduct.required"
      :items="parsedValues"
      :disabled="props.disabled || props.processing"
      :errors="errors"
      :none-text="t('product.select.none')"
      :placeholder="t('product.select.placeholder')"
      v-model="modelValue"
    >
      <template #item="{ item: { value } }">
        <CardSubproduct
          v-bind="getSubProduct(value as string)"
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
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { RadioCards, CheckboxCards, FormField } from "@upmind/upwind";
import CardSubproduct from "./SubproductCard.vue";

// --- utils
import { find, map, get } from "lodash-es";

// --- types
import { type RadioCardsItemProps } from "@upmind/upwind";

// -----------------------------------------------------------------------------

const emit = defineEmits(["update:modelValue", "update:quantity"]);

const props = defineProps<{
  subproduct: Object;
  modelValue?: string | string[];
  quantities?: Record<string, number>;
  errors?: string;
  // --- state
  disabled?: boolean;
  loading?: boolean;
  processing?: boolean;
  visible?: boolean;
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
);

const parsedValues = computed<RadioCardsItemProps[]>(() => {
  return map(props.subproduct?.values, subproduct => {
    return {
      id: subproduct.id,
      value: subproduct.id,
      label: subproduct?.name,
      text: subproduct?.short_description,
    };
  });
});

function getSubProduct(value: string) {
  const subproduct = find(props.subproduct?.values, ["id", value]);
  return {
    ...subproduct,
    quantity: get(props.quantities, value, 0),
    priceOverride: subproduct?.price_override,
  };
}

const blurred = ref(false);

function doUpdateQuantity(value: any, quantity: number) {
  emit("update:quantity", value, quantity);
}
</script>
