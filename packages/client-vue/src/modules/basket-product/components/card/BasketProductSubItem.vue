<template>
  <article :class="styles.product.option.root">
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
        pricing: { current: [styles.product.pricing.current] }
      }"
    />
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- components
import CurrentPrice from "../../../product/components/pricing/CurrentPrice.vue";
import BasketProductSummary from "./components/BasketProductSummary.vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import { parseBillingCycle } from "@upmind-automation/headless";
import config from "./basketProduct.config";

// --- types
import type { BasketProductSubItemProps } from "./types";
// -----------------------------------------------------------------------------

defineProps<BasketProductSubItemProps>();

const { t } = useI18n();

const styles = useStyles(["product.option", "product.pricing"], {}, config);
</script>
