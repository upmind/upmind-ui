<template>
  <del v-if="meta?.discounted" :class="styles.product.pricing.exPrice">
    {{
      showCycle && cycle && te("product.cycle")
        ? t("product.cycle", { value: monthlyFromRegularPrice })
        : regularPrice
    }}
  </del>
</template>

<script setup lang="ts">
import { type ComputedRef } from "vue";
import { useStyles } from "@upmind-automation/upwind";
import config from "../config.cva";
import { useI18n } from "vue-i18n";

defineProps<{
  regularPrice?: number | string;
  monthlyFromRegularPrice?: number | string;
  cycle?: number | string;
  meta?: {
    discounted?: boolean;
    free?: boolean;
  };
  // ---
  showCycle?: boolean;
}>();

const { t, te } = useI18n();

const styles = useStyles(
  ["product.pricing.exPrice"],
  {},
  config
) as ComputedRef<{
  product: {
    pricing: {
      exPrice: string;
    };
  };
}>;
</script>
