<template>
  <template v-for="(item, index) in pricing" :key="`pricing-${index}`">
    <div :class="summaryPricingPriceVariants({ footer: props.footer })">
      <dt :class="summaryPricingTotalVariants()">
        {{ t("text.total") }}
      </dt>

      <CurrentPrice
        is="dd"
        :current-price="item.price.currentPrice"
        :monthly-from-current-price="item.price.monthlyFromCurrentPrice ?? ''"
        :free="item.meta.free ?? false"
        :dataAttrs="{ 'data-test-key': 'total-price' }"
        :ui-config="{
          pricing: {
            current: [summaryPricingCurrentPriceVariants()]
          }
        }"
      />
    </div>
  </template>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import CurrentPrice from "../pricing/CurrentPrice.vue";
import {
  summaryPricingPriceVariants,
  summaryPricingTotalVariants,
  summaryPricingCurrentPriceVariants
} from "./variants";
import type { ProductSummaryDetailWithPrice } from "@upmind-automation/headless";

const props = defineProps<{
  pricing: ProductSummaryDetailWithPrice[];
  footer?: boolean;
}>();

const { t } = useI18n();
</script>
