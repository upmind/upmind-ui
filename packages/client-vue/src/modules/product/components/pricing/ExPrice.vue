<template>
  <del v-if="priceMeta.isDiscounted" :class="styles.pricing.ex">
    {{
      priceMeta.useMonthlyFromPrice
        ? `${props.monthlyFromRegularPrice} ${t("text.product_cycle_per_month")}`
        : props.regularPrice
    }}
  </del>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./pricing.config";

// --- types
import type { ExPriceProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<ExPriceProps>();

const { t } = useI18n();

const priceMeta = computed(() => ({
  useMonthlyFromPrice: props.useMonthlyFromPrice,
  isDiscounted: props.discounted
}));

const styles = useStyles(["pricing"], priceMeta, config, props.uiConfig ?? {});
</script>
