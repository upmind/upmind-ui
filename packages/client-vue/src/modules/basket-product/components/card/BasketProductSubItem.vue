<template>
  <article :class="productOptionRootVariants()">
    <BasketProductSummary :summary="summary">
      <!-- e.g. "Renews every month." or "One-time payment." -->
      {{
        t("term.renews_msg", {
          n: summary.cycle ?? 0,
          cycle: parseBillingCycle(summary.cycle ?? 0).descriptive
        })
      }}.
    </BasketProductSummary>

    <CurrentPrice
      :current-price="summary.price.currentPrice"
      :monthly-from-current-price="summary.price.monthlyFromCurrentPrice ?? ''"
      :free="summary.meta?.free ?? false"
      :ui-config="{
        pricing: { current: [productPricingCurrentVariants()] }
      }"
    />
  </article>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { parseBillingCycle } from "@upmind-automation/headless";
import CurrentPrice from "../../../product/components/pricing/CurrentPrice.vue";
import {
  productOptionRootVariants,
  productPricingCurrentVariants
} from "./basketProduct.variants";
import BasketProductSummary from "./components/BasketProductSummary.vue";
import type { BasketProductSubItemProps } from "./types";
// -----------------------------------------------------------------------------

defineProps<BasketProductSubItemProps>();

const { t } = useI18n();
</script>
