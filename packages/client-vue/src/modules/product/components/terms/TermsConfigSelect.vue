<template>
  <component
    :is="mapComponent(props.as)"
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
    <SelectCards
      id="terms"
      name="terms"
      :required="props.required"
      :items="parsedValues"
      :disabled="props.disabled || props.processing"
      :errors="props.errors"
      :model-value="props.modelValue?.toString()"
      content-class="!max-h-[18.5rem]"
      @update:modelValue="doResolve"
    >
      <template #item="{ item }: any">
        <slot name="item" :item="item">
          <CardTermPerMonth
            v-if="isMonthly(item.value)"
            v-bind="getTerm(item.value)"
            select
            :class="props.class"
          />
          <CardTerm
            v-else
            v-bind="getTerm(item.value)"
            select
            :class="props.class"
          />
        </slot>
      </template>
      <template #dropdown-item="{ item }: any">
        <slot name="dropdown" :item="item">
          <CardTermPerMonth
            v-if="isMonthly(item.value)"
            v-bind="getTerm(item.value)"
            select
            :class="props.class"
          />
          <CardTerm
            v-else
            v-bind="getTerm(item.value)"
            select
            :class="props.class"
          />
        </slot>
      </template>
    </SelectCards>
  </component>

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
import { FormField, SelectCards } from "@upmind-automation/upmind-ui";
import CardTerm from "./TermCard.vue";
import CardTermPerMonth from "./TermPerMonthCard.vue";

// --- utils
import { isNil, map, toNumber, find } from "lodash-es";

// --- types
import type { ComputedRef, HTMLAttributes } from "vue";
import type { SelectCardsItemProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------
const emits = defineEmits(["update:modelValue"]);
const props = withDefaults(
  defineProps<{
    as?: string;
    items: any[];
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
    // ---
    class?: HTMLAttributes["class"];
  }>(),
  {
    as: "FormField",
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

const parsedValues = computed<any[]>(() => {
  return map(props.items, (item: any) => {
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
  const term = getTerm(item);
  return props.monthly && term.monthlyFromRegularPrice && term.cycle > 1;
}

function doResolve(item: string | number) {
  if (props.disabled) return;
  emits("update:modelValue", toNumber(item));
}

const mapComponent = (as: string) => {
  switch (as) {
    case "FormField":
    case "formfield":
      return FormField;
    default:
      return as;
  }
};
</script>
