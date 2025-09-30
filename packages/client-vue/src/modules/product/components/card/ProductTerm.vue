<template>
  <fieldset v-if="items.length > 1">
    <SelectCards to="#vue-app" v-model="modelValue" :items="items" />
  </fieldset>
</template>

<script setup lang="ts">
// --- external
import { useVModel } from "@vueuse/core";
import { computed } from "vue";
import { toString } from "lodash-es";
import { useI18n } from "vue-i18n";

// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";

// --- components
import {
  SelectCards,
  type SelectCardsItemProps
} from "@upmind-automation/upmind-ui";

// --- types
import type { ProductTerm } from "./types";
import type { BadgeProps } from "@upmind-automation/upmind-ui";

const props = defineProps<ProductTerm>();

const modelValue = useVModel(props, "modelValue");

const { t } = useI18n();

const items = computed(() => {
  if (!props.prices) return [];

  return props.prices?.map(price => {
    const item = {
      label: parseBillingCycle(price.cycle!).numeric,
      value: toString(price.cycle),
      appendLabel: price.price.currentPrice
    } as SelectCardsItemProps;

    if (price.price?.savingAmount > 0) {
      item.badge = {
        label: t("text.amount_save", {
          amount: price.price.savingPercent
        }),
        color: "promotion",
        variant: "outline"
      } as BadgeProps;
    }

    return item;
  });
});
</script>
