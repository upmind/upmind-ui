<template>
  <del
    v-if="priceMeta.isDiscounted || priceMeta.isOverridden"
    :class="styles.pricing.ex"
  >
    <slot name="prefix" />{{
      formatPrice(
        priceMeta.useMonthlyFromPrice
          ? props.monthlyFromRegularPrice
          : props.regularPrice,
        {
          trimTrailingZeroes: data.trimTrailingZeroes
        }
      )
    }}
  </del>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import { useMoney, useConfig } from "@upmind-automation/headless";
import config from "./pricing.config";

// --- types
import type { ExPriceProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<ExPriceProps>();

const { t } = useI18n();
const { ui, data } = useConfig();

const { formatPrice } = useMoney();

const priceMeta = computed(() => ({
  useMonthlyFromPrice: props.useMonthlyFromPrice,
  isDiscounted: props.discounted,
  isOverridden: props.overridden
}));

const styles = useStyles(["pricing"], priceMeta, config, props.uiConfig ?? {});
</script>
