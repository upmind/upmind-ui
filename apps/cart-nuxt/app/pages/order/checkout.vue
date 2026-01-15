<template>
  <UpmCheckout
    :storefront-route="{ name: ROUTE.STOREFRONT }"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
    :fields-route="{ name: ROUTE.BASKET }"
  />
</template>

<script lang="ts" setup>
import { UpmCheckout } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// SEO: Checkout page - noindex
useHead({
  title: t("seo.page_checkout_title")
});

useSeoMeta({
  description: t("seo.page_checkout_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.CHECKOUT
});
</script>
