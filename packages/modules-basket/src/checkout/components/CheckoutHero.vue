<template>
  <Hero
    :title="t('text.secure_checkout')"
    :data-attrs="{ 'data-test-key': 'checkout-heading' }"
    :subtitle="
      t('cart.basket_summary_desc', {
        count: products?.length ?? 0,
        total: summary?.total ?? 0
      })
    "
    :badge="{
      label: t('text.fully_encrypted_title'),
      icon: 'lock-04',
      variant: 'neutral',
      appearance: 'outline'
    }"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Hero } from "@upmind-automation/foundation";
import { useBasket } from "@upmind-automation/headless";

const { t } = useI18n();
const { summary, products } = useBasket();
</script>
