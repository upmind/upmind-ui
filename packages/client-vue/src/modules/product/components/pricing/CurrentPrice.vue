<template>
  <component
    :is="props.is"
    :class="
      cn(
        currentVariants({
          useMonthlyFromPrice: priceMeta.useMonthlyFromPrice
        }),
        props.uiConfig?.pricing?.current
      )
    "
    v-bind="currentPriceTestAttrs(formattedPrice)"
  >
    <template v-if="props.loading">
      <Skeleton :class="currentSkeletonVariants()" />
    </template>
    <template v-else>
      <slot name="prefix" />{{ formattedPrice }}<slot name="suffix" />
      <small
        v-if="priceMeta.useMonthlyFromPrice && !priceMeta.isFree"
        :class="termVariants()"
        >{{ t("text.product_cycle_per_month") }}</small
      >
    </template>
  </component>
</template>

<script setup lang="ts">
import { cn } from "@upmind/ui";
import { Skeleton, useTestAttrs } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useMoney, useConfig } from "@upmind-automation/headless";
import {
  currentVariants,
  termVariants,
  currentSkeletonVariants
} from "./variants";
import type { CurrentPriceProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<CurrentPriceProps>(), {
  is: "span"
});

const { t } = useI18n();

const { formatPrice } = useMoney();
const { ui, data } = useConfig();

const priceMeta = computed(() => ({
  useMonthlyFromPrice: !!props.useMonthlyFromPrice,
  isFree: props.free
}));

const formattedPrice = computed(() =>
  formatPrice(
    priceMeta.value.useMonthlyFromPrice
      ? props.monthlyFromCurrentPrice
      : props.currentPrice,
    {
      zeroPriceDisplayIsLabel: ui.zeroPriceDisplay.isLabel,
      trimTrailingZeroes: data.trimTrailingZeroes
    }
  )
);

const currentPriceTestAttrs = (value?: string | null) =>
  useTestAttrs({
    key: "current-price",
    value: value ?? undefined,
    dataAttrs: props.dataAttrs
  });
</script>
