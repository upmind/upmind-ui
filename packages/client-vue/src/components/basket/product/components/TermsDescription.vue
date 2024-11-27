<template>
  <span class="text-sm italic leading-5 opacity-35">
    <span>{{
      t(
        `product.terms.${mobile ? "minified" : "descriptive"}.${pricing.cycle}`,
        [
          pricing.cycle && pricing?.cycle >= 12
            ? pricing.regularPrice
            : pricing.currentPrice,
        ]
      )
    }}</span
    ><span v-if="true">, {{ t("product.terms.taxes") }}.</span>
    <span v-else>.</span>
  </span>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- types
import { type BasketProductSummaryPrice } from "@upmind-automation/client-vue";

const { t } = useI18n();

defineProps<{
  pricing: BasketProductSummaryPrice;
  mobile?: boolean;
}>();
</script>
