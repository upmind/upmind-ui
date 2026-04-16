<template>
  <fieldset v-if="items.length > 1">
    <SelectCards v-model="modelValue" :items="items">
      <template #item="slotProps">
        <TermCard v-bind="slotProps.item" layout="inline" :summary="false" />
      </template>
      <template #dropdown-item="slotProps">
        <TermCard v-bind="slotProps.item" layout="inline" :summary="false" />
      </template>
    </SelectCards>
  </fieldset>
</template>

<script setup lang="ts">
// --- external
import { useVModel } from "@vueuse/core";
import { computed } from "vue";
import { toString, map } from "lodash-es";
import { useI18n } from "vue-i18n";

// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";

// --- components
import {
  SelectCards,
  type SelectCardsItemProps
} from "@upmind-automation/upmind-ui";
import TermCard from "../terms/TermCard.vue";

// --- types
import type { ProductTerm } from "./types";
import type { BadgeProps } from "@upmind-automation/upmind-ui";

const props = defineProps<ProductTerm>();

const modelValue = useVModel(props, "modelValue");

const { t } = useI18n();

const items = computed(() => {
  if (!props.prices) return [];

  return map(props.prices, (price, index) => {
    const item = {
      label: parseBillingCycle(price.cycle!).numeric,
      value: toString(price.cycle),
      item: price,
      index
    } as SelectCardsItemProps;

    if (!props.hideBadge && price.price?.savingAmount > 0) {
      item.badge = {
        label: t("text.amount_save", {
          amount: price.price.savingPercent
        }),
        color: "promo",
        variant: "minimal"
      } as BadgeProps;
    }

    return item;
  });
});
</script>
