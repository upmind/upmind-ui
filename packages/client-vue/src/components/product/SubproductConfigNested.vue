<template>
  <template v-for="item in items" :key="item.id">
    <FormField
      v-if="item.values?.length"
      :class="styles.product.config.list.root"
      :label="item.name"
      :text="safeText(item)"
      :required="item.required"
      :errors="safeErrors(item.id)"
      :dirty="isDirty(item.id)"
      @blur="blurred[item.id] = true"
    >
      <component
        :is="
          item.multiple || item.values?.length == 1 ? CheckboxCards : RadioCards
        "
        :items="parsedValues(item.values)"
        :model-value="getValues(item)"
        :errors="errors?.[item.id]"
        no-feedback
        @update:modelValue="doResolve(item, $event)"
      >
        <template #item="{ item: { value } }">
          <VCardSubproduct
            v-bind="getSubProduct(item, value)"
            :price-override="subproduct?.price_override"
          />
        </template>
      </component>
    </FormField>
  </template>
</template>

<script lang="ts" setup>
// --- external
import { toRefs, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles, cn } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { CheckboxCards, RadioCards, FormField } from "@upmind/upwind";
import VCardSubproduct from "./SubproductCard.vue";

// --- custom elements

// --- utils
import { some, has, reduce, map, get, first, isArray, find } from "lodash-es";

// -----------------------------------------------------------------------------
const emit = defineEmits(["update:modelValue", "update:quantity"]);

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    loading?: boolean;
    processing?: boolean;
    items: any[];
    modelValue: any;
    itemKey: string;
    errors?: any;
  }>(),
  {
    disabled: false,
    loading: false,
    processing: false,
    items: () => [],
    modelValue: () => {},
    itemKey: "",
    errors: () => {},
  }
);

const { t } = useI18n();

const styles = useStyles(
  ["product.config.list", "product.config.list.item"],
  toRefs(props),
  config
);

const blurred = ref({});

function safeText(item) {
  const hasPrices = some(item.values, "price");

  if (hasPrices && item?.price_override) {
    return t("product.adds_overrides", item?.price_override ? 1 : 0);
  }

  return null;
}

function isDirty(item) {
  return has(blurred, item);
}

function safeErrors(item) {
  return props.errors?.[item]?.join() || undefined;
}

// function isSelected(item, value, autoselect = false) {
//   return autoselect || some(modelValue?.[item], [itemKey, value]);
// }

function getSubProduct(item, value) {
  return find(item?.values, ["id", value]);
}

function safeValue(item, value) {
  const shouldBeArray = item.multiple || item.values?.length == 1;
  const safeArray = !isArray(value) ? [value] : value;
  const safeString = isArray(value) ? first(value) : value;
  const safeValue = shouldBeArray ? safeArray : safeString;
  return safeValue;
}

function getValues(item) {
  const value = reduce(
    props.modelValue?.[item.id],
    (result, value) => {
      const val = get(value, props.itemKey);
      if (val) result.push(val);
      return result;
    },
    []
  );

  return safeValue(item, value);
}

function doUpdateQuantity(item, value, $event) {
  emit("update:quantity", item, value, $event);
}

function doResolve(item, value) {
  if (props.disabled || props.processing) return;

  const safeValue = safeValue(item, value);

  emit("update:modelValue", item, safeValue);
}

function parsedValues(values) {
  return map(values, value => ({
    ...value,
    value: value.id,
    label: value.name,
  }));
}
</script>
