<template>
  <Description>
    {{ t(`product.terms.billing.${props.cycle}`, [props.currentPrice]) }}.
    <template v-if="props.meta?.discounted && cycle !== 0"
      >{{ t("product.terms.renews", [regularPrice]) }}.
    </template>
    <template v-if="props.meta?.includesTax"
      >{{ t("product.terms.taxes") }}.</template
    >
    <template v-else>{{ t("product.terms.taxesExcluded") }}.</template>
  </Description>
</template>

<script lang="ts" setup>
// components
import Description from "../../../../components/content/Description.vue";

// --- external
import { useI18n } from "vue-i18n";

// --- types
import type { BasketProductSummaryPrice } from "@upmind-automation/headless-vue";
// -----------------------------------------------------------------------------

const { t } = useI18n();

const props = defineProps<BasketProductSummaryPrice>();
</script>
