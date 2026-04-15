<template>
  <component :is="props.is" :class="styles.pricing.current">
    <slot name="prefix" />{{
      formatPrice(
        priceMeta.useMonthlyFromPrice
          ? props.monthlyFromCurrentPrice
          : props.currentPrice,
        {
          zeroPriceDisplayIsLabel: ui.zeroPriceDisplay.isLabel,
          trimTrailingZeroes: data.trimTrailingZeroes
        }
      )
    }}<slot name="suffix" />
    <small
      v-if="priceMeta.useMonthlyFromPrice && !priceMeta.isFree"
      :class="styles.pricing.term"
      >{{ t("text.product_cycle_per_month") }}</small
    >
  </component>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./pricing.config";
import { useMoney, useConfig } from "@upmind-automation/headless";

// --- types
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

const styles = useStyles(["pricing"], priceMeta, config, props.uiConfig ?? {});
</script>
