<template>
  <Header
    :title="t('text.secure_checkout')"
    :description="
      t('cart.basket_summary_desc', {
        count: products?.length ?? 0,
        total: summary?.total ?? 0
      })
    "
    :badge="{
      label: t('text.fully_encrypted_title'),
      icon: 'lock-04'
    }"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useBasket } from "@upmind-automation/headless";
import Header from "../../../components/content/Header.vue";

const { t } = useI18n();
const { summary, products } = useBasket();
</script>
