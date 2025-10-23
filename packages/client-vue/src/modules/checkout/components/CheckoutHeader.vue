<template>
  <Header
    :title="t('text.secure_checkout')"
    :description="
      t('cart.basket_summary_desc', {
        count: products?.length ?? 0,
        total: summary?.total ?? 0
      })
    "
    :badge="
      badge
        ? {
            label: t('text.fully_encrypted_title'),
            icon: 'lock-04'
          }
        : undefined
    "
  />
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { useBasket } from "@upmind-automation/headless";

// --- components
import Header from "../../../components/content/Header.vue";

// --- types
import type { CheckoutHeaderProps } from "./types";

const { t } = useI18n();
const { summary, products } = useBasket();

withDefaults(defineProps<CheckoutHeaderProps>(), {
  badge: true
});
</script>
