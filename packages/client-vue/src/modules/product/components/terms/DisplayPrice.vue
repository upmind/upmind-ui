<template>
  <p>
    <template v-if="meta?.oneoff">
      {{ t(`term.price_0_msg`, { price: price?.currentPrice }) }}
    </template>

    <template v-else-if="meta?.useMonthlyFromPrice">
      {{ t(`term.price_1_msg`, { price: price?.monthlyFromCurrentPrice }) }}
      <del v-if="meta?.discounted" class="text-emphasis-medium">
        {{ t("text.price_was", { price: price?.monthlyFromRegularPrice }) }}
      </del>
    </template>

    <template v-else>
      {{ t(`term.price_${cycle}_msg`, { price: price?.currentPrice }) }}
      <del v-if="meta?.discounted" class="text-emphasis-medium">
        {{ t("text.price_was", { price: price?.regularPrice }) }}
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

defineProps<Omit<TermDetails, "name">>();
</script>
