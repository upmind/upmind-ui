<template>
  <fieldset v-if="items.length > 1">
    <SelectCards v-model="modelValue" :items="items" />
  </fieldset>
</template>

<script setup lang="ts">
// --- external
import { useVModel } from "@vueuse/core";
import { computed } from "vue";
import { toString } from "lodash-es";
import { useI18n } from "vue-i18n";

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
      label: t(`product.terms.cycle.${price.cycle}`),
      value: toString(price.cycle),
      appendLabel: price.price.currentPrice
    } as SelectCardsItemProps;

    if (price.price?.savingAmount > 0) {
      item.badge = {
        label: t("product.promotion_save", {
          value: price.price.savingPercent
        }),
        color: "promotion",
        variant: "outline"
      } as BadgeProps;
    }

    return item;
  });
});
</script>
