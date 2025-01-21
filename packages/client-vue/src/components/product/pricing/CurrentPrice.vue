<template>
  <span :class="styles.product.pricing.currentPrice">
    <template v-if="meta?.free">
      {{ t("product.free") }}
    </template>
    <template v-else>
      {{
        showCycle && cycle && te("product.cycle")
          ? t("product.cycle", { value: monthlyFromCurrentPrice })
          : currentPrice
      }}
    </template>
  </span>
</template>

<script setup lang="ts">
import { type ComputedRef } from "vue";
import { useStyles } from "@upmind-automation/upwind";
import config from "../config.cva";
import { useI18n } from "vue-i18n";

defineProps<{
  currentPrice?: number | string;
  cycle?: number | string;
  monthlyFromCurrentPrice?: number | string;
  meta?: {
    free?: boolean;
    discounted?: boolean;
  };
  // ---
  showCycle?: boolean;
}>();

const { t, te } = useI18n();

const styles = useStyles(
  ["product.pricing.currentPrice"],
  {},
  config
) as ComputedRef<{
  product: {
    pricing: {
      currentPrice: string;
    };
  };
}>;
</script>
