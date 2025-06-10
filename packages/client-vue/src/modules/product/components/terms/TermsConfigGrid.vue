<template>
  <FormField
    v-if="hasItems"
    id="terms"
    name="terms"
    :class="styles.product.config.grid.root"
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
      :none-text="t('product.select.none')"
      :placeholder="t('product.select.placeholder')"
      :class="styles.product.config.grid.items"
      layout="grid"
      ring
      :model-value="props.modelValue?.toString()"
      @update:modelValue="doResolve"
      :width="0"
    >
      <template #item="{ item }">
        <CardTermPerMonth
          v-if="isMonthly(item.value)"
          v-bind="getTerm(item.value)"
        />
        <CardTerm v-else v-bind="getTerm(item.value)" />
      </template>
    </RadioCards>
  </FormField>

  <!-- <pre v-if="errors">{{ errors }}</pre> -->
</template>

<script lang="ts" setup>
// --- external
import { computed, toRefs } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../../product.config";

// --- components
import { RadioCards, FormField } from "@upmind-automation/upmind-ui";
import CardTerm from "./TermCard.vue";
import CardTermPerMonth from "./TermPerMonthCard.vue";

// --- utils
import { isNil, map, toNumber, find } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
import type { TermDetails } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
const emits = defineEmits(["update:modelValue"]);
const props = withDefaults(
  defineProps<{
    items: TermDetails[];
    modelValue?: string | number;
    errors?: string;
    // ---
    label?: string;
    description?: string;
    // --- state
    monthly?: boolean;
    required?: boolean;
    disabled?: boolean;
    loading?: boolean;
    processing?: boolean;
    visible?: boolean;
  }>(),
  {
    required: true,
    disabled: false,
    loading: false,
    processing: false,
    visible: true,
  }
);

const { t } = useI18n();

const styles = useStyles(
  ["product.config.grid", "product.config.grid.item"],
  toRefs(props),
  config
) as ComputedRef<{
  product: {
    config: {
      grid: {
        root: string;
        items: string;
      };
    };
  };
}>;

const parsedValues = computed<RadioCardsItemProps[]>(() => {
  return map(props.items, (item: TermDetails, index: number) => {
    return {
      id: item.cycle,
      value: item.cycle?.toString(),
      label: item.title,
      item: item, // Ensure the `item` property is included
      index: index, // Add the `index` property
      modelValue: props.modelValue?.toString(), // Add the `modelValue` property
    } as RadioCardsItemProps;
  });
});

const hasItems = computed(() => {
  return !isNil(props.modelValue) && !!props.items?.length;
});

function getTerm(value: string): TermDetails {
  const item = find(props.items, ["cycle", toNumber(value)]) as TermDetails;
  return item;
}

function isMonthly(value: string) {
  const term = getTerm(value) as TermDetails;
  return (
    props.monthly && term.price.monthlyFromRegularPrice && (term.cycle ?? 0) > 1
  );
}

function doResolve(value: string | number) {
  if (props.disabled) return;
  emits("update:modelValue", toNumber(value));
}
</script>
