<template>
  <component
    :is="as"
    :id="subproduct.id"
    v-model="modelValue"
    :name="subproduct.id"
    :required="subproduct.meta.required"
    :items="parsedValues"
    :groups="groups"
    :disabled="props.disabled"
    :errors="errors"
    :none-text="t('text.none')"
    :placeholder="t('form.select_option.placeholder')"
    :multiple="subproduct.meta.multiple"
    :columns="gridColumns"
  >
    <template v-if="hasGroups" #icon="{ group }">
      <SubproductImage
        v-if="group?.icon"
        :src="group.icon"
        :alt="group?.name"
      />
    </template>
    <template v-if="hasGroups" #header-label="{ selectedItem }">
      <div :class="styles.product.card.pricing">
        <SubproductCardPricing
          v-if="
            selectedItem &&
            getSubproductValue(selectedItem.value)?.price &&
            !getSubproductValue(selectedItem.value)?.meta?.free
          "
          :price="getSubproductValue(selectedItem.value).price"
          :meta="getSubproductValue(selectedItem.value).meta"
          :cycle="getSubproductValue(selectedItem.value).cycle"
          :term="props.term"
          dropdown
        />
      </div>
    </template>
    <template #item="{ item, group }: any">
      <CardSubproduct
        v-bind="getSubproductValue(getItemId(item))"
        :image="group?.icon || getOptionImage(getItemId(item))"
        :meta="meta"
        :term="props.term"
        :product-meta="getSubproductValue(getItemId(item)).meta"
        @update:quantity="doUpdateQuantity(getItemId(item), $event)"
        :minimal="mapComponentName !== 'SelectCards'"
      />
    </template>
    <template #dropdown-item="{ item }: any">
      <CardSubproduct
        v-bind="getSubproductValue(getItemId(item))"
        :image="getOptionImage(getItemId(item))"
        :term="props.term"
        :meta="meta"
        :product-meta="getSubproductValue(getItemId(item)).meta"
        @update:quantity="doUpdateQuantity(getItemId(item), $event)"
        minimal
        dropdown
      />
    </template>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- components
import {
  RadioCards,
  CheckboxCards,
  SelectCards,
  SelectGrouped,
  useStyles
} from "@upmind-automation/upmind-ui";
import CardSubproduct from "./SubproductCard.vue";
import SubproductCardPricing from "./SubproductCardPricing.vue";
import SubproductImage from "./SubproductImage.vue";
import config from "../../product.config";

// --- utils
import { find, map, get, isArray, first, groupBy, some, size } from "lodash-es";

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
  errors?: string | string[];
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
  ["product.config.list", "product.config.list.item", "product.card"],
  props,
  config
);

const as = computed(() => {
  return mapComponent(ui.optionSelector.value);
});

const mapComponent = (name: string) => {
  const { multiple, required } = props.subproduct.meta;
  const hasMultiple = (props.subproduct?.values?.length || 0) > 1;
  switch (name) {
    case "select-grouped":
      return hasGroups.value ? SelectGrouped : SelectCards;
    case "select":
      return !multiple || (required && !hasMultiple)
        ? SelectCards
        : CheckboxCards;

    default:
      return !multiple || (required && !hasMultiple)
        ? RadioCards
        : CheckboxCards;
  }
};

const optionsWithConfig = computed(() =>
  map(props.subproduct?.values, option => {
    const { data } = props.meta.with({ option: () => option });
    return {
      ...option,
      groupLabel: data.optionGroupLabel,
      groupIcon: data.optionGroupIcon,
      groupImg: data.optionImgUrl
    };
  })
);

const hasGroups = computed(() =>
  some(optionsWithConfig.value, opt => !!opt.groupLabel)
);

const mapComponentName = computed(() => {
  const { multiple, required } = props.subproduct.meta;
  const hasMultiple = (props.subproduct?.values?.length || 0) > 1;
  switch (ui.optionSelector.value) {
    case "select-grouped":
      return hasGroups.value ? "SelectGrouped" : "SelectCards";
    case "select":
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
  return map(optionsWithConfig.value, (opt, index) => ({
    id: opt.id,
    value: opt.id.toString(),
    label: opt?.title ?? "",
    sublabel: opt?.title ?? "",
    appendLabel: opt?.price?.currentPrice,
    text: opt?.excerpt,
    group: opt.groupLabel,
    item: opt,
    index,
    modelValue: modelValue.value
  }));
});

const groups = computed(() => {
  if (!hasGroups.value) return [];
  const grouped = groupBy(
    optionsWithConfig.value,
    opt => opt.groupLabel || opt.id
  );
  return map(grouped, items => {
    const firstItem = first(items);
    const hasGroupLabel = !!firstItem?.groupLabel;
    return {
      name: firstItem?.groupLabel || firstItem?.name,
      icon: firstItem?.groupImg,
      iconName: firstItem?.groupIcon,
      dropdown: hasGroupLabel,
      items: map(items, item => ({
        value: item.id,
        label: item.name,
        description: item.excerpt,
        secondaryLabel: item.meta?.free ? "" : item.price?.currentPrice
      }))
    };
  });
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

function getItemId(item: any): string {
  return item?.value ?? item?.id ?? "";
}

function getOptionImage(value: string): string | undefined {
  const option = find(optionsWithConfig.value, ["id", value]);
  return option?.groupImg;
}

const gridColumns = computed(() => {
  const isRadioGrid = ui.optionSelector.value === OPTION_SELECTOR.RADIO_GRID;
  const hasMultipleValues = parsedValues.value.length > 1;

  return isRadioGrid && hasMultipleValues ? ui.optionSelectorGrid.asNumber : 1;
});

function doUpdateQuantity(value: any, quantity: number) {
  emit("update:quantity", value, quantity);
}
</script>
