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
    auto-focus
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
      :model-value="props.modelValue?.toString()"
      @update:modelValue="doResolve"
    >
      <template #item="{ item }">
        <CardTermPerMonth v-if="isMonthly(item)" v-bind="getTerm(item.value)" />
        <CardTerm v-else v-bind="getTerm(item.value)" />
      </template>
    </RadioCards>
  </FormField>

  <pre v-if="errors">{{ errors }}</pre>
</template>

<script lang="ts" setup>
// --- external
import { computed, toRefs } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles, cn } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { RadioCards, FormField, Badge } from "@upmind/upwind";
import CardTerm from "./TermCard.vue";
import CardTermPerMonth from "./TermPerMonthCard.vue";

// --- utils
import { isNil, map, toNumber, find, some } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { RadioCardsItemProps } from "@upmind/upwind";

// -----------------------------------------------------------------------------
const emits = defineEmits(["update:modelValue"]);
const props = withDefaults(
  defineProps<{
    items: Object[];
    modelValue?: string | number;
    errors?: string;
    // ---
    label?: string;
    description?: string;
    // --- state
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
);

const parsedValues = computed<RadioCardsItemProps[]>(() => {
  return map(props.items, item => {
    return {
      id: item.,
      value: item..toString(),
      label: item.name,
      ...item,
    };
  });
});

const hasItems = computed(() => {
  return !isNil(props.modelValue) && !!props.items?.length;
});

function getTerm(value: string) {
  const item = find(props.items, ["", toNumber(value)]);
  return item;
}

function isMonthly(item: any) {
  const hasMonthlyPrice = some(props.items, ["", 1]);
  return (
    hasMonthlyPrice && item.monthlyPriceFrom && item.cycle > 1
  );
}
function doResolve(item: string | number) {
  if (props.disabled) return;
  emits("update:modelValue", toNumber(item));
}
</script>
