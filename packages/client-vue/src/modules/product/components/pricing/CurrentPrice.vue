<template>
  <component
    :is="props.is"
    :class="styles.pricing.current"
    data-testid="current-price"
    :data-test-value="formattedPrice"
  >
    <template v-if="props.loading">
      <Skeleton :class="styles.pricing.currentSkeleton" />
    </template>
    <template v-else>
      <slot name="prefix" />{{ formattedPrice }}<slot name="suffix" />
      <small
        v-if="priceMeta.useMonthlyFromPrice && !priceMeta.isFree"
        :class="styles.pricing.term"
        >{{ t("text.product_cycle_per_month") }}</small
      >
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useMoney, useConfig } from "@upmind-automation/headless";
import { useStyles, Skeleton } from "@upmind-automation/upmind-ui";
import config from "./pricing.config";
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

const styles = useStyles(["pricing"], priceMeta, config, props.uiConfig ?? {});
</script>
