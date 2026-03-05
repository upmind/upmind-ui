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
    :icon="ui.optionSelectorIcons.isVisible ? data.optionGroupIcon : ''"
  >
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
    />
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
  SelectCards,
  SelectGrouped
} from "@upmind-automation/upmind-ui";

// --- utils
import { map, isArray, first, groupBy, some } from "lodash-es";

// --- types
import type {
  SubproductDetails,
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

const { ui, data } = props.meta.with({
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

const gridColumns = computed(() => {
  const isRadioGrid = ui.optionSelector.value === OPTION_SELECTOR.RADIO_GRID;
  const hasMultipleValues = parsedValues.value.length > 1;

  return isRadioGrid && hasMultipleValues ? ui.optionSelectorGrid.asNumber : 1;
});

const blurred = ref(false);
</script>
