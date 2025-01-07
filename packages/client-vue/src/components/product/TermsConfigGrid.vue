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
      v-if="props.type === 'radio'"
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

    <SelectCards
      v-if="props.type === 'select'"
      id="terms"
      name="terms"
      :required="props.required"
      :items="parsedValues"
      :disabled="props.disabled || props.processing"
      :errors="props.errors"
      :model-value="props.modelValue?.toString()"
      @update:modelValue="doResolve"
      :radio="false"
      collapsible
      separate
    >
      <template v-if="$slots.item" #selected="{ item }">
        <slot name="item" v-bind="getTerm(item.value)" />
      </template>
      <template v-if="$slots.dropdown" #item="{ item }">
        <slot name="dropdown" v-bind="getTerm(item.value)" />
      </template>
    </SelectCards>
  </FormField>

  <!-- <pre v-if="errors">{{ errors }}</pre> -->
</template>

<script lang="ts" setup>
// --- external
import { computed, toRefs } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles, cn } from "@upmind-automation/upwind";
import config from "./config.cva";

// --- components
import { RadioCards, FormField, SelectCards } from "@upmind-automation/upwind";
import CardTerm from "./TermCard.vue";
import CardTermPerMonth from "./TermPerMonthCard.vue";

// --- utils
import { isNil, map, toNumber, find, some } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { RadioCardsItemProps } from "@upmind-automation/upwind";

// -----------------------------------------------------------------------------
const emits = defineEmits(["update:modelValue"]);
const props = withDefaults(
  defineProps<{
    type?: string;
    items: Object[];
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
    type: "radio",
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
      id: item.cycle,
      value: item.cycle.toString(),
      label: item.name,
      ...item,
    };
  });
});

const hasItems = computed(() => {
  return !isNil(props.modelValue) && !!props.items?.length;
});

function getTerm(value: string) {
  const item = find(props.items, ["cycle", toNumber(value)]);
  return item;
}

function isMonthly(item: any) {
  return props.monthly && item.monthlyFromRegularPrice && item.cycle > 1;
}
function doResolve(item: string | number) {
  if (props.disabled) return;
  emits("update:modelValue", toNumber(item));
}
</script>
