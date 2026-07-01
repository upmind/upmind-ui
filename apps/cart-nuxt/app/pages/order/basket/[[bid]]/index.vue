<template>
  <UpmBasket
    :storefront-route="storefrontRoute"
    :basket-route="{ name: ROUTE.BASKET }"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmBasket } from "@upmind-automation/client-vue";
import { useStorefrontRoute } from "~/composables/useStorefrontRoute";
import { ROUTE } from "~/funnels/types";

const { t } = useI18n();

// SEO: Shopping cart page - noindex
useHead({
  title: t("seo.page_basket_title")
});

useSeoMeta({
  description: t("seo.page_basket_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.BASKET,
  actionEmptyBasket: true
});
const { storefrontRoute } = useStorefrontRoute();
</script>
