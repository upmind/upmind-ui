<template>
  <Hero
    :title="t('cart.basket_title')"
    :description="
      t('cart.basket_summary_desc', {
        count: count ?? 0,
        total: summary?.total ?? 0
      })
    "
  >
    <template #prepend>
      <slot name="prepend" />
    </template>
    <template #append>
      <slot name="append" />
    </template>
  </Hero>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useBasket } from "@upmind-automation/headless";

// --- components
import Hero from "../../../components/hero/Hero.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { count, summary } = useBasket();
</script>
