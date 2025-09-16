<template>
  <p>
    <template v-if="meta?.oneoff">
      {{ t(`product.terms.price.0`, [price?.currentPrice]) }}
    </template>

    <template v-else-if="meta?.useMonthlyFromPrice">
      {{ t(`product.terms.price.1`, [price?.monthlyFromCurrentPrice]) }}
      <del v-if="meta?.discounted" class="text-emphasis-medium">
        {{ t("product.was", [price?.monthlyFromRegularPrice]) }}
      </del>
    </template>

    <template v-else>
      {{ t(`product.terms.price.${cycle}`, [price?.currentPrice]) }}
      <del v-if="meta?.discounted" class="text-emphasis-medium">
        {{ t("product.was", [price?.regularPrice]) }}
      </del>
    </template>
  </p>
</template>

<script setup lang="ts">
import type {
  Price,
  ProductDetails,
  ProductSummaryMeta,
  TermDetails
} from "@upmind-automation/headless";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps<TermDetails>();
</script>
