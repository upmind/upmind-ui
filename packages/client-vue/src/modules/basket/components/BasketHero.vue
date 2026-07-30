<template>
  <Hero
    :title="t('cart.basket_title')"
    :subtitle="
      !meta.isFree
        ? t('cart.basket_summary_desc', {
            count: count ?? 0,
            total:
              formatPrice(summary?.total, {
                zeroPriceDisplayIsLabel: ui.zeroPriceDisplay.isLabel,
                trimTrailingZeroes: data.trimTrailingZeroes
              }) ?? 0
          })
        : t('cart.basket_summary_desc_free', {
            count: count ?? 0
          })
    "
    :loading="loading"
  >
    <template #subtitle>
      <Skeleton v-if="loading || !meta.isAvailable" class="h-7 w-80" />
    </template>
    <template #prepend>
      <slot name="prepend" />
    </template>
    <template #append>
      <slot name="append" />
    </template>
  </Hero>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useBasket, useConfig } from "@upmind-automation/headless";
import { useMoney } from "@upmind-automation/headless";
import { Skeleton } from "@upmind-automation/upmind-ui";
import Hero from "../../../components/hero/Hero.vue";

// --- types
import type { BasketHeroProps } from "./types";

defineProps<BasketHeroProps>();

const { t } = useI18n();
const { count, summary, meta } = useBasket();
const { ui, data } = useConfig();
const { formatPrice } = useMoney();
</script>
