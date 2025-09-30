<template>
  <del v-if="priceMeta.isDiscounted" :class="styles.pricing.ex">
    {{
      t("text.price_was", {
        price: priceMeta.canShowCycle
          ? t("text.product_cycle_per_month", {
              value: monthlyFromRegularPrice
            })
          : regularPrice
      })
    }}
  </del>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";
import { computed } from "vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./pricing.config";

// --- types
import type { ComputedRef } from "vue";
import type { ExPriceProps } from "./types";

const props = defineProps<ExPriceProps>();

const { t } = useI18n();

const priceMeta = computed(() => ({
  canShowCycle: props.showCycle,
  isDiscounted: props.discounted
}));

const styles = useStyles(
  ["pricing"],
  priceMeta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  pricing: {
    ex: string;
  };
}>;
</script>
