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
    :badge="
      showBadge
        ? {
            label: t('text.fully_encrypted_title'),
            icon: 'lock-04'
          }
        : undefined
    "
  />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useBasket } from "@upmind-automation/headless";
import Hero from "../../../components/hero/Hero.vue";
import { CHECKOUT_TEMPLATE } from "../types";
import type { CheckoutHeroProps } from "../types";

const { t } = useI18n();
const { summary, products } = useBasket();

const props = defineProps<CheckoutHeroProps>();

const showBadge = computed(() => {
  return props.template !== CHECKOUT_TEMPLATE.TWO_COLUMN_LTR;
});
</script>
