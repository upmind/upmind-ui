<template>
  <UpmCheckout
    :storefront-route="storefrontRoute"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
    :fields-route="{ name: ROUTE.BASKET }"
    :billing-route="{ name: ROUTE.BILLING }"
  />
</template>

<script lang="ts" setup>
import { UpmCheckout } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";
import { useStorefrontRoute } from "~/composables/useStorefrontRoute";
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

// Schema.org: CheckoutPage
useSchemaOrg([
  defineWebPage({
    "@type": "CheckoutPage",
    name: t("seo.page_checkout_title"),
    description: t("seo.page_checkout_description")
  })
]);

definePageMeta({
  name: ROUTE.CHECKOUT,
  actionEmptyBasket: true
});
const { storefrontRoute } = useStorefrontRoute();
</script>
